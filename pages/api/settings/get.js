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
      // Fallback to standard defaults if table is not created or query fails
      return res.status(200).json({
        success: true,
        pkr_rate: 1.00,
        usd_rate: 280.00,
        is_fallback: true
      })
    }

    return res.status(200).json({
      success: true,
      pkr_rate: parseFloat(data.pkr_rate),
      usd_rate: parseFloat(data.usd_rate),
      is_fallback: false
    })
  } catch (err) {
    return res.status(200).json({
      success: true,
      pkr_rate: 1.00,
      usd_rate: 280.00,
      is_fallback: true,
      error: err.message
    })
  }
}
