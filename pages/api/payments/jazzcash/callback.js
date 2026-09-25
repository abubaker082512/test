import { completeAndCreditTransaction, failTransaction } from '../../../../utils/walletStore';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';

export default async function handler(req, res) {
  const body = req.method === 'POST' ? req.body : req.query;
  const { pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage, pp_Amount, pp_RetreivalReferenceNo } = body || {};

  console.log('JazzCash Return Callback received:', body);

  if (!pp_TxnRefNo) {
    return res.redirect('/wallet?jazzcash_status=unknown');
  }

  try {
    const isSuccess = pp_ResponseCode === '000';

    if (isSuccess) {
      const result = completeAndCreditTransaction(pp_TxnRefNo, {
        method: 'JazzCash Direct (MWallet)',
        notes: `JazzCash Payment Verified: Ref ${pp_RetreivalReferenceNo || pp_TxnRefNo}`
      });

      try {
        await updateWalletBalance(result.transaction.user_id, result.wallet.balance);
      } catch (fErr) {}
    } else {
      failTransaction(pp_TxnRefNo, pp_ResponseMessage || 'JazzCash payment declined');
    }

    const redirectStatus = isSuccess ? 'success' : 'failed';
    return res.redirect(`/wallet?jazzcash_status=${redirectStatus}&txn_id=${encodeURIComponent(pp_TxnRefNo)}`);
  } catch (err) {
    console.error('JazzCash callback processing error:', err);
    return res.redirect(`/wallet?jazzcash_status=error&txn_id=${encodeURIComponent(pp_TxnRefNo)}`);
  }
}
