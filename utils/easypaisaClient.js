import crypto from 'crypto';

const EASYPAISA_DEFAULT_STORE_ID = process.env.EASYPAISA_STORE_ID || '43';
const EASYPAISA_DEFAULT_HASH_KEY = process.env.EASYPAISA_HASH_KEY || '1234567890123456';
const EASYPAISA_PROD_URL = 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';
const EASYPAISA_STG_URL = 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf';

/**
 * Format date for Easypaisa: YYYYMMDD HHMMSS
 */
export function getEasypaisaExpiryDate(hours = 24) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd} ${hh}${min}${ss}`;
}

/**
 * Generate AES/ECB/PKCS5Padding hash for Easypaisa
 * Algorithm:
 * 1. Sort all fields alphabetically by key
 * 2. Create string: field1=val1&field2=val2...
 * 3. Encrypt with AES-128-ECB
 */
export function generateEasypaisaHash(fields, hashKey = EASYPAISA_DEFAULT_HASH_KEY) {
  try {
    const sortedKeys = Object.keys(fields)
      .filter(k => k !== 'merchantHashedReq' && fields[k] !== undefined && fields[k] !== null && String(fields[k]).trim() !== '')
      .sort();

    const keyValuePairs = sortedKeys.map(k => `${k}=${fields[k]}`);
    const plainString = keyValuePairs.join('&');

    // Ensure key is 16 bytes for AES-128
    let keyBuffer = Buffer.from(hashKey, 'utf8');
    if (keyBuffer.length < 16) {
      keyBuffer = Buffer.concat([keyBuffer, Buffer.alloc(16 - keyBuffer.length, 0)]);
    } else if (keyBuffer.length > 16) {
      keyBuffer = keyBuffer.subarray(0, 16);
    }

    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(plainString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (err) {
    console.error('Easypaisa AES hash error:', err);
    return '';
  }
}

/**
 * Build EasyPaisa Checkout Payload
 */
export function buildEasypaisaCheckoutData({
  amountInPKR,
  orderRefNum,
  postBackURL,
  paymentMethod = 'MA_PAYMENT_METHOD', // 'MA_PAYMENT_METHOD' | 'CC_PAYMENT_METHOD' | 'OTC_PAYMENT_METHOD'
  mobileNum = '',
  emailAddr = '',
  storeId = EASYPAISA_DEFAULT_STORE_ID,
  hashKey = EASYPAISA_DEFAULT_HASH_KEY,
  isSandbox = false
}) {
  const numAmount = parseFloat(amountInPKR);
  const formattedAmount = numAmount.toFixed(1); // Easypay requires 1 decimal point e.g. "10.0"
  const expiryDate = getEasypaisaExpiryDate(24);
  const uniqueOrderRef = orderRefNum || `EP${Date.now()}`;

  let cleanMobile = String(mobileNum || '').trim().replace(/[^0-9]/g, '');
  if (cleanMobile.startsWith('92')) {
    cleanMobile = '0' + cleanMobile.substring(2);
  }

  const fields = {
    amount: formattedAmount,
    autoRedirect: '1',
    emailAddr: emailAddr || 'player@winxpro.com',
    expiryDate: expiryDate,
    mobileNum: cleanMobile,
    orderRefNum: uniqueOrderRef,
    paymentMethod: paymentMethod,
    postBackURL: postBackURL,
    storeId: String(storeId)
  };

  const merchantHashedReq = generateEasypaisaHash(fields, hashKey);
  fields.merchantHashedReq = merchantHashedReq;

  return {
    actionUrl: isSandbox ? EASYPAISA_STG_URL : EASYPAISA_PROD_URL,
    fields,
    orderRefNum: uniqueOrderRef,
    amount: numAmount
  };
}
