import { debitUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, account_number, email } = req.body
  const numAmount = parseFloat(amount)
  if (!user_id || !numAmount || numAmount < 500) return res.status(400).json({ error: 'Minimum withdrawal is Pi 500' })

  // Check balance and debit
  const debitRes = debitUserBalance(user_id, numAmount)
  if (!debitRes.success) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  // Log pending withdrawal
  recordTransactionRecord({
    user_id,
    email: email || '',
    type: 'withdraw',
    amount: numAmount,
    status: 'pending',
    method,
    notes: `Withdraw to ${method} account: ${account_number}`
  })

  // Firestore sync
  try {
    updateWalletBalance(user_id, debitRes.wallet.balance).catch(() => {})
    addTransaction({
      user_id,
      type: 'withdraw',
      amount: numAmount,
      status: 'pending',
      notes: `Withdraw to ${method} account: ${account_number}`
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, message: 'Withdrawal request submitted. Processing within 24 hours.', new_balance: debitRes.wallet.balance })
}
