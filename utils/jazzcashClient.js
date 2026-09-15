import crypto from 'crypto';

const JAZZCASH_DEFAULT_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '74584985';
const JAZZCASH_DEFAULT_PASSWORD = process.env.JAZZCASH_PASSWORD || 'qo38057jbm';
const JAZZCASH_DEFAULT_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m';

const JAZZCASH_API_ENDPOINT = 'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/api/v1/rest/payments/m-wallet';

/**
 * Format current date/time to Pakistan Standard Time (PKT - UTC+5)
 * Format: YYYYMMDDHHMMSS
 */
export function getPKTTimestamps() {
  const now = new Date();
  // PKT is UTC+5
  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const pktExpiry = new Date(now.getTime() + (24 + 5) * 60 * 60 * 1000);

  const format = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  };

  return {
    txnDateTime: format(pktTime),
    txnExpiryDateTime: format(pktExpiry)
  };
}

/**
 * Generate JazzCash Secure Hash
 * 1. Sort all non-empty fields alphabetically by field name (excluding pp_SecureHash)
 * 2. Concatenate values with '&' separated
 * 3. Prefix with IntegritySalt + '&'
 * 4. Compute SHA-256 (uppercase hex)
 */
export function generateJazzCashHash(params, integritySalt) {
  const salt = integritySalt || JAZZCASH_DEFAULT_INTEGRITY_SALT;
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'pp_SecureHash' && params[k] !== undefined && params[k] !== null && String(params[k]).trim() !== '')
    .sort();

  const stringValues = sortedKeys.map(k => String(params[k]));
  const hashString = `${salt}&${stringValues.join('&')}`;

  return crypto.createHash('sha256').update(hashString, 'utf8').digest('hex').toUpperCase();
}

/**
 * Initiate JazzCash MWallet REST API v1.1 Payment
 */
export async function initiateJazzCashPayment({
  amountInPKR,
  mobileNumber,
  billReference,
  description = 'BetPK Wallet Deposit',
  returnUrl = '',
  merchantId = JAZZCASH_DEFAULT_MERCHANT_ID,
  password = JAZZCASH_DEFAULT_PASSWORD,
  integritySalt = JAZZCASH_DEFAULT_INTEGRITY_SALT
}) {
  const { txnDateTime, txnExpiryDateTime } = getPKTTimestamps();
  const numAmount = parseFloat(amountInPKR);
  // JazzCash expects amount * 100 as string
  const ppAmount = Math.round(numAmount * 100).toString();

  // Normalize mobile number (03xxxxxxxxx)
  let cleanMobile = String(mobileNumber || '').trim().replace(/[^0-9]/g, '');
  if (cleanMobile.startsWith('92')) {
    cleanMobile = '0' + cleanMobile.substring(2);
  } else if (cleanMobile.length === 10 && cleanMobile.startsWith('3')) {
    cleanMobile = '0' + cleanMobile;
  }

  // Unique TxnRefNo: e.g. T20260915191446 + 4 random digits (max 20 alphanumeric chars)
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const txnRefNo = `T${txnDateTime.substring(2)}${randSuffix}`.substring(0, 20);
  const billRef = billReference || `B${txnDateTime.substring(2)}${randSuffix}`.substring(0, 20);

  const payload = {
    pp_Amount: ppAmount,
    pp_BillReference: billRef,
    pp_Description: description.substring(0, 100),
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_ReturnURL: returnUrl || 'https://winxpro.com/api/payments/jazzcash/callback',
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_TxnRefNo: txnRefNo,
    pp_TxnType: 'MWALLET',
    pp_Version: '1.1',
    ppmpf_1: cleanMobile,
    ppmpf_2: '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: ''
  };

  // Compute Secure Hash
  payload.pp_SecureHash = generateJazzCashHash(payload, integritySalt);

  try {
    const response = await fetch(JAZZCASH_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json().catch(async () => {
      const text = await response.text();
      return { raw: text, pp_ResponseCode: '999', pp_ResponseMessage: text || 'Non-JSON response' };
    });

    return {
      success: responseData.pp_ResponseCode === '000',
      isPending: responseData.pp_ResponseCode === '124' || responseData.pp_ResponseCode === '001',
      responseCode: responseData.pp_ResponseCode || 'UNKNOWN',
      responseMessage: responseData.pp_ResponseMessage || responseData.message || 'Payment request sent',
      txnRefNo,
      billReference: billRef,
      raw: responseData,
      payload
    };
  } catch (err) {
    console.error('JazzCash MWallet API request error:', err);
    return {
      success: false,
      isPending: false,
      responseCode: 'NETWORK_ERROR',
      responseMessage: err.message || 'Failed to communicate with JazzCash API',
      txnRefNo,
      billReference: billRef,
      payload
    };
  }
}
