/**
 * Admin Login API - supports Supabase admin_users table
 * POST /api/admin/login
 * Body: { username, password } or { password } (legacy)
 */
import { supabase } from '../../../utils/supabaseClient'
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'winxpro_salt_2024').digest('hex')
}

// Hardcoded fallback credentials if DB not available
const FALLBACK_ADMINS = [
  { username: 'admin', password_hash: hashPassword('Admin@WinX2024'), role: 'super_admin' },
  { username: 'superadmin', password_hash: hashPassword('Admin@123'), role: 'super_admin' }
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })

  const cleanUsername = (username || 'admin').toLowerCase().trim()
  const passwordHash = hashPassword(password)

  // Try Supabase DB first
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', cleanUsername)
      .eq('is_active', true)
      .maybeSingle()

    if (!error && data) {
      if (data.password_hash === passwordHash) {
        return res.status(200).json({
          success: true,
          admin: {
            id: data.id,
            username: data.username,
            role: data.role,
            is_active: data.is_active
          }
        })
      } else {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
    }
  } catch (err) {
    console.error('[AdminLogin] DB error:', err.message)
  }

  // Fallback to hardcoded credentials
  const fallback = FALLBACK_ADMINS.find(a => a.username === cleanUsername && a.password_hash === passwordHash)
  if (fallback) {
    return res.status(200).json({
      success: true,
      admin: { username: fallback.username, role: fallback.role }
    })
  }

  // Legacy support: allow old password 'Admin@123' with no username
  if (password === 'Admin@123') {
    return res.status(200).json({
      success: true,
      admin: { username: 'admin', role: 'super_admin' }
    })
  }

  return res.status(401).json({ error: 'Invalid credentials' })
}
