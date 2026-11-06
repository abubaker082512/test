import { debitUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore'
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, account_number, account_title, bank_name, email, notes } = req.body
  const numAmount = parseFloat(amount)
  
  if (!user_id || !numAmount || numAmount < 500) {
    return res.status(400).json({ error: 'Minimum withdrawal is Rs 500' })
  }

  // Check balance and debit immediately
  const debitRes = debitUserBalance(user_id, numAmount)
  if (!debitRes.success) {
    return res.status(400).json({ error: 'Insufficient balance for withdrawal' })
  }

  const withdrawMethod = method || 'Bank Transfer'
  const isBank = withdrawMethod.toLowerCase().includes('bank')
  const detailedNotes = notes || (isBank 
    ? `Withdrawal to ${bank_name || 'Bank Transfer'} | Title: ${account_title || 'N/A'} | A/C: ${account_number}`
    : `Withdrawal to ${withdrawMethod} | Title: ${account_title || 'N/A'} | Number: ${account_number}`)

  // Log pending withdrawal in ledger
  const tx = recordTransactionRecord({
    user_id,
    email: email || '',
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
    }
  })

  // Sync to Firebase/Firestore if connected
  try {
    updateWalletBalance(user_id, debitRes.wallet.balance).catch(() => {})
    addTransaction({
      user_id,
      type: 'withdraw',
      amount: numAmount,
      status: 'pending',
      method: isBank && bank_name ? bank_name : withdrawMethod,
      notes: detailedNotes,
      account_number,
      account_title
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ 
    success: true, 
    message: `Withdrawal request of Rs ${numAmount.toLocaleString()} submitted. Amount deducted. Processing within 24 hours.`, 
    new_balance: debitRes.wallet.balance,
    transaction: tx
  })
}
