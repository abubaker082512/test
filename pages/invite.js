import React from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function Invite() {
  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0 }}>Invite Friends</h1>
        <p style={{ color: 'var(--muted)' }}>Refer a friend to receive <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₱155.55</span> instantly!</p>
        
        <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--accent)', margin: '24px 0' }}>
          <div style={{ color: 'var(--muted)', marginBottom: '8px' }}>Your Referral Code</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px' }}>BETPK99</div>
        </div>

        <button className="btn primary" style={{ width: '100%', padding: '16px', fontSize: '18px' }}>Share Link</button>
      </div>
      <BottomNav />
    </div>
  )
}
