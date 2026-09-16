import { buildEasypaisaCheckoutData } from '../../../../utils/easypaisaClient';
import { buildDirectPayUrl } from '../../../../utils/directPayClient';
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
    gateway_mode = 'direct_api', // 'direct_api' | 'directpay'
    card_provider = 'jazzcash',  // 'jazzcash' | 'easypaisa'
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    cardHolderName,
    mobileNumber,
    email
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  try {
    let pkrRate = 1.0;
    let clientId = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux';
    let clientSecret = process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';
    let storeId = process.env.EASYPAISA_STORE_ID || '43';
    let hashKey = process.env.EASYPAISA_HASH_KEY || '1234567890123456';
    let isSandbox = false;

    try {
      const snap = await getDoc(doc(db, 'settings', 'payment_gateways'));
      if (snap.exists()) {
        const s = snap.data();
        if (s.pkr_rate) pkrRate = parseFloat(s.pkr_rate) || 1.0;
        if (s.directpay_client_id) clientId = s.directpay_client_id;
        if (s.directpay_client_secret) clientSecret = s.directpay_client_secret;
        if (s.easypaisa_store_id) storeId = s.easypaisa_store_id;
        if (s.easypaisa_hash_key) hashKey = s.easypaisa_hash_key;
        if (s.easypaisa_sandbox !== undefined) isSandbox = Boolean(s.easypaisa_sandbox);
      }
    } catch (e) {}

    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));
    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');

    // Route 1: DirectPay Gateway
    if (gateway_mode === 'directpay') {
      const clientTransactionId = `CARD-DP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const successRedirectUrl = `${host}/wallet?directpay_status=success&txn_id=${encodeURIComponent(clientTransactionId)}&amount=${encodeURIComponent(inGameAmount)}`;
      const failedRedirectUrl = `${host}/wallet?directpay_status=failed&txn_id=${encodeURIComponent(clientTransactionId)}`;

      const paymentUrl = buildDirectPayUrl({
        clientId,
        clientSecret,
        clientTransactionId,
        amountInPKR: numAmount,
        description: 'sheikh abu baker group deposit',
        payerName: cardHolderName || 'Cardholder',
        email: email || 'player@winxpro.com.pk',
        msisdn: mobileNumber || '03001234567',
        currency: 'PKR',
        successRedirectUrl,
        failedRedirectUrl
      });

      recordTransactionRecord({
        id: clientTransactionId,
        user_id,
        email: email || '',
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        method: 'DirectPay (Card)',
        tx_id: clientTransactionId,
        notes: `DirectPay Card Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount})`,
        metadata: { clientTransactionId, account_number: mobileNumber, amountInPKR: numAmount }
      });

      try {
        await addTransaction({
          user_id,
          type: 'deposit',
          amount: inGameAmount,
          status: 'pending',
          notes: `DirectPay Card Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount})`,
          metadata: { clientTransactionId, account_number: mobileNumber, amountInPKR: numAmount }
        });
      } catch (fErr) {}

      return res.status(200).json({
        success: true,
        mode: 'directpay',
        paymentUrl,
        clientTransactionId,
        inGameAmount
      });
    }

    // Route 2: Direct Card API (EasyPaisa CC or JazzCash 3D Secure)
    const postBackURL = `${host}/api/payments/easypaisa/callback`;
    const orderRefNum = `CARD-${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    const checkoutData = buildEasypaisaCheckoutData({
      amountInPKR: numAmount,
      orderRefNum,
      postBackURL,
      paymentMethod: 'CC_PAYMENT_METHOD',
      mobileNum: mobileNumber || '03001234567',
      emailAddr: email || 'card@winxpro.com',
      storeId,
      hashKey,
      isSandbox
    });

    recordTransactionRecord({
      id: orderRefNum,
      user_id,
      email: email || '',
      type: 'deposit',
      amount: inGameAmount,
      status: 'pending',
      method: 'Direct API (Credit/Debit Card)',
      tx_id: orderRefNum,
      notes: `Direct Card Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${orderRefNum}`,
      metadata: { orderRefNum, account_number: mobileNumber, amountInPKR: numAmount }
    });

    try {
      await addTransaction({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        notes: `Direct Card Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${orderRefNum}`,
        metadata: { orderRefNum, account_number: mobileNumber, amountInPKR: numAmount }
      });
    } catch (fErr) {}

    return res.status(200).json({
      success: true,
      mode: 'direct_api',
      actionUrl: checkoutData.actionUrl,
      fields: checkoutData.fields,
      orderRefNum,
      inGameAmount
    });

  } catch (err) {
    console.error('Card initiate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate card payment' });
  }
}
