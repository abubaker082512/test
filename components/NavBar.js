import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { supabase } from '../utils/supabase'

export default function NavBar() {
  const { user, logOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [balance, setBalance] = useState(0.0)
  const [showMenu, setShowMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch and subscribe to wallet balance
  const fetchBalance = async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    if (data) setBalance(parseFloat(data.balance))
  }

  useEffect(() => {
    if (!user) {
      setBalance(0.0)
      return
    }

    fetchBalance()

    // Real-time wallet updates
    const channel = supabase.channel('navbar-wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, (payload) => {
        setBalance(parseFloat(payload.new.balance))
      })
      .subscribe()

    // Custom client-side event for instant updates without websocket dependency
    const handleWalletUpdate = () => {
      fetchBalance()
    }
    window.addEventListener('wallet-updated', handleWalletUpdate)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('wallet-updated', handleWalletUpdate)
    }
  }, [user])

  const handleRefresh = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    setRefreshing(true)
    await fetchBalance()
    setTimeout(() => setRefreshing(false), 800) // Spin animation duration
  }

  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
          <button className="menu-toggle" onClick={() => alert("Menu Drawer: VIP Club, Promotions, Referrals, Live Chat, and Sportsbook catalogs.")}>
            ☰
          </button>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="betpk-logo">BETPK</div>
          </Link>
        </div>

        <div className="header-right">
          {/* Wallet Balance Display with Flag and Refresh */}
          <div className="wallet-display">
            <span className="wallet-flag">🇵🇭</span>
            <span className="wallet-amount">
              {user ? balance.toFixed(2) : '0.00'}
            </span>
            <button 
              className={`wallet-refresh ${refreshing ? 'coin-spin' : ''}`} 
              onClick={handleRefresh}
              title="Refresh Balance"
            >
              🔄
            </button>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Deposit Button with Dropdown and Badge */}
              <div className="deposit-dropdown-container">
                <Link href="/wallet" style={{ textDecoration: 'none' }}>
                  <button className="btn-deposit">
                    Deposit <span style={{ fontSize: '10px' }}>▼</span>
                    <span className="deposit-badge">+4%</span>
                  </button>
                </Link>
              </div>

              {/* User Menu Dropdown */}
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowMenu(!showMenu)} 
                  style={{ 
                    fontSize: '22px', 
                    cursor: 'pointer', 
                    userSelect: 'none', 
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)'
                  }}
                >
                  👤
                </div>
                {showMenu && (
                  <div style={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: '38px', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px', 
                    minWidth: '160px', 
                    zIndex: 100, 
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--muted)', borderBottom: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                    <Link href="/wallet" style={{ textDecoration: 'none' }}>
                      <div onClick={() => setShowMenu(false)} className="menu-item-hover" style={{ padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 Wallet / Deposit
                      </div>
                    </Link>
                    <Link href="/profile" style={{ textDecoration: 'none' }}>
                      <div onClick={() => setShowMenu(false)} className="menu-item-hover" style={{ padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        👤 VIP Profile
                      </div>
                    </Link>
                    <div 
                      onClick={() => { logOut(); setShowMenu(false) }} 
                      className="menu-item-hover"
                      style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--danger)', fontSize: '13px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      🚪 Log Out
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setIsAuthModalOpen(true)}>Log In</button>
              <button className="btn primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setIsAuthModalOpen(true)}>Sign Up</button>
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
