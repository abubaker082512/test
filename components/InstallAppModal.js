import React, { useState, useEffect } from 'react'

export default function InstallAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installStatus, setInstallStatus] = useState(null)

  useEffect(() => {
    // Check if running as installed PWA already
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
      setIsStandalone(standalone)

      const ua = window.navigator.userAgent.toLowerCase()
      setIsIOS(/iphone|ipad|ipod/.test(ua))

      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (!isOpen) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallStatus('App installed successfully! Launching WinX Pro...')
        setTimeout(() => onClose(), 2000)
      }
      setDeferredPrompt(null)
    } else if (isStandalone) {
      setInstallStatus('WinX Pro is already installed on this device!')
      setTimeout(() => onClose(), 2000)
    } else {
      // Direct guide mode
      setInstallStatus('Follow the steps below to add WinX Pro to your Home Screen.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(180deg, #16261d 0%, #0b140e 100%)',
          border: '1.5px solid #6dff38',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(109, 255, 56, 0.25)',
          color: '#ffffff',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* App Header Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <img
            src="/winx-logo.png"
            alt="WinX Pro"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              border: '1.5px solid #6dff38',
              boxShadow: '0 4px 14px rgba(109, 255, 56, 0.3)',
              background: '#070a14',
              objectFit: 'contain'
            }}
          />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>WinX Pro Official</span>
              <span style={{ color: '#38bdf8', fontSize: '14px' }}>✓</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6dff38', fontWeight: 800, marginTop: '2px' }}>
              ★ 4.9 • Official Pakistan Web App
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
              Claim PKR 8,888 Welcome Rewards
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#6dff38' }}>⚡</span>
            <span>Ultra-fast 0ms load speed &amp; 100% full screen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#6dff38' }}>🔒</span>
            <span>Instant JazzCash &amp; Easypaisa QR integration</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#6dff38' }}>🎁</span>
            <span>Daily check-in bonuses &amp; instant notifications</span>
          </div>
        </div>

        {/* Status Message */}
        {installStatus && (
          <div style={{
            background: 'rgba(109, 255, 56, 0.15)',
            border: '1px solid #6dff38',
            color: '#6dff38',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 800,
            marginBottom: '14px',
            textAlign: 'center'
          }}>
            {installStatus}
          </div>
        )}

        {/* 1-Tap Install / Action Button */}
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)',
            border: 'none',
            color: '#081a0b',
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(109, 255, 56, 0.45)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📲</span>
          <span>{isStandalone ? 'App Already Installed' : 'Install WinX Pro to Home Screen'}</span>
        </button>

        {/* Manual Step Guidance for iOS / Unsupported Browsers */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffd54f', marginBottom: '6px' }}>
            {isIOS ? '📱 iOS Safari Quick Install:' : '📱 Android Chrome Quick Install:'}
          </div>
          {isIOS ? (
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
              1. Tap the <strong>Share</strong> button <span style={{ color: '#38bdf8' }}>⎋</span> at the bottom of Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong> <span style={{ color: '#6dff38' }}>⊞</span>.<br />
              3. Tap <strong>Add</strong> in the top right to start playing.
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
              1. Tap the <strong>three dots (⋮)</strong> at the top right of Chrome.<br />
              2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.<br />
              3. Confirm to place the WinX Pro icon on your home dashboard.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
