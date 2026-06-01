import React from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Player_9982</div>
            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>VIP Level 1</div>
          </div>
        </div>

        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ color: 'var(--muted)', marginBottom: '8px' }}>Total Balance</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>₱ 0.00</div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn primary" style={{ flex: 1 }}>Deposit</button>
            <button className="btn" style={{ flex: 1 }}>Withdraw</button>
          </div>
        </div>

        <div className="section-title">Account</div>
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Bet History</div>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Transaction Record</div>
          <div style={{ padding: '16px' }}>Security Settings</div>
        </div>
        
        <button className="btn" style={{ width: '100%', marginTop: '24px', borderColor: '#ff4444', color: '#ff4444' }}>Log Out</button>
      </div>
      <BottomNav />
    </div>
  )
}
