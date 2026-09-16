import { db } from '../../../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { buildDirectPayUrl } from '../../../../utils/directPayClient';
import { addTransaction } from '../../../../utils/firebaseDb';
import { recordTransactionRecord } from '../../../../utils/walletStore';

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux';
const DEFAULT_CLIENT_SECRET = process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, amountInPKR, payer_name, email, msisdn, currency = 'PKR', payment_method = 'Easypaisa' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  if (!msisdn) {
    return res.status(400).json({ error: 'Mobile number is required (03xxxxxxxxx)' });
  }

  try {
    let pkrRate = 1.0;
    let clientId = DEFAULT_CLIENT_ID;
    let clientSecret = DEFAULT_CLIENT_SECRET;

    // 1. Fetch real-time settings from Firestore and Supabase
    try {
      const docRef = doc(db, 'settings', 'payment_gateways');
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
      ]);
      if (snap && snap.exists()) {
        const s = snap.data();
        if (s.directpay_client_id) clientId = s.directpay_client_id;
        if (s.directpay_client_secret) clientSecret = s.directpay_client_secret;
        if (s.pkr_rate) pkrRate = parseFloat(s.pkr_rate) || 1.0;
      }
    } catch (e) {}

    try {
      const { data: sbData } = await Promise.race([
        supabase.from('currency_rates').select('*').eq('id', 1).single(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
      ]);
      if (sbData) {
        if (sbData.directpay_client_id) clientId = sbData.directpay_client_id;
        if (sbData.directpay_client_secret) clientSecret = sbData.directpay_client_secret;
        if (sbData.pkr_rate) pkrRate = parseFloat(sbData.pkr_rate) || pkrRate;
      }
    } catch (e) {}

    // Calculate in-game Pi points
    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    // 2. Generate unique client transaction ID (max 50 chars, alphanumeric with dashes)
    const clientTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 3. Determine host origin for redirect URLs
    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://www.winxpro.com.pk');
    const successRedirectUrl = `${host}/wallet?directpay_status=success&txn_id=${encodeURIComponent(clientTransactionId)}&amount=${encodeURIComponent(inGameAmount)}`;
    const failedRedirectUrl = `${host}/wallet?directpay_status=failed&txn_id=${encodeURIComponent(clientTransactionId)}`;

    // 4. Build the DirectPay URL with Checksum immediately
    const paymentUrl = buildDirectPayUrl({
      clientId,
      clientSecret,
      clientTransactionId,
      amountInPKR: numAmount,
      description: 'sheikh abu baker group deposit',
      payerName: payer_name || 'Player',
      email: email || 'player@winxpro.com.pk',
      msisdn: msisdn || '03001234567',
      currency,
      successRedirectUrl,
      failedRedirectUrl
    });

    // 5. Immediate persistent recording in walletStore
    try {
      recordTransactionRecord({
        id: clientTransactionId,
        user_id,
        email: email || '',
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        method: `DirectPay (${payment_method})`,
        tx_id: clientTransactionId,
        notes: `DirectPay ${payment_method} Deposit: ${currency} ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Phone: ${msisdn}`,
        metadata: {
          clientTransactionId,
          account_number: msisdn,
          msisdn,
          amountInPKR: numAmount,
          currency,
          payment_method,
          description: 'sheikh abu baker group deposit'
        }
      });
    } catch (e) {}

    // Background sync to Firestore (non-blocking)
    try {
      addTransaction({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        notes: `DirectPay ${payment_method} Deposit: ${currency} ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Phone: ${msisdn}`,
        metadata: {
          clientTransactionId,
          account_number: msisdn,
          msisdn,
          amountInPKR: numAmount,
          currency,
          payment_method,
          description: 'sheikh abu baker group deposit'
        }
      }).catch(() => {});
    } catch (e) {}

    return res.status(200).json({
      success: true,
      paymentUrl,
      clientTransactionId,
      inGameAmount,
      currency
    });
  } catch (err) {
    console.error('DirectPay initiation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate DirectPay payment' });
  }
}
