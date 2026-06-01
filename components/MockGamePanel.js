import React from 'react'

export default function MockGamePanel({ onClose }) {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Mock Game Launcher</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎰</div>
        <div>
          <div style={{ fontWeight: 600 }}>Fortune Ace Deluxe</div>
          <div style={{ color: '#bbb', fontSize: 12 }}>Mock launch for testing UI</div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: '#1a1f2a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Status:</span><span style={{ color: '#0f9d58' }}> running</span>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </div>
  )
}
