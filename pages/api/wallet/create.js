import { getUserWallet, creditUserBalance, recordTransactionRecord } from '../../../utils/walletStore'
import { getOrCreateWallet } from '../../../utils/firebaseDb'

// Create wallet when user signs up
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email, referrer_email } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  // Initialize wallet
  const wallet = getUserWallet(user_id, email || '')
  try {
    getOrCreateWallet(user_id, wallet.balance).catch(() => {})
  } catch (e) {}

  // Process referral reward if referrer email provided
  if (referrer_email && referrer_email.toLowerCase() !== (email || '').toLowerCase()) {
    try {
      const refWallet = getUserWallet('', referrer_email)
      if (refWallet && refWallet.user_id !== user_id) {
        creditUserBalance(refWallet.user_id, 155.55, referrer_email, `Referral Reward: Invited ${email || user_id}`)
        recordTransactionRecord({
          user_id: refWallet.user_id,
          email: referrer_email,
          type: 'payout',
          amount: 155.55,
          status: 'completed',
          method: 'Referral Bonus',
          notes: `Referral Reward: Invited ${email || user_id}`
        })
      }
    } catch (refErr) {
      console.error('Referral processing error:', refErr)
    }
  }

  return res.status(200).json({ success: true, message: 'Wallet ready', wallet })
}
