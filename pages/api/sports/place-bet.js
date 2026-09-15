import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, event_id, match_title, selection, odds, stake, potential_payout, market_type } = req.body

  if (!user_id || !stake || stake <= 0) {
    return res.status(400).json({ error: 'Invalid bet request. Please check stake amount.' })
  }

  try {
    // 1. Get wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets').select('*').eq('user_id', user_id).single()

    if (walletErr || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    if (wallet.balance < stake) {
      return res.status(400).json({ error: `Insufficient balance! You have Pi ${wallet.balance.toFixed(2)}, stake is Pi ${stake.toFixed(2)}.` })
    }

    const newBalance = wallet.balance - stake;

    // 2. Deduct stake
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user_id)

    if (updateErr) throw new Error('Failed to update wallet balance');

    // 3. Log transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'bet',
      amount: stake,
      status: 'completed',
      metadata: {
        type: 'sportsbook',
        event_id,
        match_title,
        selection,
        odds,
        potential_payout,
        market_type
      }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Bet placed successfully on ${selection || match_title}!`,
      new_balance: newBalance,
      bet: {
        id: 'SP-' + Date.now().toString(36).toUpperCase(),
        match_title,
        selection,
        odds,
        stake,
        potential_payout,
        placed_at: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Sports Bet Placement Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
