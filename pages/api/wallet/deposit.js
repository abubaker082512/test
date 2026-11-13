import { recordTransactionRecord, getAllTransactionsList } from '../../../utils/walletStore.js'
import { addTransaction } from '../../../utils/firebaseDb.js'
import { getPersistedSettings } from '../../../utils/settingsStore.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    user_id,
    amount,
    channel,
    method,
    sender_phone,
    sender_name,
    tid,
    notes,
    screenshot_url,
    bonus_amount,
    email
  } = req.body

  const settings = getPersistedSettings()
  const minDeposit = Number(settings.min_deposit || 200)
  const maxDeposit = Number(settings.max_deposit || 100000)

  if (!user_id) {
    return res.status(400).json({ error: 'Authentication required. Please sign in to deposit.' })
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount < minDeposit) {
    return res.status(400).json({ error: `Minimum deposit amount is Rs ${minDeposit.toLocaleString()}` })
  }
  if (numAmount > maxDeposit) {
    return res.status(400).json({ error: `Maximum deposit amount is Rs ${maxDeposit.toLocaleString()}` })
  }

  const cleanTid = String(tid || '').trim() || (screenshot_url ? `SS-${Date.now().toString(36).toUpperCase()}` : '')
  if (!cleanTid && !screenshot_url) {
    return res.status(400).json({ error: 'Please enter your Transaction ID (TID) or upload your payment receipt screenshot.' })
  }

  // Prevent duplicate TID submission (if real TID provided)
  if (cleanTid && !cleanTid.startsWith('SS-')) {
    const allTxs = getAllTransactionsList()
    const duplicate = allTxs.find(t => 
      (t.metadata?.tid && String(t.metadata.tid).trim().toLowerCase() === cleanTid.toLowerCase()) ||
      (t.tx_id && String(t.tx_id).trim().toLowerCase() === cleanTid.toLowerCase())
    )
    if (duplicate) {
      return res.status(400).json({
        error: `Transaction ID '${cleanTid}' has already been submitted (${duplicate.status}). If you need help, please contact live support.`
      })
    }
  }

  const resolvedChannel = channel || method || 'Easypaisa'
  const internalTxId = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  const numBonus = parseFloat(bonus_amount) || 0

  const metadata = {
    channel: resolvedChannel,
    tid: cleanTid,
    sender_phone: sender_phone || '',
    sender_name: sender_name || '',
    bonus_amount: numBonus,
    screenshot_url: screenshot_url || '',
    submitted_at: new Date().toISOString()
  }

  // Record pending deposit
  const tx = recordTransactionRecord({
    id: internalTxId,
    user_id,
    email: email || '',
    type: 'deposit',
    amount: numAmount,
    status: 'pending',
    method: resolvedChannel,
    tx_id: internalTxId,
    screenshot_url: screenshot_url || '',
    notes: `Deposit via ${resolvedChannel} | Sender: ${sender_phone || 'N/A'} | TID: ${cleanTid}${numBonus > 0 ? ` (+Rs ${numBonus} bonus)` : ''}${screenshot_url ? ' | 📷 Receipt Attached' : ''}`,
    metadata
  })

  // Sync to Firestore if available
  try {
    addTransaction({
      user_id,
      type: 'deposit',
      amount: numAmount,
      status: 'pending',
      notes: tx.notes,
      metadata
    }).catch(() => {})
  } catch (e) {}

  return res.status(200).json({
    success: true,
    tx_id: internalTxId,
    tid: cleanTid,
    amount: numAmount,
    bonus: numBonus,
    message: `Deposit request for Rs ${numAmount.toLocaleString()} submitted successfully! It will be verified and credited to your balance shortly.`
  })
}
