import { createClient } from '@supabase/supabase-js'
import { findTransaction, completeAndCreditTransaction, creditUserBalance, debitUserBalance, recordTransactionRecord } from '../../../utils/walletStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, tx_id, action } = req.body // action: 'approve' | 'reject'
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' })
  if (!tx_id || !action) return res.status(400).json({ error: 'Missing tx_id or action' })

  try {
    // 1. Check local persistent store
    const localTx = findTransaction(tx_id)

    if (action === 'approve') {
      if (localTx) {
        completeAndCreditTransaction(tx_id, {
          amount: localTx.amount,
          user_id: localTx.user_id,
          email: localTx.email,
          notes: `Admin approved transaction ${tx_id}`
        })
      }

      // Background sync to Supabase if reachable
      try {
        const { data: tx } = await supabase.from('transactions').select('*').eq('id', tx_id).single()
        if (tx && tx.type === 'deposit') {
          const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', tx.user_id).single()
          if (wallet) {
            await supabase.from('wallets').update({ balance: wallet.balance + tx.amount }).eq('user_id', tx.user_id)
          } else {
            await supabase.from('wallets').insert({ user_id: tx.user_id, balance: tx.amount })
          }
        }
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx_id)
      } catch (e) {}

      return res.status(200).json({ success: true, message: 'Transaction approved and credited successfully!' })
    }

    if (action === 'reject') {
      if (localTx) {
        localTx.status = 'failed'
        if (localTx.type === 'withdraw') {
          creditUserBalance(localTx.user_id, localTx.amount, localTx.email, `Refund for rejected withdrawal: ${tx_id}`)
        }
        recordTransactionRecord(localTx)
      }

      try {
        const { data: tx } = await supabase.from('transactions').select('*').eq('id', tx_id).single()
        if (tx && tx.type === 'withdraw') {
          const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', tx.user_id).single()
          if (wallet) {
            await supabase.from('wallets').update({ balance: wallet.balance + tx.amount }).eq('user_id', tx.user_id)
          }
        }
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', tx_id)
      } catch (e) {}

      return res.status(200).json({ success: true, message: 'Transaction rejected and updated.' })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Operation failed' })
  }
}
