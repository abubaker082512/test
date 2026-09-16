import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, failTransaction } from '../../../../utils/walletStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const clientTransactionId = payload.client_transaction_id || payload.clientTransactionId || payload.txn_id;
  const status = (payload.status || (payload.success ? 'completed' : 'pending')).toLowerCase();
  const amount = parseFloat(payload.amount || payload.amountInPKR || 0);

  if (!clientTransactionId) {
    return res.status(400).json({ error: 'Missing client_transaction_id in webhook payload' });
  }

  try {
    if (status === 'completed' || status === 'success' || status === 'paid' || status === '0000') {
      const result = completeAndCreditTransaction(clientTransactionId, {
        amount,
        method: 'DirectPay',
        notes: `DirectPay Webhook Completed: Pi ${amount.toFixed(2)}`
      });

      // Background sync to Firestore
      Promise.resolve().then(async () => {
        try {
          const fWallet = await getOrCreateWallet(result.transaction.user_id);
          const curBal = Number(fWallet?.balance || 0);
          await updateWalletBalance(result.transaction.user_id, curBal + result.transaction.amount);
        } catch (fErr) {}
      });

      return res.status(200).json({ success: true, status: 'completed', message: 'Transaction completed and balance credited' });
    } else if (status === 'failed' || status === 'cancelled' || status === 'declined' || status === 'failure') {
      failTransaction(clientTransactionId, payload.reason || payload.message || 'DirectPay webhook marked failed');
      return res.status(200).json({ success: true, status: 'failed', message: 'Transaction recorded as failed' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (err) {
    console.error('DirectPay webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
