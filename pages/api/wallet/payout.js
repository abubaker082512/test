import { getActiveRiskConfig } from '../admin/risk-settings'
import { creditUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, bet_amount, multiplier } = req.body
  if (!user_id || !bet_amount || !multiplier) return res.status(400).json({ error: 'Invalid request' })

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

  const rawPayout = parseFloat((bet_amount * multiplier).toFixed(2))
  
  // Enforce Max Win Cap if configured
  const maxCap = riskConfig.max_win_cap || 5000
  const payout = Math.min(rawPayout, maxCap)

  // Credit payout
  const updatedWallet = creditUserBalance(user_id, payout, '', `Cashed out at ${multiplier}x`)

  // Log transaction
  recordTransactionRecord({
    user_id,
    type: 'payout',
    amount: payout,
    status: 'completed',
    method: 'Game Payout',
    notes: `Cashed out at ${multiplier}x (${payout === rawPayout ? 'Standard' : 'Capped'})`
  })

  // Background Firestore sync
  try {
    updateWalletBalance(user_id, updatedWallet.balance).catch(() => {})
    addTransaction({
      user_id,
      type: 'payout',
      amount: payout,
      status: 'completed',
      notes: `Cashed out at ${multiplier}x`
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, payout, new_balance: updatedWallet.balance })
}
