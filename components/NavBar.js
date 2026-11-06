import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import SideDrawer from './SideDrawer'
import CurrencyFlag from './CurrencyFlag'
import InstallAppModal from './InstallAppModal'

export default function NavBar({ onOpenPromoModal }) {
  const { user, logOut, isDemoMode, demoBalance, toggleDemoMode } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [balance, setBalance] = useState(0.0)
  const [showMenu, setShowMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showAppBar, setShowAppBar] = useState(true)

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
    const pollInterval = setInterval(fetchBalance, 5000)
    const handleWalletUpdate = () => fetchBalance()
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
      {/* Top Neon-Lime App Download Strip (matching bbrssms1.com Screenshot 4) */}
      {showAppBar && (
        <div className="bbr-top-install-bar">
          <div className="bbr-install-left">
            <div className="bbr-install-app-icon">
              <img src="/logo.png" alt="WinX" />
            </div>
            <div className="bbr-install-copy">
              Download the app to win <strong>PKR 8888</strong>
            </div>
            <span className="bbr-install-gift" onClick={() => onOpenPromoModal && onOpenPromoModal()}>🎁</span>
          </div>
          <div className="bbr-install-right">
            <button
              type="button"
              className="bbr-install-btn"
              onClick={() => setIsInstallModalOpen(true)}
            >
              ⬇ Install
            </button>
            <button
              type="button"
              className="bbr-install-close"
              onClick={() => setShowAppBar(false)}
              aria-label="Close install banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="logo-container">
          <button 
            className="menu-toggle" 
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            style={{ position: 'relative' }}
          >
            ☰
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ff2a55',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '900',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img 
              src="/logo.png" 
              alt="WinX Pro" 
              style={{ 
                height: '38px', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(109, 255, 56, 0.35))'
              }} 
            />
          </Link>
        </div>

        <div className="header-right">
          {onOpenPromoModal && (
            <button
              type="button"
              onClick={onOpenPromoModal}
              title="Promotions & QR Tutorial"
              style={{
                background: 'rgba(109, 255, 56, 0.14)',
                border: '1px solid rgba(109, 255, 56, 0.45)',
                borderRadius: '10px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              🎁
            </button>
          )}

          {user ? (
            <>
              {isDemoMode ? (
                <div 
                  onClick={() => toggleDemoMode(false)}
                  style={{
                    background: 'rgba(109, 255, 56, 0.15)',
                    border: '1px solid #6dff38',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="Click to switch to Real Account"
                >
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#6dff38' }}>
                    DEMO Rs {demoBalance.toFixed(0)}
                  </span>
                </div>
              ) : (
                <div className="wallet-display">
                  <CurrencyFlag size={16} />
                  <span className="wallet-amount">
                    Rs {balance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button 
                    className={`wallet-refresh ${refreshing ? 'coin-spin' : ''}`} 
                    onClick={handleRefresh}
                    title="Refresh Balance"
                  >
                    🔄
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isDemoMode && (
                  <Link href="/wallet" style={{ textDecoration: 'none' }}>
                    <button className="btn-deposit" style={{ padding: '6px 11px', fontSize: '11px' }}>
                      Deposit
                      <span className="deposit-badge">+35%</span>
                    </button>
                  </Link>
                )}

                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setShowMenu(!showMenu)} 
                    style={{ 
                      fontSize: '18px', 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      background: 'rgba(109, 255, 56, 0.12)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(109, 255, 56, 0.35)'
                    }}
                  >
                    👤
                  </div>
                  {showMenu && (
                    <div style={{ 
                      position: 'absolute', 
                      right: 0, 
                      top: '38px', 
                      background: '#132419', 
                      border: '1px solid rgba(109, 255, 56, 0.3)', 
                      borderRadius: '12px', 
                      minWidth: '175px', 
                      zIndex: 150, 
                      overflow: 'hidden',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.75)'
                    }}>
                      <div style={{ padding: '10px 14px', fontSize: '11px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email || 'Player'}
                      </div>
                      <div 
                        onClick={() => { toggleDemoMode(!isDemoMode); setShowMenu(false) }}
                        style={{ padding: '10px 14px', cursor: 'pointer', color: '#6dff38', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {isDemoMode ? '💰 Switch to Real Mode' : '🎮 Switch to Demo Mode'}
                      </div>
                      <Link href="/wallet" style={{ textDecoration: 'none' }}>
                        <div onClick={() => setShowMenu(false)} style={{ padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}>
                          💳 Wallet / Deposit
                        </div>
                      </Link>
                      <Link href="/invite" style={{ textDecoration: 'none' }}>
                        <div onClick={() => setShowMenu(false)} style={{ padding: '10px 14px', cursor: 'pointer', color: '#6dff38', fontSize: '13px' }}>
                          💸 Invite & Earn (Rs 2,800)
                        </div>
                      </Link>
                      <Link href="/profile" style={{ textDecoration: 'none' }}>
                        <div onClick={() => setShowMenu(false)} style={{ padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}>
                          👤 VIP Profile
                        </div>
                      </Link>
                      <div 
                        onClick={() => { logOut(); setShowMenu(false) }} 
                        style={{ padding: '10px 14px', cursor: 'pointer', color: '#ff4d6d', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        🚪 Log Out
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  background: 'rgba(18, 36, 26, 0.9)',
                  color: '#6dff38',
                  border: '1px solid #6dff38',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Log in
              </button>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  background: 'linear-gradient(180deg, #88ff4d 0%, #52e534 100%)',
                  color: '#07140b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(109, 255, 56, 0.35)'
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
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
