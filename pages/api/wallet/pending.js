import { getAllTransactionsList, getAllWalletsList, completeAndCreditTransaction, failTransaction, hydrateFromSupabase } from '../../../utils/walletStore'
import { updateWalletBalance } from '../../../utils/firebaseDb'

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  const validPasswords = [process.env.ADMIN_PASSWORD, 'Admin@WinXPro2026!', 'Admin@WinX2024', 'Admin@123'].filter(Boolean)
  if (!validPasswords.includes(password)) return res.status(401).json({ error: 'Unauthorized' })

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

    // 1. Refresh live from Supabase PostgreSQL database
    await hydrateFromSupabase(true)

    // 2. Get updated transactions & wallets from primary persistent store
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
    // SINGLE SOURCE OF TRUTH: Always prefer authoritative Supabase UUID wallet rows (and latest updated_at),
    // NEVER pick max(balance), which previously caused stale higher balances (e.g. 1011 vs real 911) to appear in Admin.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const walletMap = new Map()
    for (const w of localWallets) {
      const uidStr = String(w.user_id || w.id || '').trim()
      const email = (w.email || KNOWN_EMAILS[uidStr] || (uidStr.includes('@') ? uidStr : '')).toLowerCase().trim()
      const key = email || uidStr
      if (!key) continue

      const existing = walletMap.get(key)
      const isIncomingAuth = Boolean(w.isAuthoritative) || UUID_RE.test(uidStr)
      const isExistingAuth = existing ? (Boolean(existing.isAuthoritative) || UUID_RE.test(String(existing.user_id || existing.id || ''))) : false

      if (!existing) {
        walletMap.set(key, { ...w, email: email || w.email || '' })
      } else if (isIncomingAuth && !isExistingAuth) {
        // Authoritative Supabase UUID row ALWAYS overrides stale local/alias entry
        walletMap.set(key, { ...w, email: email || w.email || existing.email || '' })
      } else if (isIncomingAuth === isExistingAuth) {
        // Same authority tier: prefer the most recently updated wallet
        const incTime = new Date(w.updated_at || 0).getTime()
        const extTime = new Date(existing.updated_at || 0).getTime()
        if (incTime > extTime) {
          walletMap.set(key, { ...w, email: email || w.email || existing.email || '' })
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

