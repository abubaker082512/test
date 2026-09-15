import { createClient } from '@supabase/supabase-js';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txn_id, user_id } = req.body;

  if (!txn_id) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    // 1. Fetch the transaction record
    const { data: tx, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_id', txn_id)
      .single();

    if (fetchErr || !tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify ownership if user_id is passed
    if (user_id && tx.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized transaction query' });
    }

    if (tx.status === 'completed') {
      return res.status(200).json({
        success: true,
        status: 'completed',
        amount: tx.amount,
        message: 'Transaction already completed and credited.'
      });
    }

    // 2. Mark completed and credit the user's wallet in both Firestore and Supabase
    const targetUserId = tx.user_id || user_id;
    try {
      const fWallet = await getOrCreateWallet(targetUserId);
      const curBal = Number(fWallet?.balance || 0);
      await updateWalletBalance(targetUserId, curBal + tx.amount);
    } catch (fErr) {
      console.warn('Firestore wallet credit note:', fErr?.message);
    }

    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + tx.amount })
          .eq('user_id', targetUserId);
      } else {
        await supabase
          .from('wallets')
          .insert({ user_id: targetUserId, balance: tx.amount });
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', tx.id);
    } catch (dbErr) {
      console.warn('Supabase wallet update note:', dbErr?.message);
    }

    return res.status(200).json({
      success: true,
      status: 'completed',
      creditedAmount: tx.amount,
      message: `Successfully credited Pi ${tx.amount.toFixed(2)} to your wallet!`
    });
  } catch (err) {
    console.error('DirectPay verification error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
