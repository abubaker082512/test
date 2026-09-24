import React, { useState, useEffect } from 'react'
import { useAppConfig } from '../context/ConfigContext'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const { appConfig } = useAppConfig()

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 400)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  const logoSrc = appConfig.logo_url || '/logo.svg'
  const appTitle = appConfig.app_name || 'App'
  const accentColor = appConfig.accent_color || '#ffd700'
  const primaryColor = appConfig.primary_color || '#0d6efd'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: appConfig.bg_color || 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={logoSrc}
          alt={appTitle}
          style={{
            width: '180px',
            height: 'auto',
            maxHeight: '180px',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 25px ${accentColor}66)`,
            marginBottom: '20px'
          }}
          onError={(e) => { e.target.src = '/logo.svg'; }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: primaryColor }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor }} />
        </div>
        <span
          style={{
            marginTop: '16px',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '2px',
            color: appConfig.text_color || '#ffffff',
            textTransform: 'uppercase'
          }}
        >
          Loading {appTitle}...
        </span>
      </div>
    </div>
  )
}
