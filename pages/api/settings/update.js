import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = 'Admin@123'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password, pkr_rate, usd_rate } = req.body

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const pRate = parseFloat(pkr_rate)
  const uRate = parseFloat(usd_rate)

  if (isNaN(pRate) || pRate <= 0 || isNaN(uRate) || uRate <= 0) {
    return res.status(400).json({ error: 'Invalid rates. Must be positive numbers.' })
  }

  try {
    const { error } = await supabase
      .from('currency_rates')
      .upsert({
        id: 1,
        pkr_rate: pRate,
        usd_rate: uRate,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) {
      console.error('Update exchange rates error:', error)
      return res.status(500).json({
        error: `Database error: ${error.message}. Make sure you run the SQL migration script from the currency_setup.sql artifact in your Supabase SQL Editor.`
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Exchange rates updated successfully',
      pkr_rate: pRate,
      usd_rate: uRate
    })
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
