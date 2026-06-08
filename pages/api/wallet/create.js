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

  // Insert wallet
  const { error } = await supabase.from('wallets').insert({ user_id, balance: 0.00 })
  if (error) return res.status(500).json({ error: 'Failed to create wallet' })

  // Try to process referral reward
  try {
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(user_id)
    const referrerEmail = user?.user_metadata?.referrer_email

    if (referrerEmail && !userErr && user?.email) {
      // Find referrer user
      const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers()
      if (!listErr && usersData?.users) {
        const referrer = usersData.users.find(u => u.email?.toLowerCase() === referrerEmail.toLowerCase())
        
        // Ensure referrer exists and is not the registering user themselves
        if (referrer && referrer.id !== user_id) {
          // Check if referrer already has a wallet
          const { data: refWallet } = await supabase
            .from('wallets').select('*').eq('user_id', referrer.id).single()
          
          if (refWallet) {
            // Credit referrer balance
            const newBal = parseFloat(refWallet.balance) + 155.55
            await supabase
              .from('wallets')
              .update({ balance: newBal })
              .eq('user_id', referrer.id)

            // Log referral transaction
            await supabase.from('transactions').insert({
              user_id: referrer.id,
              type: 'payout',
              amount: 155.55,
              status: 'completed',
              notes: `Referral Reward: Invited ${user.email}`
            })
          }
        }
      }
    }
  } catch (refErr) {
    console.error('Referral processing error:', refErr)
  }

  return res.status(200).json({ success: true, message: 'Wallet created' })
}
