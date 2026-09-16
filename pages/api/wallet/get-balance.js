import { db } from '../../../utils/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { getUserTransactionsList, getUserWallet } from '../../../utils/walletStore'

export default async function handler(req, res) {
  const userId = req.query.user_id || req.body?.user_id
  const email = (req.query.email || req.body?.email || '').toLowerCase().trim()

  if (!userId && !email) {
    return res.status(400).json({ error: 'user_id or email required' })
  }

  try {
    // 1. Primary: load from persistent walletStore
    const pWallet = getUserWallet(userId, email);
    const userTxs = getUserTransactionsList(userId, email);

    if (pWallet) {
      return res.status(200).json({
        success: true,
        balance: parseFloat(pWallet.balance || 0),
        wallet: pWallet,
        transactions: userTxs
      });
    }

    let wallet = null

    // 2. Check Firestore
    if (userId) {
      try {
        const snap = await getDoc(doc(db, 'wallets', userId))
        if (snap.exists()) {
          wallet = { id: snap.id, ...snap.data() }
        }
      } catch (e) {}
    }

    // Default if still null
    if (!wallet) {
      wallet = { user_id: userId, balance: 0.00, currency: 'Pi' }
    }

    return res.status(200).json({
      success: true,
      balance: parseFloat(wallet.balance || 0),
      wallet,
      transactions: userTxs || []
    })
  } catch (err) {
    console.error('get-balance error:', err)
    return res.status(500).json({ error: err.message })
  }
}
