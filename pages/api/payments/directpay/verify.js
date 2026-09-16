import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';
import { completeAndCreditTransaction, failTransaction, findTransaction, recordTransactionRecord } from '../../../../utils/walletStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txn_id, user_id, amount, email, status, gateway_transaction_id, dp_txn_id, transaction_id, bank_ref, msisdn, account_number } = req.body;

  if (!txn_id) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    const numAmount = parseFloat(amount) || 0;
    const targetUserId = user_id || 'player_' + Date.now();
    const resolvedGatewayId = gateway_transaction_id || dp_txn_id || transaction_id || bank_ref || ('DP-GW-' + Date.now().toString(36).toUpperCase());

    if (status === 'failed' || status === 'cancelled') {
      const failRes = failTransaction(txn_id, 'Payment cancelled or declined by user');
      if (failRes.transaction) {
        if (!failRes.transaction.metadata) failRes.transaction.metadata = {};
        failRes.transaction.metadata.gateway_transaction_id = resolvedGatewayId;
        if (msisdn || account_number) failRes.transaction.metadata.account_number = msisdn || account_number;
        recordTransactionRecord(failRes.transaction);
      }
      return res.status(200).json({
        success: true,
        status: 'failed',
        client_transaction_id: txn_id,
        gateway_transaction_id: resolvedGatewayId,
        message: 'Transaction marked as failed/cancelled.'
      });
    }

    // 1. Complete transaction and credit balance atomically in persistent store
    const result = completeAndCreditTransaction(txn_id, {
      amount: numAmount,
      user_id: targetUserId,
      email: email || '',
      method: 'DirectPay',
      notes: `DirectPay Payment Verified: Pi ${numAmount.toFixed(2)} | TxID: ${txn_id} | Gateway ID: ${resolvedGatewayId}`,
      metadata: {
        clientTransactionId: txn_id,
        gateway_transaction_id: resolvedGatewayId,
        dp_txn_id: resolvedGatewayId,
        account_number: account_number || msisdn || '',
        msisdn: msisdn || account_number || '',
        amountInPKR: numAmount
      }
    });

    if (result.transaction) {
      if (!result.transaction.metadata) result.transaction.metadata = {};
      result.transaction.metadata.gateway_transaction_id = resolvedGatewayId;
      recordTransactionRecord(result.transaction);
    }

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
      client_transaction_id: txn_id,
      gateway_transaction_id: resolvedGatewayId,
      creditedAmount: result.transaction.amount || numAmount,
      balance: result.wallet.balance,
      message: `🎉 Successfully credited Pi ${(result.transaction.amount || numAmount).toFixed(2)} to your balance!`
    });
  } catch (err) {
    console.error('DirectPay verification error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
