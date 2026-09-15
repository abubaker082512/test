import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DEFAULT_CLIENT_ID = process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux'
const DEFAULT_CLIENT_SECRET = process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca'

const DEFAULT_JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '74584985'
const DEFAULT_JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD || 'qo38057jbm'
const DEFAULT_JAZZCASH_SALT = process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m'

const DEFAULT_EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID || '43'
const DEFAULT_EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY || '1234567890123456'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('id', 1)
      .single()

    const defaults = {
      success: true,
      pkr_rate: 1.00,
      usd_rate: 280.00,
      payin_pkr_rate: 1.00,
      payout_pkr_rate: 1.00,
      directpay_client_id: DEFAULT_CLIENT_ID,
      directpay_client_secret: DEFAULT_CLIENT_SECRET,
      directpay_enabled: true,
      jazzcash_merchant_id: DEFAULT_JAZZCASH_MERCHANT_ID,
      jazzcash_password: DEFAULT_JAZZCASH_PASSWORD,
      jazzcash_integrity_salt: DEFAULT_JAZZCASH_SALT,
      jazzcash_enabled: true,
      jazzcash_mode: 'direct_api',
      easypaisa_store_id: DEFAULT_EASYPAISA_STORE_ID,
      easypaisa_hash_key: DEFAULT_EASYPAISA_HASH_KEY,
      easypaisa_enabled: true,
      easypaisa_mode: 'direct_api',
      card_mode: 'direct_api'
    }

    if (error || !data) {
      return res.status(200).json({
        ...defaults,
        is_fallback: true
      })
    }

    return res.status(200).json({
      success: true,
      pkr_rate: parseFloat(data.pkr_rate || 1.0),
      usd_rate: parseFloat(data.usd_rate || 280.0),
      payin_pkr_rate: parseFloat(data.payin_pkr_rate || data.pkr_rate || 1.0),
      payout_pkr_rate: parseFloat(data.payout_pkr_rate || data.pkr_rate || 1.0),
      directpay_client_id: data.directpay_client_id || DEFAULT_CLIENT_ID,
      directpay_client_secret: data.directpay_client_secret || DEFAULT_CLIENT_SECRET,
      directpay_enabled: data.directpay_enabled !== false,
      jazzcash_merchant_id: data.jazzcash_merchant_id || DEFAULT_JAZZCASH_MERCHANT_ID,
      jazzcash_password: data.jazzcash_password || DEFAULT_JAZZCASH_PASSWORD,
      jazzcash_integrity_salt: data.jazzcash_integrity_salt || DEFAULT_JAZZCASH_SALT,
      jazzcash_enabled: data.jazzcash_enabled !== false,
      jazzcash_mode: data.jazzcash_mode || 'direct_api',
      easypaisa_store_id: data.easypaisa_store_id || DEFAULT_EASYPAISA_STORE_ID,
      easypaisa_hash_key: data.easypaisa_hash_key || DEFAULT_EASYPAISA_HASH_KEY,
      easypaisa_enabled: data.easypaisa_enabled !== false,
      easypaisa_mode: data.easypaisa_mode || 'direct_api',
      card_mode: data.card_mode || 'direct_api',
      is_fallback: false
    })
  } catch (err) {
    return res.status(200).json({
      success: true,
      pkr_rate: 1.00,
      usd_rate: 280.00,
      payin_pkr_rate: 1.00,
      payout_pkr_rate: 1.00,
      directpay_client_id: DEFAULT_CLIENT_ID,
      directpay_client_secret: DEFAULT_CLIENT_SECRET,
      directpay_enabled: true,
      jazzcash_merchant_id: DEFAULT_JAZZCASH_MERCHANT_ID,
      jazzcash_password: DEFAULT_JAZZCASH_PASSWORD,
      jazzcash_integrity_salt: DEFAULT_JAZZCASH_SALT,
      jazzcash_enabled: true,
      jazzcash_mode: 'direct_api',
      easypaisa_store_id: DEFAULT_EASYPAISA_STORE_ID,
      easypaisa_hash_key: DEFAULT_EASYPAISA_HASH_KEY,
      easypaisa_enabled: true,
      easypaisa_mode: 'direct_api',
      card_mode: 'direct_api',
      is_fallback: true,
      error: err.message
    })
  }
}
