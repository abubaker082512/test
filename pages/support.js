import React from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function Support() {
  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px' }}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0 }}>Customer Support</h1>
        <p style={{ color: 'var(--muted)' }}>We are here to help you 24/7.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <button className="btn primary" style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>💬</span> Live Chat
          </button>
          <button className="btn" style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>📧</span> Email Support
          </button>
          <button className="btn" style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>📱</span> Telegram
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
