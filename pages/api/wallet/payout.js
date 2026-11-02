import { getActiveRiskConfig } from '../admin/risk-settings'
import { creditUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

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

  // Credit payout
  const updatedWallet = creditUserBalance(user_id, payout, email || '', `Cashed out at ${effectiveMult}x`)

  // Log transaction
  recordTransactionRecord({
    user_id: updatedWallet.user_id || user_id,
    email: email || updatedWallet.email || '',
    type: 'payout',
    amount: payout,
    status: 'completed',
    method: game ? `${game} Payout` : 'Game Payout',
    notes: `Won Rs ${payout.toFixed(2)} (${effectiveMult}x)`
  })

  // Background Firestore sync
  try {
    updateWalletBalance(updatedWallet.user_id || user_id, updatedWallet.balance).catch(() => {})
    addTransaction({
      user_id: updatedWallet.user_id || user_id,
      type: 'payout',
      amount: payout,
      status: 'completed',
      notes: `Cashed out at ${effectiveMult}x`
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, payout, new_balance: updatedWallet.balance, wallet: updatedWallet })
}
