import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const todayStr = new Date().toISOString().split('T')[0] // E.g., '2026-06-08'
  const checkinNote = `Daily Check-in Bonus - ${todayStr}`

  try {
    // 1. Check if user already claimed today's check-in
    const { data: existing, error: queryErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user_id)
      .eq('notes', checkinNote)
      .limit(1)

    if (queryErr) return res.status(500).json({ error: 'Failed to verify check-in status' })
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'You have already checked in today!' })
    }

    // 2. Get user's wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (walletErr || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    const bonusAmount = 5.00
    const newBalance = parseFloat(wallet.balance) + bonusAmount

    // 3. Update wallet balance
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user_id)

    if (updateErr) return res.status(500).json({ error: 'Failed to update wallet balance' })

    // 4. Log check-in transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'payout',
      amount: bonusAmount,
      status: 'completed',
      notes: checkinNote
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Daily check-in successful!', 
      bonus_amount: bonusAmount,
      new_balance: newBalance
    })

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
