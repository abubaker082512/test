import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return res.status(200).json({
        success: true,
        pkr_rate: 1.00,
        usd_rate: 280.00,
        payin_pkr_rate: 1.00,
        payout_pkr_rate: 1.00,
        directpay_client_id: process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_test123',
        directpay_client_secret: process.env.DIRECTPAY_CLIENT_SECRET || 'your_secret_key',
        directpay_enabled: true,
        is_fallback: true
      })
    }

    return res.status(200).json({
      success: true,
      pkr_rate: parseFloat(data.pkr_rate || 1.0),
      usd_rate: parseFloat(data.usd_rate || 280.0),
      payin_pkr_rate: parseFloat(data.payin_pkr_rate || data.pkr_rate || 1.0),
      payout_pkr_rate: parseFloat(data.payout_pkr_rate || data.pkr_rate || 1.0),
      directpay_client_id: data.directpay_client_id || process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_test123',
      directpay_client_secret: data.directpay_client_secret || process.env.DIRECTPAY_CLIENT_SECRET || 'your_secret_key',
      directpay_enabled: data.directpay_enabled !== false,
      is_fallback: false
    })
  } catch (err) {
    return res.status(200).json({
      success: true,
      pkr_rate: 1.00,
      usd_rate: 280.00,
      payin_pkr_rate: 1.00,
      payout_pkr_rate: 1.00,
      directpay_client_id: process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_test123',
      directpay_client_secret: process.env.DIRECTPAY_CLIENT_SECRET || 'your_secret_key',
      directpay_enabled: true,
      is_fallback: true,
      error: err.message
    })
  }
}
