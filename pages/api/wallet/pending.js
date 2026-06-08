import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  if (password !== 'Admin@123') return res.status(401).json({ error: 'Unauthorized' })

  try {
    // 1. Fetch pending transactions
    const { data: pending, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (txErr) throw txErr

    // 2. Fetch all user wallets
    const { data: wallets, error: walletErr } = await supabase
      .from('wallets')
      .select('*')

    // 3. Fetch registered users from Auth
    let usersList = []
    try {
      const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()
      if (!authErr && authData?.users) {
        usersList = authData.users.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at
        }))
      }
    } catch (err) {
      console.error('Failed to list auth users:', err)
      // Fallback: build user list from wallets table if listUsers fails
      if (wallets) {
        usersList = wallets.map(w => ({
          id: w.user_id,
          email: `User_${w.user_id.substring(0, 6)}`,
          created_at: w.created_at
        }))
      }
    }

    return res.status(200).json({
      success: true,
      pending: pending || [],
      wallets: wallets || [],
      users: usersList
    })

  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch admin data: ${err.message}` })
  }
}
