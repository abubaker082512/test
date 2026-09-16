import { findTransaction, completeAndCreditTransaction, creditUserBalance, recordTransactionRecord } from '../../../utils/walletStore'
import { getOrCreateWallet, updateWalletBalance } from '../../../utils/firebaseDb'

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, tx_id, action } = req.body // action: 'approve' | 'reject'
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' })
  if (!tx_id || !action) return res.status(400).json({ error: 'Missing tx_id or action' })

  try {
    // 1. Check local persistent store
    const localTx = findTransaction(tx_id)

    if (action === 'approve') {
      if (localTx) {
        const result = completeAndCreditTransaction(tx_id, {
          amount: localTx.amount,
          user_id: localTx.user_id,
          email: localTx.email,
          notes: `Admin approved transaction ${tx_id}`
        })

        try {
          const fWallet = await getOrCreateWallet(localTx.user_id)
          const curBal = Number(fWallet?.balance || 0)
          await updateWalletBalance(localTx.user_id, curBal + localTx.amount)
        } catch (e) {}
      }

      return res.status(200).json({ success: true, message: 'Transaction approved and credited successfully!' })
    }

    if (action === 'reject') {
      if (localTx) {
        localTx.status = 'failed'
        if (localTx.type === 'withdraw') {
          creditUserBalance(localTx.user_id, localTx.amount, localTx.email, `Refund for rejected withdrawal: ${tx_id}`)
        }
        recordTransactionRecord(localTx)
      }

      return res.status(200).json({ success: true, message: 'Transaction rejected and updated.' })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Operation failed' })
  }
}
