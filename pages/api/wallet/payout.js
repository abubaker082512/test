import { getActiveRiskConfig } from '../admin/risk-settings'
import { creditUserBalance, recordTransactionRecord, resolveUserUuid } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'
import { supabase } from '../../../utils/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email, bet_amount, multiplier, win_amount, game } = req.body
  if ((!user_id && !email) || (!bet_amount && !win_amount)) return res.status(400).json({ error: 'Invalid request' })

  // Check Risk Governor / Win-Stop Engine
  const riskConfig = getActiveRiskConfig()
  const isRestricted = (riskConfig.restricted_users || []).includes(user_id)
  
  if (isRestricted || riskConfig.force_house_edge) {
    return res.status(403).json({
      success: false,
      error: 'Table win limit reached for this session. Please play responsibly or contact VIP support.',
      restricted: true
    })
  }

  const effectiveMult = parseFloat(multiplier) || 1
  const rawPayout = win_amount !== undefined
    ? parseFloat(Number(win_amount).toFixed(2))
    : parseFloat((parseFloat(bet_amount) * effectiveMult).toFixed(2))
  
  // Enforce Max Win Cap if configured
  const maxCap = riskConfig.max_win_cap || 50000
  const payout = Math.min(rawPayout, maxCap)

  // Credit payout (permanent update to Supabase)
  const updatedWallet = creditUserBalance(user_id, payout, email || '', `Cashed out at ${effectiveMult}x`)
  const resolvedUid = resolveUserUuid(user_id, email) || updatedWallet.user_id || user_id

  // Log transaction
  recordTransactionRecord({
    user_id: resolvedUid,
    email: email || updatedWallet.email || '',
    type: 'payout',
    amount: payout,
    status: 'completed',
    method: game ? `${game} Payout` : 'Game Payout',
    notes: `Won Rs ${payout.toFixed(2)} (${effectiveMult}x)`
  })

  // Record to bet_history
  supabase.from('bet_history').insert({
    user_id: resolvedUid,
    user_email: email || updatedWallet.email || '',
    game_id: game ? String(game).toLowerCase().replace(/\s+/g, '-') : 'custom-game',
    game_name: game || 'Casino Game',
    bet_amount: parseFloat(bet_amount || 0),
    win_amount: payout,
    result: payout > 0 ? 'win' : 'loss',
    multiplier: effectiveMult,
    balance_before: parseFloat((updatedWallet.balance - payout).toFixed(2)),
    balance_after: updatedWallet.balance,
    status: 'completed'
  }).then(({ error }) => { if (error) console.error('bet_history payout error:', error.message); })

  // Background Firestore sync
  try {
    updateWalletBalance(resolvedUid, updatedWallet.balance).catch(() => {})
    addTransaction({
      user_id: resolvedUid,
      type: 'payout',
      amount: payout,
      status: 'completed',
      multiplier: effectiveMult
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({
    success: true,
    payout,
    multiplier: effectiveMult,
    new_balance: updatedWallet.balance,
    wallet: updatedWallet
  })
}
