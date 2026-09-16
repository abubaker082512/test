import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import SideDrawer from './SideDrawer'

export default function NavBar() {
  const { user, logOut, isDemoMode, demoBalance, toggleDemoMode } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [balance, setBalance] = useState(0.0)
  const [showMenu, setShowMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch and subscribe to wallet balance
  const fetchBalance = async () => {
    if (!user) return
    try {
      const activeUid = user.id || user.uid || ''
      const activeEmail = user.email || ''
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()
      if (json.success && json.balance !== undefined) {
        setBalance(parseFloat(json.balance))
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (!user) {
      setBalance(0.0)
      return
    }

    fetchBalance()

    // Real-time polling every 5 seconds for instant synchronization
    const pollInterval = setInterval(() => {
      fetchBalance()
    }, 5000)

    // Custom client-side event for instant updates
    const handleWalletUpdate = () => {
      fetchBalance()
    }
    window.addEventListener('wallet-updated', handleWalletUpdate)

    return () => {
      clearInterval(pollInterval)
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
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
          <button 
            className="menu-toggle" 
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            ☰
          </button>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="WinX Pro" 
              style={{ 
                height: '48px', 
                width: 'auto', 
                maxHeight: '50px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))'
              }} 
            />
          </Link>
        </div>

        <div className="header-right">
          {/* Demo Mode Toggle Badge */}
          {isDemoMode ? (
            <div 
              onClick={() => toggleDemoMode(false)}
              style={{
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid #00e676',
                borderRadius: '20px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Click to switch to Real Account"
            >
              <span style={{ fontSize: '13px' }}>🎮</span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#00e676' }}>
                DEMO Pi {demoBalance.toFixed(2)}
              </span>
              <span style={{ fontSize: '9px', background: '#00e676', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                TRIAL
              </span>
            </div>
          ) : (
            /* Real Wallet Balance Display */
            <div className="wallet-display">
              <span className="wallet-flag">🌍</span>
              <span className="wallet-amount">
                Pi {user ? balance.toFixed(2) : '0.00'}
              </span>
              <button 
                className={`wallet-refresh ${refreshing ? 'coin-spin' : ''}`} 
                onClick={handleRefresh}
                title="Refresh Balance (Fiat)"
              >
                🔄
              </button>
            </div>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Deposit Button with Dropdown and Badge */}
              {!isDemoMode && (
                <div className="deposit-dropdown-container">
                  <Link href="/wallet" style={{ textDecoration: 'none' }}>
                    <button className="btn-deposit">
                      Deposit <span style={{ fontSize: '10px' }}>▼</span>
                      <span className="deposit-badge">+4%</span>
                    </button>
                  </Link>
                </div>
              )}

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
                    minWidth: '170px', 
                    zIndex: 100, 
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--muted)', borderBottom: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email || 'Player'}
                    </div>
                    <div 
                      onClick={() => { toggleDemoMode(!isDemoMode); setShowMenu(false) }}
                      className="menu-item-hover" 
                      style={{ padding: '10px 14px', cursor: 'pointer', color: '#00e676', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                    >
                      {isDemoMode ? '💰 Switch to Real Mode' : '🎮 Switch to Demo Mode'}
                    </div>
                    <Link href="/wallet" style={{ textDecoration: 'none' }}>
                      <div onClick={() => setShowMenu(false)} className="menu-item-hover" style={{ padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 Wallet / Deposit
                      </div>
                    </Link>
                    <Link href="/invite" style={{ textDecoration: 'none' }}>
                      <div onClick={() => setShowMenu(false)} className="menu-item-hover" style={{ padding: '10px 14px', cursor: 'pointer', color: '#00e676', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💸 Invite & Earn (Rs 600)
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
      <SideDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        balance={balance}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
    </>
  )
}
