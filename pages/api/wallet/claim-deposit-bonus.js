import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const bonusNote = 'First Deposit Match Bonus'

  try {
    // 1. Check if user already claimed the first deposit bonus
    const { data: existingBonus, error: bonusErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user_id)
      .eq('notes', bonusNote)
      .limit(1)

    if (bonusErr) return res.status(500).json({ error: 'Failed to verify bonus status' })
    if (existingBonus && existingBonus.length > 0) {
      return res.status(400).json({ error: 'You have already claimed your First Deposit Match Bonus!' })
    }

    // 2. Find the user's first completed deposit
    const { data: deposits, error: depErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .eq('type', 'deposit')
      .eq('status', 'completed')
      .order('created_at', { ascending: true })
      .limit(1)

    if (depErr) return res.status(500).json({ error: 'Failed to query deposit record' })
    
    if (!deposits || deposits.length === 0) {
      return res.status(400).json({ error: 'No completed deposits found. You must complete a deposit first to claim this bonus.' })
    }

    const firstDeposit = deposits[0]
    const depositAmt = parseFloat(firstDeposit.amount)
    
    // Match 100% up to a maximum of ₱5,000
    const matchedAmount = parseFloat(Math.min(depositAmt, 5000.00).toFixed(2))

    // 3. Get user's wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (walletErr || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    const newBalance = parseFloat(wallet.balance) + matchedAmount

    // 4. Update wallet balance
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user_id)

    if (updateErr) return res.status(500).json({ error: 'Failed to update wallet balance' })

    // 5. Log matched deposit bonus transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'payout',
      amount: matchedAmount,
      status: 'completed',
      notes: bonusNote
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Deposit bonus claimed successfully!', 
      bonus_amount: matchedAmount,
      new_balance: newBalance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
