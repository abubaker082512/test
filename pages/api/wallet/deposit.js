import { recordTransactionRecord } from '../../../utils/walletStore'
import { addTransaction } from '../../../utils/firebaseDb'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, method, tx_id, email } = req.body
  if (!user_id || !amount || parseFloat(amount) < 100) return res.status(400).json({ error: 'Minimum deposit is Pi 100' })
  if (!method || !tx_id) return res.status(400).json({ error: 'Payment method and transaction ID required' })

  const numAmount = parseFloat(amount)

  // Log pending deposit
  recordTransactionRecord({
    user_id,
    email: email || '',
    type: 'deposit',
    amount: numAmount,
    status: 'pending',
    method,
    tx_id,
    notes: `Deposit via ${method} — TxID: ${tx_id}`
  })

  // Sync with Firestore
  try {
    addTransaction({
      user_id,
      type: 'deposit',
      amount: numAmount,
      status: 'pending',
      notes: `Deposit via ${method} — TxID: ${tx_id}`,
      metadata: { method, tx_id }
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({ success: true, message: 'Deposit request submitted. Pending admin approval.' })
}
