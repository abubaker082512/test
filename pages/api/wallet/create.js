import {
  ensureLiveUserWallet,
  getAllWalletsList,
  creditUserBalance,
  recordTransactionRecord,
  commitWalletBalanceToSupabase,
  commitTransactionToSupabase,
  getLiveUserTransactions
} from '../../../utils/walletStore'
import { getOrCreateWallet } from '../../../utils/firebaseDb'

// Ensure wallet exists in Supabase when user signs up or logs in
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, email, referrer_email } = req.body
  if (!user_id && !email) return res.status(400).json({ error: 'Missing user_id or email' })

  const cleanEmail = (email || '').toLowerCase().trim()

  // 1. Authoritatively ensure Supabase Auth user + wallets row exist
  const wallet = await ensureLiveUserWallet(user_id || cleanEmail, cleanEmail)
  try {
    getOrCreateWallet(wallet.user_id || user_id, wallet.balance).catch(() => {})
  } catch (e) {}

  // 2. Process referral reward once if referrer provided
  if (referrer_email) {
    const cleanRef = referrer_email.toString().trim().toLowerCase()
    if (cleanRef && cleanRef !== cleanEmail && cleanRef !== cleanEmail.split('@')[0]) {
      try {
        let refWallet = await ensureLiveUserWallet(cleanRef, cleanRef.includes('@') ? cleanRef : '')
        if (!refWallet || !refWallet.user_id) {
          const allWallets = getAllWalletsList()
          const matched = allWallets.find(w =>
            w.email?.toLowerCase() === cleanRef ||
            w.email?.toLowerCase().startsWith(cleanRef + '@') ||
            w.user_id === cleanRef
          )
          if (matched) refWallet = matched
        }

        if (refWallet && refWallet.user_id !== wallet.user_id) {
          // Idempotency: check if this referrer already received a reward for this invitee
          const refTxs = await getLiveUserTransactions(refWallet.user_id, refWallet.email || cleanRef)
          const inviteeTag = cleanEmail || user_id
          const alreadyRewarded = refTxs.some(t => t.notes && t.notes.includes(`Invited ${inviteeTag}`))

          if (!alreadyRewarded) {
            const rewardAmt = 155.55
            const updatedRefWallet = creditUserBalance(
              refWallet.user_id,
              rewardAmt,
              refWallet.email || cleanRef,
              `Referral Reward: Invited ${inviteeTag}`
            )
            await commitWalletBalanceToSupabase(refWallet.user_id, updatedRefWallet.balance, refWallet.email || cleanRef)

            const refTx = recordTransactionRecord({
              user_id: refWallet.user_id,
              email: refWallet.email || cleanRef,
              type: 'payout',
              amount: rewardAmt,
              status: 'completed',
              method: 'Referral Bonus',
              notes: `Referral Reward: Invited ${inviteeTag}`,
              skipAsyncSupabase: true
            })
            await commitTransactionToSupabase(refTx)
          }
        }
      } catch (refErr) {
        console.error('Referral processing error:', refErr)
      }
    }
  }

  return res.status(200).json({ success: true, message: 'Wallet ready', wallet })
}
