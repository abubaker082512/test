import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = 'Admin@123'

// In-memory fallback risk configuration
let riskConfig = {
  global_rtp: 95.0, // Global Return To Player percentage
  max_win_cap: 2000.0, // Max net win before auto win-stop
  force_house_edge: false,
  restricted_users: [] // Array of user_ids whose winnings are frozen/stopped
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('id', 1)
        .single()

      if (data && data.risk_config) {
        riskConfig = { ...riskConfig, ...data.risk_config }
      }

      return res.status(200).json({
        success: true,
        config: riskConfig
      })
    } catch {
      return res.status(200).json({
        success: true,
        config: riskConfig
      })
    }
  }

  if (req.method === 'POST') {
    const { password, global_rtp, max_win_cap, force_house_edge, restricted_users, toggle_user_id } = req.body

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (global_rtp !== undefined) riskConfig.global_rtp = parseFloat(global_rtp)
    if (max_win_cap !== undefined) riskConfig.max_win_cap = parseFloat(max_win_cap)
    if (force_house_edge !== undefined) riskConfig.force_house_edge = Boolean(force_house_edge)
    if (restricted_users !== undefined && Array.isArray(restricted_users)) {
      riskConfig.restricted_users = restricted_users
    }

    // Quick toggle for a single user ID
    if (toggle_user_id) {
      const exists = riskConfig.restricted_users.includes(toggle_user_id)
      if (exists) {
        riskConfig.restricted_users = riskConfig.restricted_users.filter(id => id !== toggle_user_id)
      } else {
        riskConfig.restricted_users.push(toggle_user_id)
      }
    }

    try {
      await supabase
        .from('currency_rates')
        .upsert({
          id: 1,
          risk_config: riskConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
    } catch (e) {
      console.warn('Could not persist risk config to DB, using in-memory state:', e.message)
    }

    return res.status(200).json({
      success: true,
      message: 'Risk settings and anti-win controls updated successfully',
      config: riskConfig
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export function getActiveRiskConfig() {
  return riskConfig
}
