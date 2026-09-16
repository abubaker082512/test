import { createClient } from '@supabase/supabase-js'
import { getAllTransactionsList, getAllWalletsList } from '../../../utils/walletStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  if (password !== 'Admin@123') return res.status(401).json({ error: 'Unauthorized' })

  try {
    // 1. Get transactions & wallets from primary persistent store
    const localTxs = getAllTransactionsList()
    const localWallets = getAllWalletsList()

    // 2. Fetch remote Supabase transactions & wallets if reachable
    let remoteTxs = []
    let remoteWallets = []
    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      if (txs) remoteTxs = txs

      const { data: wList } = await supabase
        .from('wallets')
        .select('*')
      if (wList) remoteWallets = wList
    } catch (e) {}

    // Merge transactions uniquely by id / tx_id
    const txMap = new Map()
    for (const t of [...localTxs, ...remoteTxs]) {
      const key = t.tx_id || t.id
      if (key && (!txMap.has(key) || t.status === 'completed')) {
        txMap.set(key, t)
      }
    }
    const allTransactions = Array.from(txMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    const pendingTransactions = allTransactions.filter(t => t.status === 'pending')

    // Merge wallets uniquely by user_id
    const walletMap = new Map()
    for (const w of [...localWallets, ...remoteWallets]) {
      if (w.user_id && !walletMap.has(w.user_id)) {
        walletMap.set(w.user_id, w)
      }
    }
    const allWallets = Array.from(walletMap.values())

    // 3. Registered Users list
    const userMap = new Map()
    for (const w of allWallets) {
      if (w.user_id) {
        userMap.set(w.user_id, {
          id: w.user_id,
          email: w.email || `User_${w.user_id.substring(0, 8)}`,
          created_at: w.created_at
        })
      }
    }
    for (const t of allTransactions) {
      if (t.user_id && !userMap.has(t.user_id)) {
        userMap.set(t.user_id, {
          id: t.user_id,
          email: t.email || `User_${t.user_id.substring(0, 8)}`,
          created_at: t.created_at
        })
      }
    }

    return res.status(200).json({
      success: true,
      pending: pendingTransactions,
      all_transactions: allTransactions,
      wallets: allWallets,
      users: Array.from(userMap.values())
    })

  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch admin data: ${err.message}` })
  }
}
