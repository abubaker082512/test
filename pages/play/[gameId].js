import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Playing: {gameId?.toUpperCase()}</div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn small">Exit Game</button>
        </Link>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '64px' }}>🎮</div>
        <h2>{gameId} Game Engine</h2>
        <p style={{ color: '#aaa' }}>Waiting for WebSocket connection to backend...</p>
        
        {/* Placeholder for actual game canvas / engine */}
        <div style={{ padding: '24px', border: '2px dashed #333', borderRadius: '12px', background: '#1a1a1a', width: '80%', maxWidth: '400px', textAlign: 'center' }}>
          <div>Current Multiplier</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00ff88', margin: '16px 0' }}>1.00x</div>
          <button className="btn primary" style={{ width: '100%', padding: '16px', fontSize: '20px' }}>PLACE BET</button>
        </div>
      </div>
    </div>
  )
}
