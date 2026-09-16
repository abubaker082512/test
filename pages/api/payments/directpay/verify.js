import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, failTransaction, findTransaction } from '../../../../utils/walletStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txn_id, user_id, amount, email, status } = req.body;

  if (!txn_id) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    const numAmount = parseFloat(amount) || 0;
    const targetUserId = user_id || 'player_' + Date.now();

    if (status === 'failed' || status === 'cancelled') {
      failTransaction(txn_id, 'Payment cancelled or declined by user');
      return res.status(200).json({
        success: true,
        status: 'failed',
        message: 'Transaction marked as failed/cancelled.'
      });
    }

    // 1. Complete transaction and credit balance atomically in persistent store
    const result = completeAndCreditTransaction(txn_id, {
      amount: numAmount,
      user_id: targetUserId,
      email: email || '',
      method: 'DirectPay',
      notes: `DirectPay Payment Verified: Pi ${numAmount.toFixed(2)} | TxID: ${txn_id}`
    });

    // 2. Background sync to Firestore (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const fWallet = await getOrCreateWallet(targetUserId);
        const curBal = Number(fWallet?.balance || 0);
        await updateWalletBalance(targetUserId, curBal + (result.transaction.amount || numAmount));
      } catch (fErr) {}
    });

    return res.status(200).json({
      success: true,
      status: 'completed',
      creditedAmount: result.transaction.amount || numAmount,
      balance: result.wallet.balance,
      message: `🎉 Successfully credited Pi ${(result.transaction.amount || numAmount).toFixed(2)} to your balance!`
    });
  } catch (err) {
    console.error('DirectPay verification error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
