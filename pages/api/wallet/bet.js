import { createClient } from '@supabase/supabase-js'

// Uses service role to bypass RLS for server-side wallet operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount } = req.body
  if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid request' })

  // Get wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets').select('*').eq('user_id', user_id).single()

  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })
  if (wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' })

  // Deduct bet
  const { error: updateErr } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount })
    .eq('user_id', user_id)

  if (updateErr) return res.status(500).json({ error: 'Failed to place bet' })

  // Log transaction
  await supabase.from('transactions').insert({
    user_id, type: 'bet', amount, status: 'completed'
  })

  return res.status(200).json({ success: true, new_balance: wallet.balance - amount })
}
