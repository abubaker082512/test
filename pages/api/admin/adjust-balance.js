import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, user_id, amount, note } = req.body

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' })
  }

  const adjAmount = parseFloat(amount)
  if (isNaN(adjAmount)) {
    return res.status(400).json({ error: 'Invalid adjustment amount. Must be a number.' })
  }

  try {
    // 1. Fetch user's current wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    let newBalance = adjAmount

    if (walletErr && walletErr.code !== 'PGRST116') {
      // PGRST116 is code for "no rows returned", which is fine (means wallet doesn't exist yet)
      return res.status(500).json({ error: `Wallet lookup error: ${walletErr.message}` })
    }

    if (wallet) {
      newBalance = parseFloat(wallet.balance) + adjAmount
      if (newBalance < 0) {
        return res.status(400).json({ error: `Adjustment would result in negative balance (₱${newBalance.toFixed(2)}). Operation aborted.` })
      }

      // Update wallet balance
      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user_id)

      if (updateErr) throw updateErr
    } else {
      // Wallet does not exist, create new one
      if (newBalance < 0) {
        return res.status(400).json({ error: 'Cannot initialize a new wallet with a negative balance.' })
      }

      const { error: insertErr } = await supabase
        .from('wallets')
        .insert({ user_id, balance: newBalance })

      if (insertErr) throw insertErr
    }

    // 2. Log manual transaction
    const notesStr = note ? `Admin Adjust: ${note}` : 'Admin manual balance adjustment'
    await supabase.from('transactions').insert({
      user_id,
      type: adjAmount >= 0 ? 'payout' : 'withdraw', // payout represents credit, withdraw represents debit
      amount: Math.abs(adjAmount),
      status: 'completed',
      method: 'admin',
      notes: notesStr
    })

    return res.status(200).json({
      success: true,
      message: `Balance adjusted successfully! New balance is ₱${newBalance.toFixed(2)}`,
      new_balance: newBalance
    })

  } catch (err) {
    return res.status(500).json({ error: `Database update failed: ${err.message}` })
  }
}
