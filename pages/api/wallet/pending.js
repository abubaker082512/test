import { getAllTransactionsList, getAllWalletsList, completeAndCreditTransaction, failTransaction } from '../../../utils/walletStore'
import { updateWalletBalance } from '../../../utils/firebaseDb'

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  if (password !== 'Admin@123') return res.status(401).json({ error: 'Unauthorized' })

  try {
    // 0. Auto-sync any pending DirectPay transactions live against DirectPay status API
    const initialTxs = getAllTransactionsList()
    const pendingDirectPayTxs = initialTxs.filter(t => 
      t.status === 'pending' && 
      (
        (t.method && t.method.toLowerCase().includes('directpay')) ||
        (t.tx_id && String(t.tx_id).toUpperCase().startsWith('TXN-')) ||
        t.metadata?.gateway === 'DirectPay'
      )
    )

    for (const tx of pendingDirectPayTxs) {
      const searchId = tx.tx_id || tx.id
      if (!searchId) continue
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1500)

        const dpResponse = await fetch(
          `https://payin-pwa.directpay.pro/pay/status?client_id=${DEFAULT_CLIENT_ID}&client_transaction_id=${encodeURIComponent(searchId)}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          }
        ).catch(() => null)

        clearTimeout(timeoutId)

        if (dpResponse && dpResponse.ok) {
          const contentType = dpResponse.headers.get('content-type') || ''
          if (contentType.includes('json')) {
            const details = await dpResponse.json()
            const gwStatus = String(details.status || details.state || details.payment_status || '').toLowerCase()

            if (['completed', 'success', 'paid', '0000'].includes(gwStatus)) {
              const result = completeAndCreditTransaction(searchId, {
                amount: tx.amount,
                amountInPKR: tx.amount,
                method: tx.method || 'DirectPay',
                notes: `DirectPay Live Auto-Sync: PKR ${tx.amount}`
              })
              if (result && result.transaction) {
                try {
                  await updateWalletBalance(result.transaction.user_id, result.wallet.balance)
                } catch (e) {}
              }
            } else if (['failed', 'cancelled', 'declined', 'expired', 'failure'].includes(gwStatus)) {
              failTransaction(searchId, `DirectPay live status: ${gwStatus}`)
            }
          }
        }
      } catch (e) {
        console.warn(`DirectPay live sync error for ${searchId}:`, e.message)
      }
    }

    // 1. Get updated transactions & wallets from primary persistent store
    const localTxs = getAllTransactionsList()
    const localWallets = getAllWalletsList()

    // Merge transactions uniquely by id / tx_id
    const txMap = new Map()
    for (const t of localTxs) {
      const key = t.tx_id || t.id
      if (key && (!txMap.has(key) || t.status === 'completed')) {
        txMap.set(key, t)
      }
    }
    const allTransactions = Array.from(txMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    const pendingTransactions = allTransactions.filter(t => t.status === 'pending')

    // Predefined ID-to-email resolver
    const KNOWN_EMAILS = {
      '23b47415-5592-4a87-a5ef-3a537cc31b27': 'abtandco18@gmail.com',
      'd3fd1e06-7d45-498a-8ce7-1a812e962b3d': 'akhuwat.com.pk@gmail.com',
      'ca7adc60-4f05-42f2-8025-6ebf04b84fa6': 'jajsjsjsjssjjsjsjs@gmail.com',
      '7a90c640-010a-4dd0-bc38-fda2f4cfbfd1': 'akhuwatfoundation1@gmail.com',
      '6b653721-01dd-4a1b-9fac-c179624227b6': 'fabvisaconsultancy@gmail.com',
      'sheikhabubaker082512@gmail.com': 'sheikhabubaker082512@gmail.com',
      'player_03493530916': 'sheikhabubaker082512@gmail.com'
    }

    // Merge wallets uniquely by canonical email / user_id
    const walletMap = new Map()
    for (const w of localWallets) {
      const email = (w.email || KNOWN_EMAILS[w.user_id] || (w.user_id.includes('@') ? w.user_id : '')).toLowerCase().trim()
      const key = email || w.user_id
      if (key) {
        if (!walletMap.has(key) || (w.balance && w.balance > (walletMap.get(key)?.balance || 0))) {
          walletMap.set(key, { ...w, email: email || w.email || '' })
        }
      }
    }
    const allWallets = Array.from(walletMap.values())

    // 3. Registered Users list (one entry per unique email)
    const userMap = new Map()
    for (const w of allWallets) {
      const resolvedEmail = (w.email || KNOWN_EMAILS[w.user_id] || (w.user_id.includes('@') ? w.user_id : `User_${w.user_id.substring(0, 8)}`)).toLowerCase().trim()
      if (!userMap.has(resolvedEmail)) {
        userMap.set(resolvedEmail, {
          id: w.user_id || w.id,
          email: resolvedEmail,
          balance: w.balance || 0,
          created_at: w.created_at
        })
      }
    }

    for (const t of allTransactions) {
      const resolvedEmail = (t.email || KNOWN_EMAILS[t.user_id] || (t.user_id.includes('@') ? t.user_id : `User_${t.user_id.substring(0, 8)}`)).toLowerCase().trim()
      if (!userMap.has(resolvedEmail)) {
        userMap.set(resolvedEmail, {
          id: t.user_id || t.id,
          email: resolvedEmail,
          balance: 0,
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

