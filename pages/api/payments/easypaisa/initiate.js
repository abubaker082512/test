import { buildEasypaisaCheckoutData } from '../../../../utils/easypaisaClient';
import { addTransaction } from '../../../../utils/firebaseDb';
import { recordTransactionRecord } from '../../../../utils/walletStore';
import { db } from '../../../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    user_id,
    amountInPKR,
    mobileNumber,
    email,
    payment_method = 'MA_PAYMENT_METHOD' // 'MA_PAYMENT_METHOD' | 'CC_PAYMENT_METHOD' | 'OTC_PAYMENT_METHOD'
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  try {
    // 1. Fetch settings from Firestore
    let pkrRate = 1.0;
    let storeId = process.env.EASYPAISA_STORE_ID || '43';
    let hashKey = process.env.EASYPAISA_HASH_KEY || '1234567890123456';
    let isSandbox = false;

    try {
      const snap = await getDoc(doc(db, 'settings', 'payment_gateways'));
      if (snap.exists()) {
        const s = snap.data();
        if (s.pkr_rate) pkrRate = parseFloat(s.pkr_rate) || 1.0;
        if (s.easypaisa_store_id) storeId = s.easypaisa_store_id;
        if (s.easypaisa_hash_key) hashKey = s.easypaisa_hash_key;
        if (s.easypaisa_sandbox !== undefined) isSandbox = Boolean(s.easypaisa_sandbox);
      }
    } catch (e) {}

    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');
    const postBackURL = `${host}/api/payments/easypaisa/callback`;

    const orderRefNum = `EP${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    // 2. Build EasyPay Form Payload
    const checkoutData = buildEasypaisaCheckoutData({
      amountInPKR: numAmount,
      orderRefNum,
      postBackURL,
      paymentMethod: payment_method,
      mobileNum: mobileNumber,
      emailAddr: email || 'player@winxpro.com',
      storeId,
      hashKey,
      isSandbox
    });

    // 3. Store pending transaction in walletStore & Firestore
    recordTransactionRecord({
      id: orderRefNum,
      user_id,
      email: email || '',
      type: 'deposit',
      amount: inGameAmount,
      status: 'pending',
      method: `EasyPaisa Direct (${payment_method === 'CC_PAYMENT_METHOD' ? 'Card' : 'Mobile Account'})`,
      tx_id: orderRefNum,
      notes: `EasyPaisa Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Phone: ${mobileNumber}`,
      metadata: {
        orderRefNum,
        account_number: mobileNumber,
        msisdn: mobileNumber,
        paymentMethod: payment_method
      }
    });

    try {
      addTransaction({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        notes: `EasyPaisa Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${orderRefNum} | Phone: ${mobileNumber}`,
        metadata: {
          orderRefNum,
          account_number: mobileNumber,
          msisdn: mobileNumber,
          paymentMethod: payment_method
        }
      }).catch(() => {});
    } catch (fErr) {}

    const hasConfiguredStore = Boolean(
      storeId && String(storeId).trim() !== '43' &&
      hashKey && String(hashKey).trim() !== '1234567890123456'
    );

    return res.status(200).json({
      success: true,
      hasConfiguredStore,
      actionUrl: checkoutData.actionUrl,
      fields: checkoutData.fields,
      orderRefNum,
      inGameAmount
    });

  } catch (err) {
    console.error('EasyPaisa initiate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate EasyPaisa transaction' });
  }
}
