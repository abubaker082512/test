import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import Link from 'next/link'

export default function Profile() {
  const { user, logOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [balance, setBalance] = useState(0.00)

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

  const handleLogout = async () => {
    await logOut()
  }

  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px 80px', maxWidth: '600px', margin: '0 auto' }}>
        
        {user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--accent) 0%, #d4991c 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px solid #fff', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                  {user.email ? user.email.split('@')[0] : (user.displayName || 'Player')}
                </div>
                <div style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  👑 VIP Level {loadingStats ? '...' : stats.vipLevel}
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #111 100%)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--accent)' }}>
                Pi {balance.toFixed(2)}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Link href="/wallet" style={{ flex: 1, textDecoration: 'none' }}>
                  <button className="btn primary" style={{ width: '100%', padding: '12px' }}>💳 Deposit</button>
                </Link>
                <Link href="/wallet" style={{ flex: 1, textDecoration: 'none' }}>
                  <button className="btn" style={{ width: '100%', padding: '12px' }}>🏧 Withdraw</button>
                </Link>
              </div>
            </div>

            <Link href="/invite" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #18092a 0%, #3b0764 100%)',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 230, 118, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '32px' }}>💸</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>Referral & Agent Program</div>
                    <div style={{ fontSize: '12px', color: '#00e676', fontWeight: 700, marginTop: '2px' }}>
                      Earn Pi 155.55 + 5% per friend • {stats.referralCount} referred
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '20px', color: '#ffd700' }}>➔</span>
              </div>
            </Link>

            <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>📊 Gaming Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total Wagered</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  Pi {loadingStats ? '...' : stats.wagerVolume.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total Payouts</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88', marginTop: '4px' }}>
                  Pi {loadingStats ? '...' : stats.payoutVolume.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Referral Rewards</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700', marginTop: '4px' }}>
                  Pi {loadingStats ? '...' : stats.referralEarnings.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Bets Placed</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {loadingStats ? '...' : stats.betCount}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>🛡️ Account History</h2>
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Link href="/wallet" style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} className="menu-item-hover">
                  <span>📋 Transaction Records</span>
                  <span style={{ color: 'var(--muted)' }}>{stats.depositCount + stats.withdrawCount} items →</span>
                </div>
              </Link>
              <Link href="/invite" style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} className="menu-item-hover">
                  <span>👥 Referral Friends List</span>
                  <span style={{ color: '#00e676', fontWeight: 'bold' }}>{stats.referralCount} friends →</span>
                </div>
              </Link>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>🎮 Bet Count</span>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{stats.betCount} bets</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✉️ Registered Email</span>
                <span style={{ color: 'var(--muted)' }}>{user.email || 'N/A'}</span>
              </div>
            </div>
            
            <button 
              className="btn" 
              onClick={handleLogout}
              style={{ width: '100%', marginTop: '24px', borderColor: '#ff4444', color: '#ff4444', background: 'rgba(255, 68, 68, 0.05)', padding: '14px', fontSize: '15px' }}
            >
              🚪 Log Out Account
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ marginTop: 0 }}>Login Required</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You must log in to view your profile statistics, VIP status, and bet history.</p>
            <button className="btn primary" onClick={() => setIsAuthModalOpen(true)} style={{ width: '100%', padding: '14px' }}>Log In / Sign Up</button>
          </div>
        )}

      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
