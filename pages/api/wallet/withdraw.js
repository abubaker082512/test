import {
  ensureLiveUserWallet,
  atomicDebitBalance,
  recordTransactionRecord,
  commitTransactionToSupabase
} from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'
import { getPersistedSettings } from '../../../utils/settingsStore'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, account_number, account_title, bank_name, email, notes } = req.body
  const numAmount = parseFloat(amount)
  const settings = getPersistedSettings()
  const minWithdraw = Number(settings.min_withdraw || 500)
  const maxWithdraw = Number(settings.max_withdraw || 50000)

  if (!user_id && !email) {
    return res.status(400).json({ error: 'Authentication required. Please sign in to withdraw.' })
  }
  if (!numAmount || isNaN(numAmount) || numAmount < minWithdraw) {
    return res.status(400).json({ error: `Minimum withdrawal is Rs ${minWithdraw.toLocaleString()}` })
  }
  if (numAmount > maxWithdraw) {
    return res.status(400).json({ error: `Maximum withdrawal is Rs ${maxWithdraw.toLocaleString()}` })
  }

  // 1. Resolve authoritative live wallet from Supabase
  const liveWallet = await ensureLiveUserWallet(user_id || email, email || '')
  const authoritativeUserId = liveWallet?.user_id || user_id
  const authoritativeEmail = (email || liveWallet?.email || '').toLowerCase().trim()

  // 2. Atomically verify live balance in Supabase and debit
  const debitRes = await atomicDebitBalance(authoritativeUserId, numAmount, authoritativeEmail)
  if (!debitRes.success) {
    return res.status(400).json({ error: debitRes.error || 'Insufficient balance for withdrawal' })
  }

  const withdrawMethod = method || 'Bank Transfer'
  const isBank = withdrawMethod.toLowerCase().includes('bank')
  const detailedNotes = notes || (isBank
    ? `Withdrawal to ${bank_name || 'Bank Transfer'} | Title: ${account_title || 'N/A'} | A/C: ${account_number}`
    : `Withdrawal to ${withdrawMethod} | Title: ${account_title || 'N/A'} | Number: ${account_number}`)

  const internalTxId = `WDR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

  // 3. Log pending withdrawal in ledger and synchronously await Supabase commit
  const tx = recordTransactionRecord({
    id: internalTxId,
    tx_id: internalTxId,
    user_id: authoritativeUserId,
    email: authoritativeEmail,
    type: 'withdraw',
    amount: numAmount,
    status: 'pending',
    method: isBank && bank_name ? `${bank_name} (1LINK)` : withdrawMethod,
    notes: detailedNotes,
    metadata: {
      account_number,
      account_title,
      bank_name: isBank ? bank_name : null,
      channel: withdrawMethod
    },
    skipAsyncSupabase: true
  })

  await commitTransactionToSupabase(tx)

  // Sync to Firebase/Firestore if connected
  try {
    updateWalletBalance(authoritativeUserId, debitRes.wallet.balance).catch(() => {})
    addTransaction({
      user_id: authoritativeUserId,
      type: 'withdraw',
      amount: numAmount,
      status: 'pending',
      method: isBank && bank_name ? `${bank_name} (1LINK)` : withdrawMethod,
      notes: detailedNotes,
      account_number,
      account_title
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({
    success: true,
    tx_id: internalTxId,
    message: `Withdrawal request of Rs ${numAmount.toLocaleString()} submitted. Amount deducted. Processing within 24 hours.`,
    new_balance: debitRes.wallet.balance,
    transaction: tx
  })
}
