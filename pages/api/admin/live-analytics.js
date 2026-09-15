import { createClient } from '@supabase/supabase-js'
import { getActiveRiskConfig } from './risk-settings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 1. Fetch recent transactions (bets, payouts)
    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .in('type', ['bet', 'payout'])
      .order('created_at', { ascending: false })
      .limit(500)

    // 2. Fetch users to map user_id -> email
    const { data: users } = await supabase.auth.admin.listUsers()
    const userMap = {}
    if (users?.users) {
      users.users.forEach(u => {
        userMap[u.id] = u.email
      })
    }

    const riskConfig = getActiveRiskConfig()
    const restrictedList = riskConfig.restricted_users || []

    let totalWagered = 0
    let totalPayout = 0
    let totalBetsCount = 0
    let totalPayoutsCount = 0

    const userStats = {}

    // Aggregate user win/loss statistics
    if (txs && Array.isArray(txs)) {
      txs.forEach(tx => {
        const uid = tx.user_id
        if (!userStats[uid]) {
          userStats[uid] = {
            user_id: uid,
            email: userMap[uid] || 'Player ' + uid.slice(0, 6),
            total_bet: 0,
            total_payout: 0,
            bets_count: 0,
            wins_count: 0,
            is_restricted: restrictedList.includes(uid)
          }
        }

        const amt = parseFloat(tx.amount || 0)

        if (tx.type === 'bet') {
          totalWagered += amt
          totalBetsCount++
          userStats[uid].total_bet += amt
          userStats[uid].bets_count++
        } else if (tx.type === 'payout') {
          totalPayout += amt
          totalPayoutsCount++
          userStats[uid].total_payout += amt
          userStats[uid].wins_count++
        }
      })
    }

    // Classify into Winners & Losers
    const usersArray = Object.values(userStats).map(u => {
      const netProfit = parseFloat((u.total_payout - u.total_bet).toFixed(2))
      const winRate = u.bets_count > 0 ? ((u.wins_count / u.bets_count) * 100).toFixed(1) : '0.0'
      return {
        ...u,
        net_profit: netProfit,
        win_rate: winRate,
        is_winner: netProfit > 0
      }
    })

    const winners = usersArray.filter(u => u.is_winner).sort((a, b) => b.net_profit - a.net_profit)
    const losers = usersArray.filter(u => !u.is_winner).sort((a, b) => a.net_profit - b.net_profit)

    const grossMargin = totalWagered > 0 ? parseFloat((((totalWagered - totalPayout) / totalWagered) * 100).toFixed(2)) : 0.0
    const netHouseProfit = parseFloat((totalWagered - totalPayout).toFixed(2))

    // Formatted live feed of last 25 rounds
    const liveFeed = (txs || []).slice(0, 25).map(tx => ({
      id: tx.id,
      user_id: tx.user_id,
      email: userMap[tx.user_id] || 'Player ' + tx.user_id?.slice(0, 6),
      type: tx.type,
      amount: parseFloat(tx.amount).toFixed(2),
      notes: tx.notes,
      created_at: tx.created_at,
      status: tx.status
    }))

    return res.status(200).json({
      success: true,
      metrics: {
        total_wagered: parseFloat(totalWagered.toFixed(2)),
        total_payout: parseFloat(totalPayout.toFixed(2)),
        net_house_profit: netHouseProfit,
        gross_margin_pct: grossMargin,
        total_bets_count: totalBetsCount,
        total_payouts_count: totalPayoutsCount,
        winners_count: winners.length,
        losers_count: losers.length,
        total_active_players: usersArray.length
      },
      winners,
      losers,
      live_feed: liveFeed,
      risk_config: riskConfig
    })
  } catch (err) {
    console.error('Live Analytics Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to compile live analytics' })
  }
}
