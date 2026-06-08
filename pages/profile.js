import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'
import Link from 'next/link'

export default function Profile() {
  const { user, logOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [balance, setBalance] = useState(0.00)

  // Player Stats State
  const [stats, setStats] = useState({
    wagerVolume: 0,
    betCount: 0,
    vipLevel: 1,
    payoutVolume: 0,
    depositCount: 0,
    withdrawCount: 0,
    regDate: '...'
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchProfileData = async () => {
    if (!user) {
      setLoadingStats(false)
      return
    }

    try {
      // 1. Fetch wallet balance
      const { data: wallet } = await supabase
        .from('wallets').select('balance').eq('user_id', user.id).single()
      if (wallet) setBalance(parseFloat(wallet.balance))

      // 2. Fetch completed transactions to compile stats
      const { data: txs } = await supabase
        .from('transactions').select('*').eq('user_id', user.id)

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

        // VIP curve: ₱0-100: VIP 1, ₱100-1000: VIP 2, ₱1000-5000: VIP 3, ₱5000-20000: VIP 4, ₱20000+: VIP 5
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
          regDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
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
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {user ? (
          <div>
            {/* Header User Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--accent) 0%, #d4991c 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px solid #fff', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                  {user.email.split('@')[0]}
                </div>
                <div style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  👑 VIP Level {loadingStats ? '...' : stats.vipLevel}
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #111 100%)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--accent)' }}>
                ₱{balance.toFixed(2)}
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

            {/* Performance Statistics Grid */}
            <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>📊 Gaming Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total Wagered</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  ₱{loadingStats ? '...' : stats.wagerVolume.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total Payouts</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88', marginTop: '4px' }}>
                  ₱{loadingStats ? '...' : stats.payoutVolume.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Bets Placed</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {loadingStats ? '...' : stats.betCount}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Member Since</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '6px' }}>
                  {loadingStats ? '...' : stats.regDate}
                </div>
              </div>
            </div>

            {/* Action Menu List */}
            <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>🛡️ Account History</h2>
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Link href="/wallet" style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} className="menu-item-hover">
                  <span>📋 Transaction Records</span>
                  <span style={{ color: 'var(--muted)' }}>{stats.depositCount + stats.withdrawCount} items →</span>
                </div>
              </Link>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>🎮 Bet Count</span>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{stats.betCount} bets</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✉️ Registered Email</span>
                <span style={{ color: 'var(--muted)' }}>{user.email}</span>
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
