import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import SEOMeta from '../components/SEOMeta'

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
      <SEOMeta
        title="WinX Pro Referral Program & Agent Rewards | Earn Daily Cash Pakistan"
        description="Earn Rs 100 instant cash bonus + up to 5% lifetime commissions for every active player you refer to WinX Pro. Instant daily withdrawal to Easypaisa & JazzCash."
        canonicalUrl="https://winxpro.com.pk/invite"
        keywords="WinX Pro invite code, referral bonus Pakistan, earn money online Pakistan, casino agent program Pakistan, affiliate gaming Pakistan"
      />

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
              {/* Unique Invite Code Box */}
              <div style={{
                background: 'linear-gradient(135deg, #09140d 0%, #102116 100%)',
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1.5px solid rgba(109, 255, 56, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ffd54f', fontSize: '12px' }}>👑</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.6px' }}>
                      VIP Referral Code
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', background: 'rgba(109, 255, 56, 0.15)', border: '1px solid #6dff38', color: '#6dff38', padding: '2px 8px', borderRadius: '12px', fontWeight: 900 }}>
                    ● ACTIVE
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: '#060d09',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '1px',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {emailPrefix}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      background: copiedCode ? '#6dff38' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: copiedCode ? '#061309' : '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedCode ? '✓ Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.3px' }}>
                  Your Official Invite URL
                </div>
                <div style={{
                  background: '#09120c',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '11.5px', color: '#6dff38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {referralLink}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: copiedLink ? '#38bdf8' : 'linear-gradient(135deg, #6dff38 0%, #3ebd1b 100%)',
                      color: '#081a0b',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(109, 255, 56, 0.3)'
                    }}
                  >
                    {copiedLink ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Classy One-Click Quick Share Grid */}
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
                  <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Instant Share &amp; Earn
                  </span>
                  <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {/* WhatsApp VIP Card */}
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    style={{
                      background: 'linear-gradient(135deg, #1f4333 0%, #12281e 100%)',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4), 0 0 16px rgba(37, 211, 102, 0.15)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#25d366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.21-.555-1.936-.803-3.175-2.775-3.27-2.902-.095-.128-.778-1.035-.778-1.975 0-.94.492-1.402.667-1.593.175-.19.38-.238.508-.238.127 0 .254.002.365.007.119.006.277-.045.433.329.16.386.548 1.336.595 1.433.048.096.08.209.016.335-.064.126-.096.205-.19.317-.095.11-.2.247-.286.332-.096.096-.196.2-.084.393.111.192.494.815 1.06 1.319.73.651 1.344.853 1.536.949.19.095.302.079.413-.048.111-.127.476-.554.603-.745.127-.19.254-.158.428-.095.175.063 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>WhatsApp</div>
                      <div style={{ fontSize: '10px', color: '#25d366', fontWeight: 700 }}>Direct Message</div>
                    </div>
                  </button>

                  {/* Telegram VIP Card */}
                  <button
                    type="button"
                    onClick={shareTelegram}
                    style={{
                      background: 'linear-gradient(135deg, #17374a 0%, #0d212e 100%)',
                      border: '1px solid rgba(0, 136, 204, 0.4)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 136, 204, 0.15)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#0088cc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>Telegram</div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>Channels &amp; Groups</div>
                    </div>
                  </button>

                  {/* Facebook VIP Card */}
                  <button
                    type="button"
                    onClick={shareFacebook}
                    style={{
                      background: 'linear-gradient(135deg, #182b4a 0%, #0d1729 100%)',
                      border: '1px solid rgba(24, 119, 242, 0.4)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4), 0 0 16px rgba(24, 119, 242, 0.15)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#1877f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>Facebook</div>
                      <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 700 }}>Feed &amp; Story</div>
                    </div>
                  </button>

                  {/* Share All Card */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    style={{
                      background: 'linear-gradient(135deg, #242c22 0%, #151a14 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dff38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>More Apps</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>System Share</div>
                    </div>
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
