import { createClient } from '@supabase/supabase-js'
import { db } from '../../../utils/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getUserWallet } from '../../../utils/walletStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const userId = req.query.user_id || req.body?.user_id
  const email = (req.query.email || req.body?.email || '').toLowerCase().trim()

  if (!userId && !email) {
    return res.status(400).json({ error: 'user_id or email required' })
  }

  try {
    // 1. Primary: load from persistent walletStore
    const pWallet = getUserWallet(userId, email);
    if (pWallet) {
      return res.status(200).json({
        success: true,
        balance: parseFloat(pWallet.balance || 0),
        wallet: pWallet
      });
    }

    let wallet = null

    // 1. Try finding wallet by user_id in Supabase
    if (userId) {
      const { data: wById } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (wById) {
        wallet = wById
      }
    }

    // 2. If not found or balance is 0, look up user by email in Supabase/Auth
    if ((!wallet || wallet.balance === 0) && email) {
      // Find user ID from Supabase auth list or users table
      try {
        const { data: authData } = await supabase.auth.admin.listUsers()
        const foundAuth = authData?.users?.find(u => u.email?.toLowerCase() === email)

        if (foundAuth) {
          const { data: wByAuth } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', foundAuth.id)
            .single()

          if (wByAuth) {
            wallet = wByAuth
            // If current userId is different, alias / update wallet so it matches
            if (userId && userId !== foundAuth.id) {
              await supabase.from('wallets').upsert({
                user_id: userId,
                balance: wByAuth.balance,
                currency: 'Pi',
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' }).catch(() => {})
            }
          }
        }
      } catch (e) {}

      // Check users table
      if (!wallet) {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (userRow?.id) {
          const { data: wByUserRow } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userRow.id)
            .single()

          if (wByUserRow) {
            wallet = wByUserRow
            if (userId && userId !== userRow.id) {
              await supabase.from('wallets').upsert({
                user_id: userId,
                balance: wByUserRow.balance,
                currency: 'Pi',
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' }).catch(() => {})
            }
          }
        }
      }
    }

    // 3. Fallback: check Firestore
    if (!wallet && userId) {
      try {
        const snap = await getDoc(doc(db, 'wallets', userId))
        if (snap.exists()) {
          wallet = { id: snap.id, ...snap.data() }
        }
      } catch (e) {}
    }

    // Default if still null
    if (!wallet) {
      wallet = { user_id: userId, balance: 0.00, currency: 'Pi' }
    }

    return res.status(200).json({
      success: true,
      balance: parseFloat(wallet.balance || 0),
      wallet
    })
  } catch (err) {
    console.error('get-balance error:', err)
    return res.status(500).json({ error: err.message })
  }
}
