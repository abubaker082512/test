import { findTransaction, completeAndCreditTransaction, failTransaction, recordTransactionRecord } from '../../../../utils/walletStore';
import { getOrCreateWallet, updateWalletBalance, addTransaction } from '../../../../utils/firebaseDb';

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux';
const DEFAULT_CLIENT_SECRET = process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryParams = req.method === 'GET' ? req.query : req.body;
  const { txn_id, client_transaction_id, gateway_transaction_id } = queryParams || {};
  const searchId = txn_id || client_transaction_id || gateway_transaction_id;

  if (!searchId) {
    return res.status(400).json({ error: 'Missing transaction identifier (txn_id or client_transaction_id)' });
  }

  try {
    // 1. Check local persistent store
    const localTx = findTransaction(searchId);

    // 2. Fetch/Inquire DirectPay Gateway if possible
    let gatewayDetails = null;
    let gatewayStatus = null;

    try {
      // DirectPay Payin PWA inquiry check
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

    if (!localTx && !gatewayDetails) {
      return res.status(404).json({ error: 'Transaction not found in records or DirectPay gateway' });
    }

    // 3. Return full transaction details with both Client ID and Gateway ID
    return res.status(200).json({
      success: true,
      transaction: localTx || {
        id: searchId,
        tx_id: searchId,
        status: gatewayStatus || 'unknown'
      },
      client_transaction_id: localTx?.tx_id || localTx?.metadata?.clientTransactionId || searchId,
      gateway_transaction_id: localTx?.metadata?.gateway_transaction_id || localTx?.metadata?.dp_txn_id || localTx?.metadata?.bank_ref || searchId,
      account_number: localTx?.metadata?.account_number || localTx?.metadata?.msisdn || 'N/A',
      amountInPKR: localTx?.metadata?.amountInPKR || localTx?.amount || 0,
      currency: localTx?.metadata?.currency || 'PKR',
      gateway_status: gatewayStatus || localTx?.status || 'pending',
      gateway_raw: gatewayDetails || null
    });
  } catch (err) {
    console.error('Inquire transaction error:', err);
    return res.status(500).json({ error: err.message || 'Failed to inquire transaction details' });
  }
}
