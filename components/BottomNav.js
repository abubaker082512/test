import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()
  const currentPath = router.pathname

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Offers', path: '/offers', icon: '🎁' },
    { name: 'Invite', path: '/invite', icon: '💸' },
    { name: 'Support', path: '/support', icon: '🎧' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ]

  return (
    <footer className="bottom-nav">
      {navItems.map((item) => (
        <Link href={item.path} key={item.name} style={{ textDecoration: 'none', flex: 1 }}>
          <div className={`nav-item ${currentPath === item.path ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </div>
        </Link>
      ))}
    </footer>
  )
}
