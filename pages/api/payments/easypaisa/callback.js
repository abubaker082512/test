import { createClient } from '@supabase/supabase-js';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const data = req.method === 'POST' ? req.body : req.query;
  const { auth_token, status, desc, orderRefNumber, orderRefNum } = data || {};

  const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');
  const postBackURL = `${host}/api/payments/easypaisa/callback`;

  // Step 2 Handshake: If Easypay returned auth_token without final status, auto-post to Confirm.jsf
  if (auth_token && !status) {
    const confirmUrl = 'https://easypay.easypaisa.com.pk/easypay/Confirm.jsf';
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Confirming EasyPaisa Payment...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { background: #0f0a1e; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; background: #1a103c; padding: 30px; border-radius: 16px; border: 1px solid #332060; }
            .spinner { border: 4px solid #2a1b54; border-top: 4px solid #00c853; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body onload="document.forms[0].submit()">
          <div class="card">
            <div class="spinner"></div>
            <h3>Finalizing EasyPaisa Checkout...</h3>
            <p>Please wait while we verify your transaction.</p>
            <form action="${confirmUrl}" method="POST">
              <input type="hidden" name="auth_token" value="${auth_token}" />
              <input type="hidden" name="postBackURL" value="${postBackURL}" />
              <noscript><input type="submit" value="Click here to complete payment" /></noscript>
            </form>
          </div>
        </body>
      </html>
    `);
  }

  const ref = orderRefNumber || orderRefNum;
  if (!ref && !status) {
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
        // Credit in Firestore
        try {
          const fWallet = await getOrCreateWallet(tx.user_id);
          const curBal = Number(fWallet?.balance || 0);
          await updateWalletBalance(tx.user_id, curBal + tx.amount);
        } catch (fErr) {}

        // Credit in Supabase
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

          await supabase
            .from('transactions')
            .update({
              status: 'completed',
              notes: `${tx.notes || ''} | Verified EasyPaisa Code: ${desc || status}`
            })
            .eq('id', tx.id);
        } catch (sErr) {}
      }
    }

    const redirectStatus = isSuccess ? 'success' : 'failed';
    return res.redirect(`/wallet?easypaisa_status=${redirectStatus}&orderRefNum=${encodeURIComponent(ref || '')}`);
  } catch (err) {
    console.error('EasyPaisa callback error:', err);
    return res.redirect(`/wallet?easypaisa_status=error&orderRefNum=${encodeURIComponent(ref || '')}`);
  }
}
