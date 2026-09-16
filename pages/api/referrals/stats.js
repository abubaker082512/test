import { getReferralStatsForUser, getUserWallet } from '../../../utils/walletStore'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user_id, email } = req.query
  if (!user_id && !email) {
    return res.status(400).json({ error: 'Missing user_id or email parameter' })
  }

  try {
    const stats = getReferralStatsForUser(user_id || '', email || '')
    const wallet = getUserWallet(user_id || '', email || '')
    
    return res.status(200).json({
      success: true,
      user_id: wallet.user_id,
      email: wallet.email || email,
      referralCode: (email || wallet.email || '').split('@')[0] || wallet.user_id,
      totalInvited: stats.totalInvited,
      totalEarnings: stats.totalEarnings,
      bonusPerReferral: 155.55,
      commissionRatePct: 5.0,
      referrals: stats.referrals
    })
  } catch (err) {
    console.error('Error fetching referral stats:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
