import {
  ensureLiveUserWallet,
  getLiveUserTransactions,
  recordTransactionRecord,
  commitWalletBalanceToSupabase,
  commitTransactionToSupabase
} from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email } = req.body
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id' })

  const todayStr = new Date().toISOString().split('T')[0]
  const checkinNote = `Daily Check-in Bonus - ${todayStr}`

  try {
    // 1. Resolve authoritative live wallet & check Supabase transactions for today's check-in
    const liveWallet = await ensureLiveUserWallet(user_id || email, email || '')
    const authoritativeUserId = liveWallet?.user_id || user_id
    const authoritativeEmail = (email || liveWallet?.email || '').toLowerCase().trim()

    const userTxs = await getLiveUserTransactions(authoritativeUserId, authoritativeEmail)
    const existing = userTxs.find(t => t.notes && t.notes.includes(checkinNote))

    if (existing) {
      return res.status(400).json({ error: 'You have already checked in today!' })
    }

    const bonusAmount = 5.00
    const newBalance = parseFloat((Number(liveWallet.balance || 0) + bonusAmount).toFixed(2))

    await commitWalletBalanceToSupabase(authoritativeUserId, newBalance, authoritativeEmail)

    // Log check-in transaction & await Supabase commit
    const checkinTx = recordTransactionRecord({
      id: `CHK-${Date.now().toString(36).toUpperCase()}`,
      tx_id: `CHK-${Date.now().toString(36).toUpperCase()}`,
      user_id: authoritativeUserId,
      email: authoritativeEmail,
      type: 'payout',
      amount: bonusAmount,
      status: 'completed',
      method: 'Check-in Reward',
      notes: checkinNote,
      skipAsyncSupabase: true
    })
    await commitTransactionToSupabase(checkinTx)

    // Firestore sync
    try {
      updateWalletBalance(authoritativeUserId, newBalance).catch(() => {})
      addTransaction({
        user_id: authoritativeUserId,
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
      new_balance: newBalance
    })
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
