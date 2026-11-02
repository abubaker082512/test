import { findTransaction, completeAndCreditTransaction, creditUserBalance, recordTransactionRecord } from '../../../utils/walletStore'
import { getOrCreateWallet, updateWalletBalance } from '../../../utils/firebaseDb'

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, tx_id, action, reason } = req.body // action: 'approve' | 'reject'
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' })
  if (!tx_id || !action) return res.status(400).json({ error: 'Missing tx_id or action' })

  try {
    const localTx = findTransaction(tx_id)
    if (!localTx) {
      return res.status(404).json({ error: `Transaction ${tx_id} not found.` })
    }

    if (action === 'approve') {
      if (localTx.type === 'deposit') {
        const bonus = Number(localTx.metadata?.bonus_amount || 0)
        const totalCredit = localTx.amount + bonus

        completeAndCreditTransaction(tx_id, {
          amount: totalCredit,
          user_id: localTx.user_id,
          email: localTx.email,
          notes: `Admin approved deposit: Rs ${localTx.amount}${bonus > 0 ? ` + Rs ${bonus} bonus` : ''} | TID: ${localTx.metadata?.tid || tx_id}`
        })

        try {
          const fWallet = await getOrCreateWallet(localTx.user_id)
          const curBal = Number(fWallet?.balance || 0)
          await updateWalletBalance(localTx.user_id, curBal + totalCredit)
        } catch (e) {}

        return res.status(200).json({
          success: true,
          message: `Deposit approved! Credited Rs ${totalCredit.toLocaleString()} to player balance.`
        })
      } else {
        // Withdrawal approve
        localTx.status = 'completed'
        localTx.updated_at = new Date().toISOString()
        localTx.notes = `Payout Approved & Sent | TxID: ${tx_id}`
        recordTransactionRecord(localTx)

        return res.status(200).json({
          success: true,
          message: `Payout marked as completed for Rs ${localTx.amount.toLocaleString()}.`
        })
      }
    }

    if (action === 'reject') {
      localTx.status = 'failed'
      localTx.updated_at = new Date().toISOString()
      const reasonNote = reason || 'Admin rejected request'

      if (localTx.type === 'withdraw') {
        // Refund withdrawal balance back to user
        creditUserBalance(localTx.user_id, localTx.amount, localTx.email, `Refund for rejected withdrawal: ${tx_id} (${reasonNote})`)
        localTx.notes = `Withdrawal Rejected & Refunded: ${reasonNote}`
        
        try {
          const fWallet = await getOrCreateWallet(localTx.user_id)
          const curBal = Number(fWallet?.balance || 0)
          await updateWalletBalance(localTx.user_id, curBal + localTx.amount)
        } catch (e) {}
      } else {
        localTx.notes = `Deposit Rejected: ${reasonNote}`
      }

      recordTransactionRecord(localTx)

      return res.status(200).json({
        success: true,
        message: `Transaction rejected: ${reasonNote}`
      })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Operation failed' })
  }
}
