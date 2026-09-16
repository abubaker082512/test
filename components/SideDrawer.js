import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'

export default function SideDrawer({ isOpen, onClose, balance = 0, onOpenAuth }) {
  const router = useRouter()
  const { user, logOut, isDemoMode, demoBalance, toggleDemoMode } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const [isNightMode, setIsNightMode] = useState(true)

  if (!isOpen) return null

  const handleNav = (href) => {
    onClose()
    if (href) router.push(href)
  }

  const handleShare = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user?.email || ''}` : 'https://www.winxpro.com.pk'
    if (navigator.share) {
      navigator.share({
        title: 'WinX Pro - Pakistan\'s #1 Casino & Sports Gaming',
        text: 'Join WinX Pro and claim Rs 100 welcome bonus + Rs 600 referral reward!',
        url: link
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadApp = () => {
    onClose()
    router.push('/support#download')
  }

  const gameCategories = [
    { id: 'hot', name: 'Hot', icon: '🔥', href: '/' },
    { id: 'slot', name: 'Slot', icon: '🎰', href: '/casino?tab=slots' },
    { id: 'redeem', name: 'Redeem bonus', icon: '🎁', href: '/offers' },
    { id: 'mini', name: 'Mini Games', icon: '💠', href: '/?tab=mini' },
    { id: 'cards', name: 'Cards', icon: '🃏', href: '/?tab=cards' },
    { id: 'fishing', name: 'Fishing', icon: '🦈', href: '/?tab=fishing' },
    { id: 'live', name: 'Live', icon: '💃', href: '/casino?tab=live' },
    { id: 'sports', name: 'Sports', icon: '⚽', href: '/sports' },
    { id: 'demo', name: 'Demo (10k)', icon: '🎮', action: () => { toggleDemoMode(true); onClose() } },
    { id: 'recent', name: 'Recent', icon: '🕒', href: '/?tab=recent' },
    { id: 'favorites', name: 'Favorites', icon: '⭐', href: '/?tab=favorites' }
  ]

  const offerCenter = [
    { title: 'Event', sub: 'Lucky Wheel', icon: '🎡', bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', href: '/offers' },
    { title: 'Mission', sub: 'Daily Tasks', icon: '📅', bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', href: '/offers' },
    { title: 'Rebate', sub: 'Instant Cash', icon: '🪙', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', href: '/offers' },
    { title: 'Interest', sub: 'Piggy Bank', icon: '🐷', bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', href: '/offers' },
    { title: 'VIP', sub: 'Gold Crown', icon: '👑', bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', href: '/profile' },
    { title: 'Fund 50%', sub: 'Deposit Boost', icon: '👛', bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', href: '/wallet' },
    { title: 'Unclaimed', sub: 'Free Gifts', icon: '🎁', bg: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', href: '/offers' },
    { title: 'History', sub: 'Transactions', icon: '📜', bg: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', href: '/wallet' }
  ]

  const socials = [
    { name: 'Telegram', icon: '✈️', color: '#229ED9', href: 'https://t.me/winxpro_official' },
    { name: 'Instagram', icon: '📷', color: '#E1306C', href: 'https://instagram.com/winxpro' },
    { name: 'Facebook', icon: '📘', color: '#1877F2', href: 'https://facebook.com/winxpro' },
    { name: 'WhatsApp', icon: '💬', color: '#25D366', href: 'https://wa.me/923185954599' },
    { name: 'X Twitter', icon: '✖️', color: '#ffffff', href: 'https://x.com/winxpro' }
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1500,
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
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          cursor: 'pointer'
        }}
      />

      {/* Slide-in drawer container (Dark sleek 10win style) */}
      <div style={{
        position: 'relative',
        width: '88%',
        maxWidth: '310px',
        height: '100%',
        background: '#121214',
        borderRight: '1px solid #222',
        boxShadow: '10px 0 35px rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1501,
        overflowY: 'auto',
        animation: 'slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#fff'
      }}>
        {/* Drawer Top Header (Logo + Close) */}
        <div style={{
          padding: '16px 14px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0d0d0f',
          borderBottom: '1px solid #1f1f23'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ⬅
            </button>
            <img 
              src="/logo.png" 
              alt="WinX Pro" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {user ? (
              <button
                onClick={() => { logOut(); onClose() }}
                style={{
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  color: '#ff6666',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Log Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => { onClose(); onOpenAuth() }}
                  style={{
                    background: '#00e676',
                    color: '#000',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '11px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => { onClose(); onOpenAuth() }}
                  style={{
                    background: 'transparent',
                    color: '#00e676',
                    border: '1px solid #00e676',
                    fontWeight: 900,
                    fontSize: '11px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>

        {/* User / Demo Status Banner */}
        {user && (
          <div style={{
            background: isDemoMode ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 215, 0, 0.08)',
            borderBottom: '1px solid #222',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {isDemoMode ? '🎮 PRACTICE MODE' : '💰 REAL ACCOUNT'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: isDemoMode ? '#00e676' : 'var(--accent)' }}>
                Pi {isDemoMode ? demoBalance.toFixed(2) : parseFloat(balance).toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => toggleDemoMode(!isDemoMode)}
              style={{
                background: isDemoMode ? '#00e676' : '#222',
                color: isDemoMode ? '#000' : '#fff',
                border: '1px solid #333',
                fontSize: '10px',
                fontWeight: 900,
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {isDemoMode ? 'Switch to Real' : 'Switch to Demo'}
            </button>
          </div>
        )}

        <div style={{ padding: '12px 14px' }}>
          {/* Language Selector Dropdown */}
          <div style={{
            background: '#1a1a1e',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            cursor: 'pointer',
            border: '1px solid #27272a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span>🌐</span> English
            </div>
            <span style={{ fontSize: '10px', color: '#888' }}>▼</span>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#777', fontSize: '13px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNav(`/?search=${encodeURIComponent(searchTerm)}`)
                }
              }}
              style={{
                width: '100%',
                padding: '9px 10px 9px 32px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                background: '#18181b',
                color: '#fff',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Grid (2-Column Tiles matching Screenshots 1 & 2) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {gameCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  if (cat.action) cat.action()
                  else handleNav(cat.href)
                }}
                style={{
                  background: '#18181c',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#242429' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#18181c' }}
              >
                <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#e4e4e7', textAlign: 'center' }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>

          {/* Secondary Actions List */}
          <div style={{
            background: '#18181c',
            borderRadius: '10px',
            border: '1px solid #27272a',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div
              onClick={() => handleNav('/profile')}
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <span>📑</span> Bet record
            </div>
            <div
              onClick={handleShare}
              style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>↗️</span> Share
              </div>
              {copied && <span style={{ color: '#00e676', fontSize: '10px' }}>Copied!</span>}
            </div>
            <div
              onClick={() => handleNav('/invite')}
              style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👥</span> Invite & Earn
              </div>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                Rs 600
              </span>
            </div>
          </div>

          {/* Offer Center Title & Grid (2x4 Colored Vibrant Cards - Screenshot 2 & 3) */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Offer Center
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {offerCenter.map((card, i) => (
                <div
                  key={i}
                  onClick={() => handleNav(card.href)}
                  style={{
                    background: card.bg,
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{card.title}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{card.sub}</div>
                  </div>
                  <span style={{ fontSize: '20px' }}>{card.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utility Services List */}
          <div style={{
            background: '#18181c',
            borderRadius: '10px',
            border: '1px solid #27272a',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div
              onClick={handleDownloadApp}
              style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⬇️</span> APP Download
              </div>
              <span style={{ background: '#00e676', color: '#000', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                Rs 100
              </span>
            </div>

            <div
              onClick={() => handleNav('/support')}
              style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <span>🎧</span> Customer Service
            </div>

            <div
              onClick={() => handleNav('/support#faq')}
              style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <span>❓</span> FAQ
            </div>

            <div
              onClick={() => handleNav('/support#about')}
              style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <span>ℹ️</span> About WinX Pro
            </div>

            <div
              onClick={() => handleNav('/support#channels')}
              style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #242428', fontSize: '12px', fontWeight: 700 }}
            >
              <span>🌐</span> Find us
            </div>

            <div
              onClick={() => setIsNightMode(!isNightMode)}
              style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🌙</span> Night mode
              </div>
              <span style={{ fontSize: '11px', color: isNightMode ? '#00e676' : '#888' }}>
                {isNightMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Official Channels List (Screenshot 3 style) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Official Channel
            </div>
            <div style={{
              background: '#18181c',
              borderRadius: '10px',
              border: '1px solid #27272a',
              overflow: 'hidden'
            }}>
              {socials.map((soc, i) => (
                <a
                  key={i}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '11px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: '#fff',
                    borderBottom: i === socials.length - 1 ? 'none' : '1px solid #242428',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{soc.icon}</span>
                  <span>{soc.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
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
