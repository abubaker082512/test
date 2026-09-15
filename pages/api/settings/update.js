import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

  const updatePayload = {
    id: 1,
    pkr_rate: pRate,
    usd_rate: uRate,
    updated_at: new Date().toISOString()
  }

  if (payin_pkr_rate) updatePayload.payin_pkr_rate = parseFloat(payin_pkr_rate)
  if (payout_pkr_rate) updatePayload.payout_pkr_rate = parseFloat(payout_pkr_rate)
  if (directpay_client_id !== undefined) updatePayload.directpay_client_id = String(directpay_client_id).trim()
  if (directpay_client_secret !== undefined) updatePayload.directpay_client_secret = String(directpay_client_secret).trim()
  if (directpay_enabled !== undefined) updatePayload.directpay_enabled = Boolean(directpay_enabled)

  // JazzCash Settings
  if (jazzcash_merchant_id !== undefined) updatePayload.jazzcash_merchant_id = String(jazzcash_merchant_id).trim()
  if (jazzcash_password !== undefined) updatePayload.jazzcash_password = String(jazzcash_password).trim()
  if (jazzcash_integrity_salt !== undefined) updatePayload.jazzcash_integrity_salt = String(jazzcash_integrity_salt).trim()
  if (jazzcash_enabled !== undefined) updatePayload.jazzcash_enabled = Boolean(jazzcash_enabled)
  if (jazzcash_mode !== undefined) updatePayload.jazzcash_mode = String(jazzcash_mode).trim()

  // EasyPaisa Settings
  if (easypaisa_store_id !== undefined) updatePayload.easypaisa_store_id = String(easypaisa_store_id).trim()
  if (easypaisa_hash_key !== undefined) updatePayload.easypaisa_hash_key = String(easypaisa_hash_key).trim()
  if (easypaisa_enabled !== undefined) updatePayload.easypaisa_enabled = Boolean(easypaisa_enabled)
  if (easypaisa_mode !== undefined) updatePayload.easypaisa_mode = String(easypaisa_mode).trim()

  // Card Gateway Mode
  if (card_mode !== undefined) updatePayload.card_mode = String(card_mode).trim()

  try {
    const { error } = await supabase
      .from('currency_rates')
      .upsert(updatePayload, { onConflict: 'id' })

    if (error) {
      console.error('Update exchange rates error:', error)
      return res.status(500).json({
        error: `Database error: ${error.message}`
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Settings, DirectPay, JazzCash & EasyPaisa configurations updated successfully',
      ...updatePayload
    })
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
