import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const body = req.method === 'POST' ? req.body : req.query;
  const { pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage, pp_Amount, pp_RetreivalReferenceNo } = body || {};

  console.log('JazzCash Return Callback received:', body);

  if (!pp_TxnRefNo) {
    return res.redirect('/wallet?jazzcash_status=unknown');
  }

  try {
    const isSuccess = pp_ResponseCode === '000';

    // Find pending transaction
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_id', pp_TxnRefNo)
      .single();

    if (tx && isSuccess && tx.status !== 'completed') {
      // Credit wallet
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

      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          notes: `${tx.notes || ''} | Completed via Callback: ${pp_RetreivalReferenceNo || ''}`
        })
        .eq('id', tx.id);
    }

    const redirectStatus = isSuccess ? 'success' : 'failed';
    return res.redirect(`/wallet?jazzcash_status=${redirectStatus}&txn_id=${encodeURIComponent(pp_TxnRefNo)}`);
  } catch (err) {
    console.error('JazzCash callback processing error:', err);
    return res.redirect(`/wallet?jazzcash_status=error&txn_id=${encodeURIComponent(pp_TxnRefNo)}`);
  }
}
