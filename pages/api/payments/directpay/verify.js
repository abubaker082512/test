import { createClient } from '@supabase/supabase-js';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, findTransaction } from '../../../../utils/walletStore';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txn_id, user_id, amount, email } = req.body;

  if (!txn_id) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    const numAmount = parseFloat(amount) || 0;
    const targetUserId = user_id || 'player_' + Date.now();

    // 1. Complete transaction and credit balance atomically in persistent store
    const result = completeAndCreditTransaction(txn_id, {
      amount: numAmount,
      user_id: targetUserId,
      email: email || '',
      method: 'DirectPay',
      notes: `DirectPay Payment Verified: Pi ${numAmount.toFixed(2)} | TxID: ${txn_id}`
    });

    // 2. Background sync to Firestore and Supabase (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const fWallet = await getOrCreateWallet(targetUserId);
        const curBal = Number(fWallet?.balance || 0);
        await updateWalletBalance(targetUserId, curBal + (result.transaction.amount || numAmount));
      } catch (fErr) {}

      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', targetUserId)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + (result.transaction.amount || numAmount) })
            .eq('user_id', targetUserId);
        } else {
          await supabase
            .from('wallets')
            .insert({ user_id: targetUserId, balance: result.transaction.amount || numAmount });
        }

        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('tx_id', txn_id);
      } catch (dbErr) {}
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
