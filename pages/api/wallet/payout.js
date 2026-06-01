import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, bet_amount, multiplier } = req.body
  if (!user_id || !bet_amount || !multiplier) return res.status(400).json({ error: 'Invalid request' })

  const payout = parseFloat((bet_amount * multiplier).toFixed(2))

  // Get wallet
  const { data: wallet } = await supabase
    .from('wallets').select('*').eq('user_id', user_id).single()

  if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

  // Credit payout
  const { error } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance + payout })
    .eq('user_id', user_id)

  if (error) return res.status(500).json({ error: 'Failed to process payout' })

  // Log transaction
  await supabase.from('transactions').insert({
    user_id, type: 'payout', amount: payout, status: 'completed',
    notes: `Cashed out at ${multiplier}x`
  })

  return res.status(200).json({ success: true, payout, new_balance: wallet.balance + payout })
}
