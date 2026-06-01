import { createClient } from '@supabase/supabase-js'

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

  // Get the transaction
  const { data: tx } = await supabase
    .from('transactions').select('*').eq('id', tx_id).single()

  if (!tx) return res.status(404).json({ error: 'Transaction not found' })
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Transaction already processed' })

  if (action === 'approve') {
    // Credit wallet for deposits
    if (tx.type === 'deposit') {
      const { data: wallet } = await supabase
        .from('wallets').select('*').eq('user_id', tx.user_id).single()

      if (wallet) {
        await supabase.from('wallets').update({ balance: wallet.balance + tx.amount }).eq('user_id', tx.user_id)
      } else {
        // Create wallet if not exists
        await supabase.from('wallets').insert({ user_id: tx.user_id, balance: tx.amount })
      }
    }
    // For withdrawals, amount was already deducted on submission — just mark complete
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx_id)
    return res.status(200).json({ success: true, message: 'Transaction approved' })
  }

  if (action === 'reject') {
    // Refund if withdrawal was rejected
    if (tx.type === 'withdraw') {
      const { data: wallet } = await supabase
        .from('wallets').select('*').eq('user_id', tx.user_id).single()
      if (wallet) {
        await supabase.from('wallets').update({ balance: wallet.balance + tx.amount }).eq('user_id', tx.user_id)
      }
    }
    await supabase.from('transactions').update({ status: 'failed' }).eq('id', tx_id)
    return res.status(200).json({ success: true, message: 'Transaction rejected and refunded' })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
