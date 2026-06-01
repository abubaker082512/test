import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Also get all pending transactions for admin dashboard
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  if (password !== 'Admin@123') return res.status(401).json({ error: 'Unauthorized' })

  const { data: pending } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return res.status(200).json({ pending: pending || [] })
}
