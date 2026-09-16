import { getUserWallet, creditUserBalance, recordTransactionRecord, getUserTransactionsList } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const todayStr = new Date().toISOString().split('T')[0]
  const checkinNote = `Daily Check-in Bonus - ${todayStr}`

  try {
    // 1. Check if user already claimed today's check-in
    const userTxs = getUserTransactionsList(user_id, email || '')
    const existing = userTxs.find(t => t.notes && t.notes.includes(checkinNote))

    if (existing) {
      return res.status(400).json({ error: 'You have already checked in today!' })
    }

    const bonusAmount = 5.00
    const wallet = creditUserBalance(user_id, bonusAmount, email || '', checkinNote)

    // Log check-in transaction
    recordTransactionRecord({
      user_id,
      email: email || '',
      type: 'payout',
      amount: bonusAmount,
      status: 'completed',
      method: 'Check-in Reward',
      notes: checkinNote
    })

    // Firestore sync
    try {
      updateWalletBalance(user_id, wallet.balance).catch(() => {})
      addTransaction({
        user_id,
        type: 'payout',
        amount: bonusAmount,
        status: 'completed',
        notes: checkinNote
      }).catch(() => {})
    } catch (e) {}

    return res.status(200).json({ 
      success: true, 
      message: 'Daily check-in successful!', 
      bonus_amount: bonusAmount,
      new_balance: wallet.balance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
