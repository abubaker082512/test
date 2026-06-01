import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, account_number } = req.body
  if (!user_id || !amount || amount < 500) return res.status(400).json({ error: 'Minimum withdrawal is ₱500' })

  // Check balance
  const { data: wallet } = await supabase
    .from('wallets').select('*').eq('user_id', user_id).single()

  if (!wallet || wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' })

  // Hold the amount (deduct immediately, will be reversed if rejected)
  await supabase.from('wallets').update({ balance: wallet.balance - amount }).eq('user_id', user_id)

  // Log pending withdrawal
  await supabase.from('transactions').insert({
    user_id, type: 'withdraw', amount, status: 'pending', method,
    notes: `Withdraw to ${method} account: ${account_number}`
  })

  return res.status(200).json({ success: true, message: 'Withdrawal request submitted. Processing within 24 hours.' })
}
