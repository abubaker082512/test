import { supabase } from '../../../utils/supabase.js'

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
    const body = req.body || {}
    const password = body.password
    const cfg = body.config || body

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const global_rtp = cfg.global_rtp !== undefined ? cfg.global_rtp : body.global_rtp
    const max_win_cap = cfg.max_win_cap !== undefined ? cfg.max_win_cap : body.max_win_cap
    const force_house_edge = cfg.force_house_edge !== undefined ? cfg.force_house_edge : body.force_house_edge
    const restricted_users = cfg.restricted_users !== undefined ? cfg.restricted_users : body.restricted_users
    const toggle_user_id = body.toggle_user_id || body.user_id || cfg.toggle_user_id || cfg.user_id

    if (global_rtp !== undefined) riskConfig.global_rtp = parseFloat(global_rtp)
    if (max_win_cap !== undefined) riskConfig.max_win_cap = parseFloat(max_win_cap)
    if (force_house_edge !== undefined) riskConfig.force_house_edge = Boolean(force_house_edge)
    if (restricted_users !== undefined && Array.isArray(restricted_users)) {
      riskConfig.restricted_users = restricted_users
    }

    // Quick toggle for a single user ID
    if (toggle_user_id) {
      if (!Array.isArray(riskConfig.restricted_users)) {
        riskConfig.restricted_users = []
      }
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
