import React, { useState, useEffect } from 'react'
export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 500)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f0a1e',
        backgroundImage: 'radial-gradient(circle at 50%40%, rgba(138, 43, 226, 0.25) 0%, rgba(15, 10, 30, 0.95) 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/winx-logo.png"
          alt="WinX Pro"
          style={{
            width: '180px',
            height: 'auto',
            maxHeight: '180px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.6))',
            marginBottom: '20px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffd700' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffd700' }} />
        </div>
        <span
          style={{
            marginTop: '16px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: '#94a3b8',
            textTransform: 'uppercase'
          }}
        >
          Loading WinX Pro...
        </span>
      </div>
    </div>
  )
}
