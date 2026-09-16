import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

export default function InvitePage() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    totalEarnings: 0,
    bonusPerReferral: 155.55,
    commissionRatePct: 5.0,
    referrals: []
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const emailPrefix = user?.email ? user.email.split('@')[0] : (user?.id ? user.id.substring(0, 8) : 'GUEST')
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(user?.email || user?.id || '')}`
    : `https://winxpro.com.pk/signup?ref=${encodeURIComponent(user?.email || user?.id || '')}`

  const fetchReferralStats = async () => {
    if (!user) {
      setLoadingStats(false)
      return
    }

    try {
      const activeUid = user.id || user.uid
      const activeEmail = user.email || ''
      const res = await fetch(`/api/referrals/stats?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const data = await res.json()
      if (data.success) {
        setReferralStats({
          totalInvited: data.totalInvited || 0,
          totalEarnings: data.totalEarnings || 0,
          bonusPerReferral: data.bonusPerReferral || 155.55,
          commissionRatePct: data.commissionRatePct || 5.0,
          referrals: data.referrals || []
        })
      }
    } catch (err) {
      console.error('Failed to query referrals:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchReferralStats()
    const interval = setInterval(fetchReferralStats, 10000)
    return () => clearInterval(interval)
  }, [user])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(emailPrefix)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'WinX Pro - Play & Win Cash in Pakistan',
        text: `Join WinX Pro using my referral code ${emailPrefix} to get a free Rs 100 Signup Bonus + VIP cash rewards!`,
        url: referralLink
      }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🎁 Join WinX Pro Pakistan and claim Rs 100 FREE Welcome Bonus! Use my invite code: ${emailPrefix}\n👉 Register here: ${referralLink}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const shareTelegram = () => {
    const text = encodeURIComponent(`🎁 Join WinX Pro Pakistan and claim Rs 100 FREE Welcome Bonus! Use my invite code: ${emailPrefix}`)
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(`Join WinX Pro Pakistan for a free Rs 100 Signup Bonus! Use code ${emailPrefix}`)
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank')
  }

  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Referral Center & Agent Program | WinX Pro</title>
        <meta name="description" content="Earn Rs 155.55 cash + 5% lifetime betting commissions for every friend you refer to WinX Pro Pakistan." />
      </Head>

      <NavBar />
      
      <main style={{ flex: 1, padding: '24px 16px 80px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #18092a 0%, #3b0764 50%, #09090b 100%)',
          borderRadius: '20px',
          padding: '24px 20px',
          border: '1px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 10px 40px rgba(0, 230, 118, 0.15)',
          marginBottom: '24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>💸</div>
          <h1 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900 }}>
            Invite & Earn Unlimited Cash
          </h1>
          <p style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.6', margin: '0 auto', maxWidth: '480px' }}>
            Earn <strong style={{ color: '#00e676', fontSize: '15px' }}>Pi 155.55 Cash</strong> directly in your wallet for every friend who registers, plus <strong style={{ color: '#ffd700' }}>5% Lifetime Commission</strong> on their bets & deposits!
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid #00e676', color: '#00e676', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              ✓ Instant Real Payouts
            </span>
            <span style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid #ffd700', color: '#ffd700', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              ✓ Friend Gets Pi 100 Free
            </span>
            <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              ✓ Unlimited Referrals
            </span>
          </div>
        </div>

        {user ? (
          <div>
            <div style={{
              background: '#121214',
              padding: '24px 20px',
              borderRadius: '18px',
              border: '1px solid #27272a',
              marginBottom: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Your Personal Referral Code
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{ background: 'transparent', border: 'none', color: '#00e676', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {copied ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>

              <div style={{
                background: '#18181b',
                padding: '14px 18px',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '2px',
                color: '#fff',
                border: '1px dashed #3f3f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{emailPrefix}</span>
                <span style={{ fontSize: '13px', background: '#00e676', color: '#000', padding: '4px 10px', borderRadius: '6px', fontWeight: 900 }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '6px', fontWeight: 700 }}>
                  Shareable Invitation Link
                </div>
                <div style={{
                  background: '#0a0a0c',
                  padding: '8px 10px 8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '12px', color: '#00e676', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralLink}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      background: 'linear-gradient(135deg, #00e676 0%, #00b34d 100%)',
                      color: '#000',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 900,
                      fontSize: '12px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {copied ? 'Copied! ✅' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#71717a', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
                  One-Click Quick Share
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <button
                    onClick={shareWhatsApp}
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 6px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={shareTelegram}
                    style={{
                      background: '#229ED9',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 6px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>✈️</span>
                    <span>Telegram</span>
                  </button>
                  <button
                    onClick={shareFacebook}
                    style={{
                      background: '#1877F2',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 6px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📘</span>
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={handleNativeShare}
                    style={{
                      background: '#3f3f46',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 6px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>↗️</span>
                    <span>Share All</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#121214', border: '1px solid #27272a', padding: '18px 16px', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>FRIENDS REFERRED</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#00e676', marginTop: '6px' }}>
                  {loadingStats ? '...' : referralStats.totalInvited}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>Total Registered</div>
              </div>
              <div style={{ background: '#121214', border: '1px solid #27272a', padding: '18px 16px', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL COMMISSION EARNED</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffd700', marginTop: '6px' }}>
                  Pi {loadingStats ? '...' : referralStats.totalEarnings.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>Auto-Credited to Wallet</div>
              </div>
            </div>

            <div style={{ background: '#121214', border: '1px solid #27272a', borderRadius: '16px', padding: '18px 16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👑</span> Referral Reward & Commission Tiers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181b', padding: '10px 12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Level 1: Direct Friends</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Instant registration bonus + bet commission</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#00e676' }}>+Pi 155.55</div>
                    <div style={{ fontSize: '10px', color: '#ffd700', fontWeight: 700 }}>+ 5.0% Rebate</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181b', padding: '10px 12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Level 2: Team Sub-Friends</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Friends invited by your referred friends</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#60a5fa' }}>+ 2.0%</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Per Bet Cycle</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181b', padding: '10px 12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Level 3: Community Depth</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Third tier downline network volume</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#a855f7' }}>+ 1.0%</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Per Bet Cycle</div>
                  </div>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '16px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> Referred Friends ({referralStats.referrals.length})
            </h2>
            <div style={{ background: '#121214', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
              {loadingStats ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>Loading referral records...</div>
              ) : referralStats.referrals.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#71717a' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🦊</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#d4d4d8' }}>No referrals registered yet</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Share your invite link above on WhatsApp or Telegram to get started!</div>
                </div>
              ) : (
                referralStats.referrals.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1f1f23' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{item.email}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                        Joined {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#00e676', fontWeight: 900, fontSize: '14px' }}>
                        +Pi {item.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#ffd700', fontWeight: 700 }}>Credited</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: '#121214', padding: '36px 20px', borderRadius: '18px', border: '1px solid #27272a', textAlign: 'center', marginTop: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 8px 0' }}>Log In to Access Your Referral Code</h2>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', maxWidth: '380px', margin: '0 auto 20px' }}>
              Sign up or log in to generate your personal invite link, start earning Pi 155.55 per friend, and manage your commissions.
            </p>
            <button
              className="btn primary"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '14px',
                fontWeight: 900,
                fontSize: '15px'
              }}
            >
              Log In / Register Now
            </button>
          </div>
        )}

      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
