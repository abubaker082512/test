import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

export default function Profile() {
  const router = useRouter()
  const { user, logOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [balance, setBalance] = useState(0.00)
  const [copiedField, setCopiedField] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState({
    wagerVolume: 0,
    betCount: 0,
    vipLevel: 1,
    payoutVolume: 0,
    depositCount: 0,
    withdrawCount: 0,
    referralEarnings: 0,
    referralCount: 0,
    regDate: '...'
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchProfileData = async () => {
    if (!user) {
      setLoadingStats(false)
      return
    }

    try {
      const activeUid = user.id || user.uid || ''
      const activeEmail = user.email || ''

      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()

      let txs = []
      if (json.success) {
        if (json.wallet) setBalance(parseFloat(json.wallet.balance) || 0)
        if (Array.isArray(json.transactions)) txs = json.transactions
      }

      let refCount = 0
      let refEarnings = 0
      try {
        const refRes = await fetch(`/api/referrals/stats?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
        const refData = await refRes.json()
        if (refData.success) {
          refCount = refData.totalInvited || 0
          refEarnings = refData.totalEarnings || 0
        }
      } catch (e) {}

      if (txs) {
        let wager = 0
        let betCnt = 0
        let payout = 0
        let depCnt = 0
        let witCnt = 0

        txs.forEach(t => {
          const amt = parseFloat(t.amount)
          if (t.type === 'bet' && t.status === 'completed') {
            wager += amt
            betCnt++
          } else if (t.type === 'payout' && t.status === 'completed') {
            payout += amt
          } else if (t.type === 'deposit' && t.status === 'completed') {
            depCnt++
          } else if (t.type === 'withdraw' && t.status === 'completed') {
            witCnt++
          }
        })

        let level = 1
        if (wager >= 20000) level = 5
        else if (wager >= 5000) level = 4
        else if (wager >= 1000) level = 3
        else if (wager >= 100) level = 2

        setStats({
          wagerVolume: wager,
          betCount: betCnt,
          vipLevel: level,
          payoutVolume: payout,
          depositCount: depCnt,
          withdrawCount: witCnt,
          referralEarnings: refEarnings,
          referralCount: refCount,
          regDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'
        })
      }
    } catch (err) {
      console.error('Failed to load profile stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [user])

  const copyToClipboard = (text, field) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    }
  }

  const handleRefreshBalance = async () => {
    setRefreshing(true)
    await fetchProfileData()
    setTimeout(() => setRefreshing(false), 800)
  }

  // Derive phone/ID for display
  const userPhone = user?.phone || (user?.email ? user.email.replace(/@.*/, '') : '03112235935')
  const userIdNumber = user?.id ? user.id.replace(/\D/g, '').slice(0, 9) || '229617824' : '229617824'

  // Quick Function Items matching Screenshot 1 (10Win style)
  const quickFunctions = [
    { 
      name: 'Interest', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h1l1-3c0-2-1-4-3-4z" />
          <circle cx="16" cy="11" r="1" fill="#00E65B" />
        </svg>
      ),
      action: () => router.push('/offers')
    },
    { 
      name: 'Fund', 
      badge: '50%',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v12M9 9h6M9 15h6" />
        </svg>
      ),
      action: () => router.push('/wallet')
    },
    { 
      name: 'My Records', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="12" y2="17" />
        </svg>
      ),
      action: () => router.push('/wallet')
    },
    { 
      name: 'Manage withdrawal', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      action: () => router.push('/wallet')
    },
    { 
      name: 'VIP', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <circle cx="12" cy="19" r="2" fill="#00E65B" />
        </svg>
      ),
      action: () => router.push('/offers')
    },
    { 
      name: 'Invite', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      action: () => router.push('/invite')
    },
    { 
      name: 'Profile', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      action: () => {}
    },
    { 
      name: 'Security Center', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      action: () => alert('Security Center: 2-Factor Authentication & Phone Binding active.')
    },
    { 
      name: 'Find us', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
      action: () => window.open('https://t.me/winxpro_official', '_blank')
    },
    { 
      name: 'Language', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      action: () => alert('Language set to: English (Pakistan)')
    },
    { 
      name: 'FAQ', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      action: () => router.push('/support')
    },
    { 
      name: 'Reward Feedback', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      action: () => alert('Feedback submitted! Earn rewards on approved suggestions.')
    },
    { 
      name: 'Download App', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
          <path d="M12 6v6m3-3-3 3-3-3" />
        </svg>
      ),
      action: () => window.open('/android_builds/WinXPro-release.apk', '_blank')
    },
    { 
      name: 'Night mode', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
      action: () => alert('Obsidian Dark Mode is always active.')
    },
    { 
      name: 'About WinXPro', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E65B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      action: () => alert('WinX Pro Official v1.0.2 - Curacao eGaming Authorized License 8048/JAZ')
    },
    { 
      name: 'Log Out', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      action: () => logOut()
    }
  ]

  return (
    <div className="app">
      {/* Sleek Top Header matching Screenshot 1 */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(11, 14, 20, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ‹
        </button>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>Profile Center</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/support')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>
            🎧
          </button>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => alert('You have 2 notifications')}>
            <span style={{ fontSize: '18px', color: '#94A3B8' }}>💬</span>
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              background: '#FF3366',
              color: '#fff',
              fontSize: '8.5px',
              fontWeight: 900,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 14px 90px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* User Hero Banner (Screenshot 1) */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar with edit pencil */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B9D 0%, #7928CA 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
              }}>
                👩‍🎤
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#00E65B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#000',
                fontWeight: 900,
                border: '1.5px solid #0B0E14'
              }}>
                ✎
              </div>
            </div>

            {/* User ID & Phone Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                  {user ? userPhone : '03112235935'}
                </span>
                <button 
                  onClick={() => copyToClipboard(userPhone, 'phone')}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                  title="Copy Phone"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>
                  ID: {userIdNumber}
                </span>
                <button 
                  onClick={() => copyToClipboard(userIdNumber, 'id')}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                  title="Copy ID"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                {copiedField && (
                  <span style={{ fontSize: '9px', color: '#00E65B', fontWeight: 800 }}>Copied!</span>
                )}
              </div>
            </div>
          </div>

          {/* Balance Bar with 3D Deposit & Withdraw Buttons (Screenshot 1) */}
          <div style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Balance Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🇵🇰</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '0.2px' }}>
                  {balance.toFixed(2)}
                </span>
                <button 
                  onClick={handleRefreshBalance}
                  style={{ background: 'none', border: 'none', color: '#00E65B', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.4s' }}
                  className={refreshing ? 'coin-spin' : ''}
                >
                  🔄
                </button>
              </div>
            </div>

            {/* 3D Action Cards */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/wallet" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 0, 0, 0.15) 100%), rgba(20, 26, 36, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '9px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 4px 14px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '16px' }}>👛</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Deposit</span>
                </div>
              </Link>

              <Link href="/wallet" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 0, 0, 0.15) 100%), rgba(20, 26, 36, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '9px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 14px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '16px' }}>💳</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>Withdraw</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Newplayer Task Section (Screenshot 1) */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Newplayer</span>
            <span onClick={() => router.push('/offers')} style={{ fontSize: '11px', fontWeight: 800, color: '#00E65B', cursor: 'pointer' }}>
              View All ›
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Task 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(0, 230, 91, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  📋
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Sign up an account</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FFB800', marginTop: '2px' }}>
                    Rs 20.00-388.00
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!user) setIsAuthModalOpen(true)
                  else alert('Welcome reward already claimed into balance!')
                }}
                className="glass-btn-emerald"
                style={{
                  padding: '7px 18px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Claim
              </button>
            </div>

            {/* Task 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 184, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  📱
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Login to the APP(First deposit)
                    <span style={{ background: '#00E65B', color: '#000', fontSize: '9px', fontWeight: 900, padding: '1px 4px', borderRadius: '4px' }}>
                      80-888
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FFB800', marginTop: '2px' }}>
                    Rs 80.00-888.00
                  </div>
                </div>
              </div>

              <button 
                onClick={() => router.push('/wallet')}
                className="glass-btn-emerald"
                style={{
                  padding: '7px 20px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Quick Function 4x4 Grid (Screenshot 1) */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '14px 16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
            Quick Function
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 6px' }}>
            {quickFunctions.map((item, idx) => (
              <div 
                key={idx}
                onClick={item.action}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '6px 2px',
                  borderRadius: '12px',
                  transition: 'transform 0.2s'
                }}
                className="hover:-translate-y-0.5 active:scale-95"
              >
                {item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '12%',
                    background: '#00E65B',
                    color: '#000',
                    fontSize: '8px',
                    fontWeight: 900,
                    padding: '1px 4px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0, 230, 91, 0.4)'
                  }}>
                    {item.badge}
                  </span>
                )}
                
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </div>

                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  maxWidth: '75px'
                }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite & Agent Quick Card */}
        <Link href="/invite" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{
            borderRadius: '18px',
            padding: '14px 16px',
            border: '1px solid rgba(0, 230, 91, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🎁</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Invite Friends & Claim Rs 600</div>
                <div style={{ fontSize: '10.5px', color: '#00E65B', fontWeight: 700, marginTop: '2px' }}>
                  Commission rewards up to 3.0% daily
                </div>
              </div>
            </div>
            <span style={{ color: '#00E65B', fontSize: '16px', fontWeight: 900 }}>›</span>
          </div>
        </Link>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
