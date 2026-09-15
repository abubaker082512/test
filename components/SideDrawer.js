import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'

export default function SideDrawer({ isOpen, onClose, balance = 0, onOpenAuth }) {
  const router = useRouter()
  const { user, logOut } = useAuth()

  if (!isOpen) return null

  const navItems = [
    { label: '🎰 Paddy Power Games', href: '/casino', icon: '🍀', badge: 'Active' },
    { label: '💳 Deposit Funds', href: '/wallet', icon: '⚡', badge: '+4%' },
    { label: '🏧 Request Payout', href: '/wallet', icon: '💰' },
    { label: '🎁 Promotions & VIP', href: '/offers', icon: '👑' },
    { label: '👥 Invite & Earn (Pi 155)', href: '/invite', icon: '🤝', badge: 'Hot' },
    { label: '💬 24/7 Live Support', href: '/support', icon: '🎧' },
    { label: '👤 VIP Profile', href: '/profile', icon: '⭐' },
    { label: '🛡️ Admin Console', href: '/admin', icon: '🔐' }
  ]

  const handleNav = (href) => {
    onClose()
    router.push(href)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      animation: 'fade-in 0.2s ease-out'
    }}>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer'
        }}
      />

      {/* Slide-in drawer container */}
      <div style={{
        position: 'relative',
        width: '85%',
        maxWidth: '320px',
        height: '100%',
        background: 'linear-gradient(180deg, #16072b 0%, #0c0317 100%)',
        borderRight: '1px solid var(--border)',
        boxShadow: '8px 0 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        overflowY: 'auto',
        animation: 'slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(25, 8, 46, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/logo.png" 
              alt="WinX Pro" 
              style={{ height: '42px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.4))' }} 
            />
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          {user ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(42, 15, 76, 0.9) 0%, rgba(18, 4, 36, 0.9) 100%)',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              padding: '14px',
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  👤
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800 }}>
                    👑 VIP Gold Member
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Available Balance</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)' }}>
                    Pi {parseFloat(balance).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => handleNav('/wallet')}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #ffaa00 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 900,
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Deposit +
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(42, 15, 76, 0.5)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                Join WinX Pro Casino
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px' }}>
                Sign up to claim your 100% deposit bonus & daily lucky spins!
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { onClose(); onOpenAuth() }}
                  className="btn"
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                >
                  Log In
                </button>
                <button
                  onClick={() => { onClose(); onOpenAuth() }}
                  className="btn primary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleNav(item.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'background 0.2s, transform 0.2s',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: item.badge === 'Hot' ? 'var(--danger)' : 'var(--accent)',
                  color: item.badge === 'Hot' ? '#fff' : '#000'
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        {user && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { logOut(); onClose() }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 0, 85, 0.1)',
                border: '1px solid var(--danger)',
                color: '#ff4466',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🚪 Log Out
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
