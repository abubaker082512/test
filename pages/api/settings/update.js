import { db } from '../../../utils/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { savePersistedSettings } from '../../../utils/settingsStore'

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    password,
    pkr_rate,
    usd_rate,
    payin_pkr_rate,
    payout_pkr_rate,
    directpay_client_id,
    directpay_client_secret,
    directpay_enabled,
    jazzcash_merchant_id,
    jazzcash_password,
    jazzcash_integrity_salt,
    jazzcash_enabled,
    jazzcash_mode,
    easypaisa_store_id,
    easypaisa_hash_key,
    easypaisa_enabled,
    easypaisa_mode,
    card_mode
  } = req.body

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const pRate = parseFloat(pkr_rate)
  const uRate = parseFloat(usd_rate)

  if (isNaN(pRate) || pRate <= 0 || isNaN(uRate) || uRate <= 0) {
    return res.status(400).json({ error: 'Invalid rates. Must be positive numbers.' })
  }

  // 1. Supabase-compatible currency_rates payload (only standard columns)
  const basePayload = {
    id: 1,
    pkr_rate: pRate,
    usd_rate: uRate,
    updated_at: new Date().toISOString()
  }

  if (payin_pkr_rate) basePayload.payin_pkr_rate = parseFloat(payin_pkr_rate)
  if (payout_pkr_rate) basePayload.payout_pkr_rate = parseFloat(payout_pkr_rate)
  if (directpay_client_id !== undefined) basePayload.directpay_client_id = String(directpay_client_id).trim()
  if (directpay_client_secret !== undefined) basePayload.directpay_client_secret = String(directpay_client_secret).trim()
  if (directpay_enabled !== undefined) basePayload.directpay_enabled = Boolean(directpay_enabled)

  // 2. Extended Gateway Configuration payload
  const extendedConfig = {
    ...basePayload,
    jazzcash_merchant_id: jazzcash_merchant_id ? String(jazzcash_merchant_id).trim() : '74584985',
    jazzcash_password: jazzcash_password ? String(jazzcash_password).trim() : 'qo38057jbm',
    jazzcash_integrity_salt: jazzcash_integrity_salt ? String(jazzcash_integrity_salt).trim() : 'z35f76uo0m',
    jazzcash_enabled: jazzcash_enabled !== undefined ? Boolean(jazzcash_enabled) : true,
    jazzcash_mode: jazzcash_mode ? String(jazzcash_mode).trim() : 'directpay',
    easypaisa_store_id: easypaisa_store_id ? String(easypaisa_store_id).trim() : '43',
    easypaisa_hash_key: easypaisa_hash_key ? String(easypaisa_hash_key).trim() : '1234567890123456',
    easypaisa_enabled: easypaisa_enabled !== undefined ? Boolean(easypaisa_enabled) : true,
    easypaisa_mode: easypaisa_mode ? String(easypaisa_mode).trim() : 'directpay',
    card_mode: card_mode ? String(card_mode).trim() : 'directpay'
  }

  // 3. Atomically persist immediately to disk/in-memory store
  const persisted = savePersistedSettings(extendedConfig)

  // 4. Update in Firestore with bounded timeout
  try {
    const docRef = doc(db, 'settings', 'payment_gateways')
    await Promise.race([
      setDoc(docRef, extendedConfig, { merge: true }),
      new Promise((res) => setTimeout(res, 800))
    ])
  } catch (fsErr) {}

  return res.status(200).json({
    success: true,
    message: 'Settings, DirectPay, JazzCash & EasyPaisa configurations updated successfully!',
    ...persisted
  })
}
