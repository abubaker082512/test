import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SPIN_PRIZES = [
  { text: '₱10.00 Free Bet', amount: 10.00 },
  { text: '₱88.88 Lucky Reward', amount: 88.88 },
  { text: '₱155.55 Referral Bonus', amount: 155.55 },
  { text: 'Try Again Tomorrow', amount: 0.00 },
  { text: '₱8,888.00 MEGA JACKPOT!', amount: 8888.00 }
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const todayStr = new Date().toISOString().split('T')[0] // E.g., '2026-06-09'
  const spinNote = `Daily Lucky Spin - ${todayStr}`

  try {
    // 1. Check if user already spun today
    const { data: existing, error: queryErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user_id)
      .eq('notes', spinNote)
      .limit(1)

    if (queryErr) return res.status(500).json({ error: 'Failed to verify spin status' })
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'You have already spun the wheel today!' })
    }

    // 2. Roll a prize on the server securely
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
    } // 40% chance Try Again

    // 3. Get user's wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (walletErr || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    const newBalance = parseFloat(wallet.balance) + prize.amount

    // 4. Update wallet balance if there is a win
    if (prize.amount > 0) {
      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user_id)

      if (updateErr) return res.status(500).json({ error: 'Failed to update wallet balance' })
    }

    // 5. Log transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'payout',
      amount: prize.amount,
      status: 'completed',
      notes: spinNote
    })

    return res.status(200).json({
      success: true,
      prizeText: prize.text,
      amount: prize.amount,
      new_balance: newBalance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
