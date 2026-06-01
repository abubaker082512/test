import React from 'react'

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="brand">
        <span style={{ fontSize: '24px' }}>🏆</span>
        BETPK
      </div>
      <div className="spacer" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn">Log In</button>
        <button className="btn primary">Sign Up</button>
      </div>
    </nav>
  )
}
