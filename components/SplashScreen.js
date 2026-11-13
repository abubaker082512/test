import React, { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 500)
    }, 1400)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050806',
        backgroundImage: 'radial-gradient(circle at 50% 48%, rgba(0, 230, 91, 0.16) 0%, rgba(5, 8, 6, 0.98) 65%)',
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
            width: '210px',
            maxWidth: '70vw',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 35px rgba(0, 230, 91, 0.45)) drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))',
            marginBottom: '18px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e65b', boxShadow: '0 0 10px #00e65b', animation: 'splashPulse 1.2s infinite ease-in-out', animationDelay: '0s' }} />
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e65b', boxShadow: '0 0 10px #00e65b', animation: 'splashPulse 1.2s infinite ease-in-out', animationDelay: '0.2s' }} />
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e65b', boxShadow: '0 0 10px #00e65b', animation: 'splashPulse 1.2s infinite ease-in-out', animationDelay: '0.4s' }} />
        </div>
        <span
          style={{
            marginTop: '14px',
            fontSize: '9.5px',
            fontWeight: '800',
            letterSpacing: '3px',
            color: '#657a6e',
            textTransform: 'uppercase'
          }}
        >
          Loading WinX Pro...
        </span>
      </div>
      <style jsx>{`
        @keyframes splashPulse {
          0%, 80%, 100% {
            opacity: 0.25;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.25);
            box-shadow: 0 0 14px #00e65b, 0 0 4px #fff;
          }
        }
      `}</style>
    </div>
  )
}
