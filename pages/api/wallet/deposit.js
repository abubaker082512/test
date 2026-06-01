import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, tx_id } = req.body
  if (!user_id || !amount || amount < 100) return res.status(400).json({ error: 'Minimum deposit is ₱100' })
  if (!method || !tx_id) return res.status(400).json({ error: 'Payment method and transaction ID required' })

  // Log pending deposit
  const { error } = await supabase.from('transactions').insert({
    user_id, type: 'deposit', amount, status: 'pending', method, tx_id,
    notes: `Deposit via ${method} — TxID: ${tx_id}`
  })

  if (error) return res.status(500).json({ error: 'Failed to submit deposit request' })

  return res.status(200).json({ success: true, message: 'Deposit request submitted. Pending admin approval.' })
}
