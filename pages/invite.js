import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

export default function InvitePage() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    totalEarnings: 0,
    bonusPerReferral: 100.00,
    commissionRatePct: 5.0,
    referrals: []
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const emailPrefix = user?.email 
    ? user.email.split('@')[0] 
    : (user?.id ? user.id.substring(0, 10) : 'WINX_VIP')

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
          bonusPerReferral: 100.00,
          commissionRatePct: 5.0,
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
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(emailPrefix)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'WinX Pro - Play & Win Real Cash in Pakistan',
        text: `🎁 Join WinX Pro using my referral code ${emailPrefix} to get a free Rs 100 Signup Bonus + daily VIP cash rewards!`,
        url: referralLink
      }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🎁 Join WinX Pro Pakistan and claim Rs 100 FREE Welcome Bonus!\nUse my invite code: ${emailPrefix}\n👉 Register here: ${referralLink}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const shareTelegram = () => {
    const text = encodeURIComponent(`🎁 Join WinX Pro Pakistan and claim Rs 100 FREE Welcome Bonus! Use my invite code: ${emailPrefix}`)
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')
  }

  return (
    <div className="app bbr-theme-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070a14' }}>
      <Head>
        <title>VIP Referral Center &amp; Agent Rewards | WinX Pro</title>
        <meta name="description" content="Earn Rs 100 cash + 5% lifetime betting commissions for every friend you refer to WinX Pro Pakistan." />
      </Head>

      <NavBar />
      
      <main style={{ flex: 1, padding: '16px 14px 80px', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Luxury Hero VIP Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0e1e14 0%, #173622 60%, #0a140d 100%)',
          borderRadius: '20px',
          padding: '22px 18px',
          border: '1.5px solid #6dff38',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(109, 255, 56, 0.2)',
          marginBottom: '20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>👑</div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(109, 255, 56, 0.15)',
            border: '1px solid #6dff38',
            color: '#6dff38',
            padding: '3px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            WINX VIP AGENT PROGRAM
          </div>
          <h1 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '22px', fontWeight: 900, lineHeight: 1.25 }}>
            Invite Friends &amp; Claim <span style={{ color: '#6dff38' }}>Rs 600 Cash</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '12.5px', lineHeight: '1.5', margin: '0 auto 14px', maxWidth: '400px' }}>
            Earn instant cash bonuses credited directly to your PKR wallet, plus <strong style={{ color: '#ffd54f' }}>5.0% Lifetime Commission</strong> on all referred bets &amp; deposits!
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(109, 255, 56, 0.15)', border: '1px solid rgba(109, 255, 56, 0.4)', color: '#6dff38', padding: '4px 10px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800 }}>
              ✓ Instant Real Payouts
            </span>
            <span style={{ background: 'rgba(255, 213, 79, 0.15)', border: '1px solid rgba(255, 213, 79, 0.4)', color: '#ffd54f', padding: '4px 10px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800 }}>
              ✓ Friend Gets Rs 100 Free
            </span>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800 }}>
              ✓ Unlimited Referrals
            </span>
          </div>
        </div>

        {user ? (
          <div>
            {/* Classy Referral Code Card */}
            <div style={{
              background: '#121c15',
              padding: '20px 18px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '18px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Your Unique Invite Code
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedCode ? '#6dff38' : '#38bdf8',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {copiedCode ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>

              <div style={{
                background: '#09120c',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '1px',
                color: '#ffffff',
                border: '1px dashed rgba(109, 255, 56, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ wordBreak: 'break-all' }}>{emailPrefix}</span>
                <span style={{ fontSize: '11px', background: '#6dff38', color: '#081a0b', padding: '3px 8px', borderRadius: '6px', fontWeight: 900 }}>
                  ACTIVE
                </span>
              </div>

              {/* Shareable Link Box */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', fontWeight: 700 }}>
                  Shareable Invitation Link
                </div>
                <div style={{
                  background: '#09120c',
                  padding: '8px 10px 8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '11.5px', color: '#6dff38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralLink}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)',
                      color: '#081a0b',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {copiedLink ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Quick Share Grid */}
              <div style={{ marginTop: '18px' }}>
                <div style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center', letterSpacing: '0.4px' }}>
                  One-Click Quick Share
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    style={{
                      background: '#128C7E',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 4px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(18, 140, 126, 0.3)'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={shareTelegram}
                    style={{
                      background: '#0088cc',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 4px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>✈️</span>
                    <span>Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={shareFacebook}
                    style={{
                      background: '#1877F2',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 4px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📘</span>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '10px 4px',
                      borderRadius: '10px',
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

            {/* Metrics Dual Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: '#121c15', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 14px', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>FRIENDS REFERRED</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#6dff38', marginTop: '4px' }}>
                  {loadingStats ? '...' : referralStats.totalInvited}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Total Registered</div>
              </div>

              <div style={{ background: '#121c15', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 14px', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL COMMISSION</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffd54f', marginTop: '4px', fontFamily: 'monospace' }}>
                  Rs {loadingStats ? '0.00' : referralStats.totalEarnings.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Auto-Credited to Wallet</div>
              </div>
            </div>

            {/* VIP Commission Tiers Card */}
            <div style={{ background: '#121c15', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👑</span>
                <span>Referral Reward &amp; Commission Tiers</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#09120c', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Level 1: Direct Friends</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Instant signup reward + betting rebate</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#6dff38' }}>+Rs 100.00</div>
                    <div style={{ fontSize: '10px', color: '#ffd54f', fontWeight: 700 }}>+ 5.0% Rebate</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#09120c', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Level 2: Team Sub-Friends</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Friends invited by your direct referrals</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#38bdf8' }}>+Rs 50.00</div>
                    <div style={{ fontSize: '10px', color: '#ffd54f', fontWeight: 700 }}>+ 2.0% Rebate</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#09120c', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Level 3: Community Friends</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Deep network player turnover rebate</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#a78bfa' }}>+Rs 25.00</div>
                    <div style={{ fontSize: '10px', color: '#ffd54f', fontWeight: 700 }}>+ 1.0% Rebate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#121c15', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '38px', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '16px' }}>Login to Access Your Referral Hub</h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 auto 18px', maxWidth: '320px' }}>
              Sign up or log in to generate your unique invite link, earn Rs 100 per friend, and withdraw live commissions.
            </p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)',
                color: '#081a0b',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Log In / Register
            </button>
          </div>
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
