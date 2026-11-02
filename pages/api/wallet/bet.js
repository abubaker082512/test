import { debitUserBalance, recordTransactionRecord } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email, amount, game } = req.body
  if ((!user_id && !email) || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid request' })

  const numAmount = parseFloat(amount)
  const result = debitUserBalance(user_id, numAmount, email || '')

  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Insufficient balance' })
  }

  recordTransactionRecord({
    user_id: result.wallet.user_id || user_id,
    email: email || result.wallet.email || '',
    type: 'bet',
    amount: numAmount,
    status: 'completed',
    method: game ? `${game} Bet` : 'In-Game Bet',
    notes: `Game wager: Rs ${numAmount.toFixed(2)}`
  })

  // Background Firestore sync
  try {
    updateWalletBalance(result.wallet.user_id || user_id, result.wallet.balance).catch(() => {})
    addTransaction({ user_id: result.wallet.user_id || user_id, type: 'bet', amount: numAmount, status: 'completed' }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, new_balance: result.wallet.balance, wallet: result.wallet })
}
