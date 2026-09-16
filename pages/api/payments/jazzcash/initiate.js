import { initiateJazzCashPayment } from '../../../../utils/jazzcashClient';
import { addTransaction, getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { creditUserBalance, recordTransactionRecord } from '../../../../utils/walletStore';
import { db } from '../../../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, amountInPKR, mobileNumber, payer_name = 'Player' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  if (!mobileNumber) {
    return res.status(400).json({ error: 'JazzCash Mobile Account number is required (03xxxxxxxxx)' });
  }

  try {
    // 1. Fetch current exchange rate and settings from Firestore
    let pkrRate = 1.0;
    let merchantId = process.env.JAZZCASH_MERCHANT_ID || '74584985';
    let password = process.env.JAZZCASH_PASSWORD || 'qo38057jbm';
    let integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m';

    try {
      const snap = await getDoc(doc(db, 'settings', 'payment_gateways'));
      if (snap.exists()) {
        const s = snap.data();
        if (s.pkr_rate) pkrRate = parseFloat(s.pkr_rate) || 1.0;
        if (s.jazzcash_merchant_id) merchantId = s.jazzcash_merchant_id;
        if (s.jazzcash_password) password = s.jazzcash_password;
        if (s.jazzcash_integrity_salt) integritySalt = s.jazzcash_integrity_salt;
      }
    } catch (e) {}

    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');
    const returnUrl = `${host}/api/payments/jazzcash/callback`;

    // 2. Call JazzCash MWallet REST API v1.1
    const result = await initiateJazzCashPayment({
      amountInPKR: numAmount,
      mobileNumber,
      description: `WinX Pro Wallet Deposit: Pi ${inGameAmount}`,
      returnUrl,
      merchantId,
      password,
      integritySalt
    });

    const txnRefNo = result.txnRefNo;

    // 3. Insert transaction record in persistent store & Firestore
    recordTransactionRecord({
      id: txnRefNo,
      user_id,
      type: 'deposit',
      amount: inGameAmount,
      status: result.success ? 'completed' : 'pending',
      method: 'JazzCash Direct (MWallet)',
      tx_id: txnRefNo,
      notes: `JazzCash Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Phone: ${mobileNumber}`,
      metadata: {
        txnRefNo,
        account_number: mobileNumber,
        msisdn: mobileNumber,
        responseCode: result.responseCode,
        responseMessage: result.responseMessage
      }
    });

    try {
      await addTransaction({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: result.success ? 'completed' : 'pending',
        notes: `JazzCash Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${txnRefNo} | Phone: ${mobileNumber}`,
        metadata: {
          txnRefNo,
          account_number: mobileNumber,
          msisdn: mobileNumber,
          responseCode: result.responseCode,
          responseMessage: result.responseMessage
        }
      });
    } catch (fErr) {}

    // 4. If transaction was instantly successful, credit wallet
    if (result.success) {
      creditUserBalance(user_id, inGameAmount, '', `JazzCash Deposit Ref: ${txnRefNo}`);
      try {
        const fWallet = await getOrCreateWallet(user_id);
        const curBal = Number(fWallet?.balance || 0);
        await updateWalletBalance(user_id, curBal + inGameAmount);
      } catch (fErr) {}
    }

    return res.status(200).json({
      success: result.success,
      isPending: result.isPending || !result.success,
      responseCode: result.responseCode,
      responseMessage: result.responseMessage,
      txnRefNo,
      inGameAmount,
      credited: result.success
    });

  } catch (err) {
    console.error('JazzCash initiate error:', err);
    return res.status(500).json({ error: err.message || 'JazzCash transaction initiation failed' });
  }
}
