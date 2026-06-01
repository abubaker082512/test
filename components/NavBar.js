import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function NavBar() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <span style={{ color: 'var(--accent)' }}>Bet</span>PK
        </div>
        <div className="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#333', padding: '4px 12px', borderRadius: '16px', fontSize: '14px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₱</span> 0.00
              </div>
              <div style={{ fontSize: '24px' }}>👤</div>
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
