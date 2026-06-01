import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { supabase } from '../utils/supabase'

export default function NavBar() {
  const { user, logOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [balance, setBalance] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  // Fetch and subscribe to wallet balance
  useEffect(() => {
    if (!user) { setBalance(null); return }

    const fetchBalance = async () => {
      const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
      if (data) setBalance(data.balance)
    }
    fetchBalance()

    // Real-time wallet updates
    const channel = supabase.channel('navbar-wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, (payload) => {
        setBalance(payload.new.balance)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  return (
    <>
      <nav className="navbar">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="logo">
            <span style={{ color: 'var(--accent)' }}>Bet</span>PK
          </div>
        </Link>

        <div className="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Live Wallet Balance */}
              <Link href="/wallet" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid #333', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💰</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                    ₱{balance !== null ? parseFloat(balance).toFixed(2) : '...'}
                  </span>
                </div>
              </Link>

              {/* Deposit button */}
              <Link href="/wallet" style={{ textDecoration: 'none' }}>
                <button className="btn primary" style={{ padding: '6px 14px', fontSize: '13px' }}>+ Deposit</button>
              </Link>

              {/* Profile/Logout */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => setShowMenu(!showMenu)} style={{ fontSize: '24px', cursor: 'pointer', userSelect: 'none' }}>👤</div>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '36px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', minWidth: '140px', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', fontSize: '12px', color: '#888', borderBottom: '1px solid #222' }}>{user.email}</div>
                    <Link href="/wallet" style={{ textDecoration: 'none' }}>
                      <div onClick={() => setShowMenu(false)} style={{ padding: '10px 16px', cursor: 'pointer', color: '#fff' }}>💳 Wallet</div>
                    </Link>
                    <div onClick={() => { logOut(); setShowMenu(false) }} style={{ padding: '10px 16px', cursor: 'pointer', color: '#ff4444' }}>🚪 Log Out</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button className="btn" onClick={() => setIsAuthModalOpen(true)}>Log In</button>
              <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
