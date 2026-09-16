import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function UniversalReferralWidget() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const path = router.pathname || ''
  if (!mounted || path.startsWith('/play/') || path.startsWith('/admin') || path === '/invite' || path === '/referral' || path === '/signup' || path === '/register') {
    return <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
  }

  const handleClick = () => {
    if (!user) {
      setIsAuthOpen(true)
    } else {
      router.push('/invite')
    }
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '72px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {!minimized ? (
          <div
            onClick={handleClick}
            style={{
              background: user 
                ? 'linear-gradient(135deg, #18092a 0%, #3b0764 100%)' 
                : 'linear-gradient(135deg, #004d25 0%, #00e676 100%)',
              border: user ? '1px solid #ffd700' : '1px solid #00e676',
              borderRadius: '24px',
              padding: '6px 14px 6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 230, 118, 0.25)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span style={{ fontSize: '20px' }}>{user ? '💸' : '🎁'}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                {user ? 'Invite & Earn' : 'Sign Up Bonus'}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: user ? '#ffd700' : '#000', background: user ? 'rgba(0,0,0,0.4)' : '#00e676', padding: '1px 4px', borderRadius: '4px', width: 'fit-content' }}>
                {user ? 'Rs 600 Cash' : 'Free Rs 100'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setMinimized(true)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '0 0 0 4px'
              }}
              title="Minimize"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMinimized(false)}
            style={{
              background: '#18092a',
              border: '1px solid #00e676',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
            title="Open Referral & Bonus"
          >
            🎁
          </button>
        )}
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
