import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, failTransaction, recordTransactionRecord } from '../../../../utils/walletStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const clientTransactionId = payload.client_transaction_id || payload.clientTransactionId || payload.txn_id || payload.order_id;
  const gatewayTransactionId = payload.gateway_transaction_id || payload.dp_txn_id || payload.transaction_id || payload.reference_id || payload.bank_ref || payload.id;
  const status = (payload.status || (payload.success ? 'completed' : 'pending')).toLowerCase();
  const amount = parseFloat(payload.amount || payload.amountInPKR || 0);
  const msisdn = payload.msisdn || payload.mobile || payload.account_number || payload.phone || '';

  if (!clientTransactionId && !gatewayTransactionId) {
    return res.status(400).json({ error: 'Missing client_transaction_id or gateway_transaction_id in webhook payload' });
  }

  const targetTxId = clientTransactionId || gatewayTransactionId;

  try {
    if (status === 'completed' || status === 'success' || status === 'paid' || status === '0000') {
      const result = completeAndCreditTransaction(targetTxId, {
        amount,
        method: 'DirectPay',
        notes: `DirectPay Webhook: Pi ${amount.toFixed(2)} | Gateway ID: ${gatewayTransactionId || targetTxId}`
      });

      if (result.transaction) {
        if (!result.transaction.metadata) result.transaction.metadata = {};
        if (gatewayTransactionId) result.transaction.metadata.gateway_transaction_id = gatewayTransactionId;
        if (msisdn) result.transaction.metadata.account_number = msisdn;
        result.transaction.metadata.raw_webhook = payload;
        recordTransactionRecord(result.transaction);
      }

      // Background sync to Firestore
      Promise.resolve().then(async () => {
        try {
          const fWallet = await getOrCreateWallet(result.transaction.user_id);
          const curBal = Number(fWallet?.balance || 0);
          await updateWalletBalance(result.transaction.user_id, curBal + result.transaction.amount);
        } catch (fErr) {}
      });

      return res.status(200).json({
        success: true,
        status: 'completed',
        client_transaction_id: targetTxId,
        gateway_transaction_id: gatewayTransactionId || targetTxId,
        message: 'Transaction completed and balance credited'
      });
    } else if (status === 'failed' || status === 'cancelled' || status === 'declined' || status === 'failure') {
      const failRes = failTransaction(targetTxId, payload.reason || payload.message || 'DirectPay webhook marked failed');
      if (failRes.transaction) {
        if (!failRes.transaction.metadata) failRes.transaction.metadata = {};
        if (gatewayTransactionId) failRes.transaction.metadata.gateway_transaction_id = gatewayTransactionId;
        if (msisdn) failRes.transaction.metadata.account_number = msisdn;
        failRes.transaction.metadata.raw_webhook = payload;
        recordTransactionRecord(failRes.transaction);
      }
      return res.status(200).json({
        success: true,
        status: 'failed',
        client_transaction_id: targetTxId,
        gateway_transaction_id: gatewayTransactionId || targetTxId,
        message: 'Transaction recorded as failed'
      });
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (err) {
    console.error('DirectPay webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
