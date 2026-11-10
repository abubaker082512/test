import { atomicDebitBalance, recordTransactionRecord, resolveUserUuid } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'
import { supabase } from '../../../utils/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email, amount, game } = req.body
  if ((!user_id && !email) || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid request' })

  const numAmount = parseFloat(amount)
  // Atomic debit reads live from Supabase & writes permanently to prevent balance reversion
  const result = await atomicDebitBalance(user_id, numAmount, email || '')

  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Insufficient balance' })
  }

  const resolvedUid = resolveUserUuid(user_id, email) || result.wallet.user_id || user_id

  // Record to Supabase transactions ledger
  recordTransactionRecord({
    user_id: resolvedUid,
    email: email || result.wallet.email || '',
    type: 'bet',
    amount: numAmount,
    status: 'completed',
    method: game ? `${game} Bet` : 'In-Game Bet',
    notes: `Game wager: Rs ${numAmount.toFixed(2)}`
  })

  // Also record to bet_history table
  supabase.from('bet_history').insert({
    user_id: resolvedUid,
    user_email: email || result.wallet.email || '',
    game_id: game ? String(game).toLowerCase().replace(/\s+/g, '-') : 'custom-game',
    game_name: game || 'Casino Game',
    bet_amount: numAmount,
    win_amount: 0,
    result: 'pending',
    multiplier: 1.0,
    balance_before: parseFloat((result.wallet.balance + numAmount).toFixed(2)),
    balance_after: result.wallet.balance,
    status: 'completed'
  }).then(({ error }) => { if (error) console.error('bet_history error:', error.message); })

  // Background Firestore sync
  try {
    updateWalletBalance(resolvedUid, result.wallet.balance).catch(() => {})
    addTransaction({ user_id: resolvedUid, type: 'bet', amount: numAmount, status: 'completed' }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, new_balance: result.wallet.balance, wallet: result.wallet })
}
