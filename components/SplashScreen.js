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
        backgroundColor: '#070d0a',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(0, 230, 91, 0.22) 0%, rgba(7, 13, 10, 0.98) 70%)',
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
            filter: 'drop-shadow(0 0 30px rgba(0, 230, 91, 0.5)) drop-shadow(0 0 15px rgba(255, 215, 0, 0.35))',
            marginBottom: '20px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e65b', boxShadow: '0 0 8px #00e65b' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6dff38', boxShadow: '0 0 12px #6dff38' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e65b', boxShadow: '0 0 8px #00e65b' }} />
        </div>
        <span
          style={{
            marginTop: '16px',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '2.5px',
            color: '#a1a1aa',
            textTransform: 'uppercase'
          }}
        >
          Loading WinX Pro...
        </span>
      </div>
    </div>
  )
}
