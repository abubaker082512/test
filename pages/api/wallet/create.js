import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Create wallet when user signs up
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  // Check if wallet already exists
  const { data: existing } = await supabase
    .from('wallets').select('id').eq('user_id', user_id).single()

  if (existing) return res.status(200).json({ success: true, message: 'Wallet already exists' })

  const { error } = await supabase.from('wallets').insert({ user_id, balance: 0.00 })
  if (error) return res.status(500).json({ error: 'Failed to create wallet' })

  return res.status(200).json({ success: true, message: 'Wallet created' })
}
