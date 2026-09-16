import { debitUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, event_id, match_title, selection, odds, stake, potential_payout, market_type, email, is_demo } = req.body

  const numStake = parseFloat(stake)
  if (!numStake || numStake <= 0) {
    return res.status(400).json({ error: 'Invalid bet request. Please check stake amount.' })
  }

  const betId = 'SP-' + Date.now().toString(36).toUpperCase()

  // 1. If Demo Mode, acknowledge bet placement immediately
  if (is_demo) {
    return res.status(200).json({
      success: true,
      message: `Demo bet placed successfully on ${selection || match_title}!`,
      is_demo: true,
      bet: {
        id: betId,
        match_title,
        selection,
        odds,
        stake: numStake,
        potential_payout,
        placed_at: new Date().toISOString(),
        is_demo: true,
        status: 'ACTIVE'
      }
    })
  }

  const effectiveUserId = user_id || email || 'player'

  try {
    // 2. Real Wallet Debit
    const debitRes = debitUserBalance(effectiveUserId, numStake)
    if (!debitRes.success) {
      const currentBal = debitRes.wallet ? debitRes.wallet.balance : 0
      return res.status(400).json({ error: `Insufficient balance! You have Pi ${currentBal.toFixed(2)}, stake is Pi ${numStake.toFixed(2)}.` })
    }

    // 3. Record transaction
    recordTransactionRecord({
      user_id: effectiveUserId,
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
      updateWalletBalance(effectiveUserId, debitRes.wallet.balance).catch(() => {})
      addTransaction({
        user_id: effectiveUserId,
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
        placed_at: new Date().toISOString(),
        status: 'ACTIVE'
      }
    })
  } catch (err) {
    console.error('Sports Bet Placement Error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
