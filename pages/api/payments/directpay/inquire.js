import { findTransaction, completeAndCreditTransaction, failTransaction, recordTransactionRecord, getDirectPayTransactionsList } from '../../../../utils/walletStore';
import { getOrCreateWallet, updateWalletBalance } from '../../../../utils/firebaseDb';

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux';
const DEFAULT_CLIENT_SECRET = process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryParams = req.method === 'GET' ? req.query : req.body;
  const { txn_id, client_transaction_id, gateway_transaction_id, status_filter, all } = queryParams || {};
  const searchId = txn_id || client_transaction_id || gateway_transaction_id;

  try {
    // 1. If NO searchId is passed (or all=true / action=list), return ALL DirectPay transactions
    if (!searchId || all === 'true' || all === true) {
      const allDirectPayTxs = getDirectPayTransactionsList();
      
      const filtered = allDirectPayTxs.filter(t => {
        if (!status_filter || status_filter === 'all') return true;
        return t.status === status_filter;
      });

      const completedCount = allDirectPayTxs.filter(t => t.status === 'completed').length;
      const pendingCount = allDirectPayTxs.filter(t => t.status === 'pending').length;
      const failedCount = allDirectPayTxs.filter(t => t.status === 'failed' || t.status === 'cancelled').length;
      const totalVolume = allDirectPayTxs
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      return res.status(200).json({
        success: true,
        summary: {
          total_count: allDirectPayTxs.length,
          completed_count: completedCount,
          pending_count: pendingCount,
          failed_count: failedCount,
          total_volume_pkr: parseFloat(totalVolume.toFixed(2))
        },
        transactions: filtered.map(t => ({
          id: t.id,
          tx_id: t.tx_id,
          user_id: t.user_id,
          email: t.email,
          type: t.type,
          amount: parseFloat(t.amount || 0),
          status: t.status,
          method: t.method,
          notes: t.notes,
          account_number: t.metadata?.account_number || t.metadata?.msisdn || 'N/A',
          gateway_transaction_id: t.metadata?.gateway_transaction_id || t.metadata?.dp_txn_id || t.metadata?.bank_ref || t.tx_id,
          created_at: t.created_at,
          updated_at: t.updated_at
        }))
      });
    }

    // 2. Single Transaction Inquiry
    const localTx = findTransaction(searchId);

    // Fetch live status from DirectPay Payin PWA status endpoint
    let gatewayDetails = null;
    let gatewayStatus = null;

    try {
      const dpResponse = await fetch(`https://payin-pwa.directpay.pro/pay/status?client_id=${DEFAULT_CLIENT_ID}&client_transaction_id=${encodeURIComponent(searchId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      if (dpResponse && dpResponse.ok) {
        const contentType = dpResponse.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          gatewayDetails = await dpResponse.json();
          if (gatewayDetails.status) gatewayStatus = gatewayDetails.status;
        }
      }
    } catch (e) {
      console.warn('DirectPay inquiry fetch failed:', e.message);
    }

    // Auto-sync status if gateway returned updated status
    if (gatewayStatus && localTx) {
      const normGwStatus = String(gatewayStatus).toLowerCase();
      if ((normGwStatus === 'completed' || normGwStatus === 'success' || normGwStatus === 'paid') && localTx.status === 'pending') {
        const result = completeAndCreditTransaction(localTx.tx_id || searchId, {
          amount: localTx.amount,
          amountInPKR: localTx.amount,
          method: 'DirectPay',
          notes: `DirectPay Auto-Synced via Inquiry: ${localTx.amount} PKR`
        });
        try {
          await updateWalletBalance(result.transaction.user_id, result.wallet.balance);
        } catch (e) {}
      } else if ((normGwStatus === 'failed' || normGwStatus === 'cancelled' || normGwStatus === 'declined') && localTx.status === 'pending') {
        failTransaction(localTx.tx_id || searchId, 'DirectPay gateway status failed');
      }
    }

    if (!localTx && !gatewayDetails) {
      return res.status(404).json({ error: `Transaction '${searchId}' not found in local records or DirectPay gateway.` });
    }

    const updatedTx = findTransaction(searchId) || localTx;

    return res.status(200).json({
      success: true,
      transaction: updatedTx || {
        id: searchId,
        tx_id: searchId,
        status: gatewayStatus || 'unknown'
      },
      client_transaction_id: updatedTx?.tx_id || updatedTx?.metadata?.clientTransactionId || searchId,
      gateway_transaction_id: updatedTx?.metadata?.gateway_transaction_id || updatedTx?.metadata?.dp_txn_id || updatedTx?.metadata?.bank_ref || searchId,
      account_number: updatedTx?.metadata?.account_number || updatedTx?.metadata?.msisdn || 'N/A',
      amountInPKR: updatedTx?.metadata?.amountInPKR || updatedTx?.amount || 0,
      currency: updatedTx?.metadata?.currency || 'PKR',
      status: updatedTx?.status || gatewayStatus || 'pending',
      gateway_status: gatewayStatus || updatedTx?.status || 'pending',
      gateway_raw: gatewayDetails || null
    });
  } catch (err) {
    console.error('Inquire transaction error:', err);
    return res.status(500).json({ error: err.message || 'Failed to inquire transaction details' });
  }
}
