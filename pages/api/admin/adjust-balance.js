import { createClient } from '@supabase/supabase-js'
import { creditUserBalance, debitUserBalance, getUserWallet, recordTransactionRecord } from '../../../utils/walletStore'

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
    // 1. Update walletStore
    let updatedWallet = null
    const currentWallet = getUserWallet(user_id)
    const notesStr = note ? `Admin Adjust: ${note}` : 'Admin manual balance adjustment'

    if (adjAmount >= 0) {
      updatedWallet = creditUserBalance(user_id, adjAmount, currentWallet.email, notesStr)
    } else {
      const debitRes = debitUserBalance(user_id, Math.abs(adjAmount))
      if (!debitRes.success) {
        return res.status(400).json({ error: `Cannot deduct Pi ${Math.abs(adjAmount)}. Current balance is only Pi ${currentWallet.balance.toFixed(2)}` })
      }
      updatedWallet = debitRes.wallet
    }

    recordTransactionRecord({
      user_id,
      email: updatedWallet.email,
      type: adjAmount >= 0 ? 'deposit' : 'withdraw',
      amount: Math.abs(adjAmount),
      status: 'completed',
      method: 'Admin Manual',
      notes: notesStr
    })

    // 2. Background sync to Supabase (non-blocking)
    Promise.resolve().then(async () => {
      try {
        await supabase.from('wallets').upsert({
          user_id,
          balance: updatedWallet.balance,
          currency: 'Pi',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

        await supabase.from('transactions').insert({
          user_id,
          type: adjAmount >= 0 ? 'payout' : 'withdraw',
          amount: Math.abs(adjAmount),
          status: 'completed',
          method: 'admin',
          notes: notesStr
        })
      } catch (e) {}
    })

    return res.status(200).json({
      success: true,
      message: `Balance adjusted successfully! New balance is Pi ${updatedWallet.balance.toFixed(2)}`,
      new_balance: updatedWallet.balance
    })

  } catch (err) {
    return res.status(500).json({ error: `Balance adjustment failed: ${err.message}` })
  }
}
