import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const data = req.method === 'POST' ? req.body : req.query;
  const { auth_token, status, desc, orderRefNumber, orderRefNum } = data || {};

  const ref = orderRefNumber || orderRefNum;
  console.log('EasyPaisa Callback received:', { status, desc, ref, auth_token });

  if (!ref && !auth_token) {
    return res.redirect('/wallet?easypaisa_status=unknown');
  }

  try {
    const isSuccess = status === '0000' || status === 'Success' || status === '00';

    if (ref) {
      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .eq('tx_id', ref)
        .single();

      if (tx && isSuccess && tx.status !== 'completed') {
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
            notes: `${tx.notes || ''} | Verified EasyPaisa Code: ${desc || status}`
          })
          .eq('id', tx.id);
      }
    }

    const redirectStatus = isSuccess ? 'success' : 'failed';
    return res.redirect(`/wallet?easypaisa_status=${redirectStatus}&orderRefNum=${encodeURIComponent(ref || '')}`);
  } catch (err) {
    console.error('EasyPaisa callback error:', err);
    return res.redirect(`/wallet?easypaisa_status=error&orderRefNum=${encodeURIComponent(ref || '')}`);
  }
}
