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

  // Log welcome bonus if newly created
  try {
    recordTransactionRecord({
      user_id,
      email: email || '',
      type: 'payout',
      amount: 100.00,
      status: 'completed',
      method: 'Welcome Bonus',
      notes: 'New User Registration Bonus: Pi 100.00'
    })
  } catch (e) {}

  // Process referral reward if referrer provided
  if (referrer_email) {
    const cleanRef = referrer_email.toString().trim().toLowerCase()
    const cleanUserEmail = (email || '').toLowerCase().trim()
    
    if (cleanRef && cleanRef !== cleanUserEmail && cleanRef !== cleanUserEmail.split('@')[0]) {
      try {
        let refWallet = getUserWallet(cleanRef, cleanRef)
        // If not found directly, search all wallets for matching email prefix
        if (!refWallet || refWallet.balance === undefined) {
          const allWallets = require('../../../utils/walletStore').getAllWalletsList()
          const matched = allWallets.find(w => 
            w.email?.toLowerCase() === cleanRef ||
            w.email?.toLowerCase().startsWith(cleanRef + '@') ||
            w.user_id === cleanRef
          )
          if (matched) refWallet = matched
        }

        if (refWallet && refWallet.user_id !== user_id) {
          creditUserBalance(refWallet.user_id, 155.55, refWallet.email || cleanRef, `Referral Reward: Invited ${email || user_id}`)
          recordTransactionRecord({
            user_id: refWallet.user_id,
            email: refWallet.email || cleanRef,
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
  }

  return res.status(200).json({ success: true, message: 'Wallet ready', wallet })
}
