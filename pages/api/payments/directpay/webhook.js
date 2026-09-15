import { createClient } from '@supabase/supabase-js';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Allow POST webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const clientTransactionId = payload.client_transaction_id || payload.clientTransactionId || payload.txn_id;
  const status = payload.status || (payload.success ? 'completed' : 'pending');

  if (!clientTransactionId) {
    return res.status(400).json({ error: 'Missing client_transaction_id in webhook payload' });
  }

  try {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_id', clientTransactionId)
      .single();

    if (txError || !tx) {
      return res.status(404).json({ error: 'Transaction record not found' });
    }

    if (tx.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Already completed' });
    }

    if (status === 'completed' || status === 'success' || status === 'PAID') {
      // Credit wallet in Firestore & Supabase
      try {
        const fWallet = await getOrCreateWallet(tx.user_id);
        const curBal = Number(fWallet?.balance || 0);
        await updateWalletBalance(tx.user_id, curBal + tx.amount);
      } catch (fErr) {}

      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', tx.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + tx.amount })
            .eq('user_id', tx.user_id);
        } else {
          await supabase
            .from('wallets')
            .insert({ user_id: tx.user_id, balance: tx.amount });
        }
      } catch (sErr) {}

      try {
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', tx.id);
      } catch (tErr) {}

      return res.status(200).json({ success: true, message: 'Transaction completed and balance credited' });
    } else if (status === 'failed' || status === 'FAILED' || status === 'cancelled') {
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', tx.id);

      return res.status(200).json({ success: true, message: 'Transaction marked failed' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (err) {
    console.error('DirectPay webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
