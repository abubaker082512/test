import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()
  const currentPath = router.pathname

  const navItems = [
    { 
      name: 'Home', 
      path: '/', 
      badge: 0,
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E65B' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    { 
      name: 'Promo', 
      path: '/offers', 
      badge: 6,
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E65B' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      )
    },
    { 
      name: 'Deposit', 
      path: '/wallet', 
      badge: 0,
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E65B' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="16" cy="15" r="1.5" fill={active ? '#00E65B' : '#64748B'} />
        </svg>
      )
    },
    { 
      name: 'Support', 
      path: '/support', 
      badge: 0,
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E65B' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      )
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      badge: 0,
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E65B' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
  ]

  return (
    <footer className="bottom-nav">
      {navItems.map((item) => {
        const isActive = currentPath === item.path
        return (
          <Link href={item.path} key={item.name} style={{ textDecoration: 'none', flex: 1, height: '100%' }}>
            <div className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <span className="bottom-nav-icon">
                {item.icon(isActive)}
              </span>
              <span style={{ 
                color: isActive ? '#00E65B' : '#64748B', 
                fontWeight: isActive ? '800' : '600',
                fontSize: '10.5px',
                letterSpacing: '0.2px'
              }}>
                {item.name}
              </span>
              {item.badge > 0 && (
                <span className="bottom-nav-badge">{item.badge}</span>
              )}
            </div>
          </Link>
        )
      })}
    </footer>
  )
}
