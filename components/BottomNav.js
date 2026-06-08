import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()
  const currentPath = router.pathname

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠', badge: 0 },
    { name: 'Promo', path: '/offers', icon: '🎁', badge: 3 }, // Show 3 new promos/offers badge
    { name: 'Invite', path: '/invite', icon: '👥', badge: 0 },
    { name: 'Support', path: '/support', icon: '🎧', badge: 0 },
    { name: 'Profile', path: '/profile', icon: '👤', badge: 0 },
  ]

  return (
    <footer className="bottom-nav">
      {navItems.map((item) => (
        <Link href={item.path} key={item.name} style={{ textDecoration: 'none', flex: 1, height: '100%' }}>
          <div className={`bottom-nav-item ${currentPath === item.path ? 'active' : ''}`}>
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.name}</span>
            {item.badge > 0 && (
              <span className="bottom-nav-badge">{item.badge}</span>
            )}
          </div>
        </Link>
      ))}
    </footer>
  )
}
