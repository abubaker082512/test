import { getUserWallet, creditUserBalance, recordTransactionRecord, getUserTransactionsList } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

const SPIN_PRIZES = [
  { text: 'Pi 10.00 Free Bet', amount: 10.00 },
  { text: 'Pi 88.88 Lucky Reward', amount: 88.88 },
  { text: 'Pi 155.55 Referral Bonus', amount: 155.55 },
  { text: 'Try Again Tomorrow', amount: 0.00 },
  { text: 'Pi 8,888.00 MEGA JACKPOT!', amount: 8888.00 }
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const todayStr = new Date().toISOString().split('T')[0]
  const spinNote = `Daily Lucky Spin - ${todayStr}`

  try {
    // 1. Check if user already spun today
    const userTxs = getUserTransactionsList(user_id, email || '')
    const existing = userTxs.find(t => t.notes && t.notes.includes(spinNote))

    if (existing) {
      return res.status(400).json({ error: 'You have already spun the wheel today!' })
    }

    // 2. Roll a prize
    const rand = Math.random()
    let prize = SPIN_PRIZES[3] // Try Again (default)
    
    if (rand < 0.001) {
      prize = SPIN_PRIZES[4] // 0.1% chance for 8888
    } else if (rand < 0.05) {
      prize = SPIN_PRIZES[2] // 5% chance for 155.55
    } else if (rand < 0.20) {
      prize = SPIN_PRIZES[1] // 15% chance for 88.88
    } else if (rand < 0.60) {
      prize = SPIN_PRIZES[0] // 40% chance for 10
    }

    // 3. Credit wallet
    let wallet = getUserWallet(user_id, email || '')
    if (prize.amount > 0) {
      wallet = creditUserBalance(user_id, prize.amount, email || '', spinNote)
    }

    // 4. Record transaction
    recordTransactionRecord({
      user_id,
      email: email || '',
      type: 'payout',
      amount: prize.amount,
      status: 'completed',
      method: 'Daily Spin',
      notes: spinNote
    })

    // Firestore sync
    try {
      updateWalletBalance(user_id, wallet.balance).catch(() => {})
      addTransaction({
        user_id,
        type: 'payout',
        amount: prize.amount,
        status: 'completed',
        notes: spinNote
      }).catch(() => {})
    } catch (e) {}

    return res.status(200).json({
      success: true,
      prizeText: prize.text,
      amount: prize.amount,
      new_balance: wallet.balance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
