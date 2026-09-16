import { debitUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, event_id, match_title, selection, odds, stake, potential_payout, market_type, email } = req.body

  const numStake = parseFloat(stake)
  if (!user_id || !numStake || numStake <= 0) {
    return res.status(400).json({ error: 'Invalid bet request. Please check stake amount.' })
  }

  try {
    // 1. Debit stake
    const debitRes = debitUserBalance(user_id, numStake)
    if (!debitRes.success) {
      return res.status(400).json({ error: `Insufficient balance! You have Pi ${debitRes.wallet.balance.toFixed(2)}, stake is Pi ${numStake.toFixed(2)}.` })
    }

    const betId = 'SP-' + Date.now().toString(36).toUpperCase()

    // 2. Record transaction
    recordTransactionRecord({
      user_id,
      email: email || '',
      type: 'bet',
      amount: numStake,
      status: 'completed',
      method: 'Sportsbook',
      notes: `Bet on ${selection || match_title} (${odds}x)`,
      metadata: {
        bet_id: betId,
        type: 'sportsbook',
        event_id,
        match_title,
        selection,
        odds,
        potential_payout,
        market_type
      }
    })

    // Firestore sync
    try {
      updateWalletBalance(user_id, debitRes.wallet.balance).catch(() => {})
      addTransaction({
        user_id,
        type: 'bet',
        amount: numStake,
        status: 'completed',
        notes: `Bet on ${selection || match_title}`
      }).catch(() => {})
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Bet placed successfully on ${selection || match_title}!`,
      new_balance: debitRes.wallet.balance,
      bet: {
        id: betId,
        match_title,
        selection,
        odds,
        stake: numStake,
        potential_payout,
        placed_at: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Sports Bet Placement Error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
