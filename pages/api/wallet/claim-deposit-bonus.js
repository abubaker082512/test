import { getUserWallet, creditUserBalance, recordTransactionRecord, getUserTransactionsList } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const bonusNote = 'First Deposit Match Bonus'

  try {
    const userTxs = getUserTransactionsList(user_id, email || '')

    // 1. Check if already claimed
    const existingBonus = userTxs.find(t => t.notes && t.notes.includes(bonusNote))
    if (existingBonus) {
      return res.status(400).json({ error: 'You have already claimed your First Deposit Match Bonus!' })
    }

    // 2. Find completed deposit
    const completedDeposits = userTxs.filter(t => t.type === 'deposit' && t.status === 'completed')
    if (!completedDeposits || completedDeposits.length === 0) {
      return res.status(400).json({ error: 'No completed deposits found. You must complete a deposit first to claim this bonus.' })
    }

    const firstDeposit = completedDeposits[completedDeposits.length - 1] // oldest or first completed
    const depositAmt = parseFloat(firstDeposit.amount) || 0
    const matchedAmount = parseFloat(Math.min(depositAmt, 5000.00).toFixed(2))

    if (matchedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount for bonus' })
    }

    // 3. Credit wallet
    const wallet = creditUserBalance(user_id, matchedAmount, email || '', bonusNote)

    // 4. Log transaction
    recordTransactionRecord({
      user_id,
      email: email || '',
      type: 'payout',
      amount: matchedAmount,
      status: 'completed',
      method: 'Deposit Bonus',
      notes: bonusNote
    })

    // Firestore sync
    try {
      updateWalletBalance(user_id, wallet.balance).catch(() => {})
      addTransaction({
        user_id,
        type: 'payout',
        amount: matchedAmount,
        status: 'completed',
        notes: bonusNote
      }).catch(() => {})
    } catch (e) {}

    return res.status(200).json({ 
      success: true, 
      message: 'Deposit bonus claimed successfully!', 
      bonus_amount: matchedAmount,
      new_balance: wallet.balance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
