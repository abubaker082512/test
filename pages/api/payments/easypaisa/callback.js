import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, failTransaction } from '../../../../utils/walletStore';

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
      if (isSuccess) {
        const result = completeAndCreditTransaction(ref, {
          method: 'EasyPaisa Direct',
          notes: `Verified EasyPaisa Code: ${desc || status}`
        });

        // Credit in Firestore
        try {
          await updateWalletBalance(result.transaction.user_id, result.wallet.balance);
        } catch (fErr) {}
      } else {
        failTransaction(ref, desc || status || 'EasyPaisa payment declined');
      }
    }

    const redirectStatus = isSuccess ? 'success' : 'failed';
    return res.redirect(`/wallet?easypaisa_status=${redirectStatus}&orderRefNum=${encodeURIComponent(ref || '')}`);
  } catch (err) {
    console.error('EasyPaisa callback error:', err);
    return res.redirect(`/wallet?easypaisa_status=error&orderRefNum=${encodeURIComponent(ref || '')}`);
  }
}
