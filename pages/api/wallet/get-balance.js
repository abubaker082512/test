import { getLiveUserTransactions, getLiveUserWallet, getUserWallet, getUserTransactionsList } from '../../../utils/walletStore'

export default async function handler(req, res) {
  const userId = req.query.user_id || req.body?.user_id
  const email = (req.query.email || req.body?.email || '').toLowerCase().trim()

  if (!userId && !email) {
    return res.status(400).json({ error: 'user_id or email required' })
  }

  try {
    // 1. Primary: load live from persistent Supabase PostgreSQL walletStore
    const pWallet = await getLiveUserWallet(userId, email)
    const userTxs = await getLiveUserTransactions(userId, email)

    if (pWallet) {
      return res.status(200).json({
        success: true,
        balance: parseFloat(pWallet.balance || 0),
        wallet: pWallet,
        transactions: userTxs || []
      })
    }

    const fallbackWallet = getUserWallet(userId, email)
    return res.status(200).json({
      success: true,
      balance: parseFloat(fallbackWallet.balance || 0),
      wallet: fallbackWallet,
      transactions: userTxs || []
    })
  } catch (err) {
    console.error('get-balance API error:', err)
    const fallbackWallet = getUserWallet(userId, email)
    return res.status(200).json({
      success: true,
      balance: parseFloat(fallbackWallet.balance || 0),
      wallet: fallbackWallet,
      transactions: []
    })
  }
}
