import React from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function Offers() {
  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px' }}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0 }}>Special Offers</h1>
        
        <div className="game-card" style={{ width: '100%', alignItems: 'flex-start', textAlign: 'left', marginBottom: '16px' }}>
          <div style={{ fontSize: '24px' }}>🔥</div>
          <div className="title" style={{ fontSize: '18px' }}>First Deposit Bonus</div>
          <div className="subtitle" style={{ color: 'var(--muted)' }}>Get 100% matched deposit up to ₱5,000 on your first deposit!</div>
          <button className="btn primary" style={{ marginTop: '12px' }}>Claim Now</button>
        </div>

        <div className="game-card" style={{ width: '100%', alignItems: 'flex-start', textAlign: 'left' }}>
          <div style={{ fontSize: '24px' }}>📅</div>
          <div className="title" style={{ fontSize: '18px' }}>Daily Check-in</div>
          <div className="subtitle" style={{ color: 'var(--muted)' }}>Log in every day to receive free spins and bonus cash.</div>
          <button className="btn" style={{ marginTop: '12px' }}>Check In</button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
