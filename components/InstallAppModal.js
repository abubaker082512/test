import React, { useState, useEffect } from 'react'

export default function InstallAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [installStatus, setInstallStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('apk') // 'apk' or 'pwa'

  useEffect(() => {
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

  const handleDownloadApk = () => {
    setDownloadStarted(true)
    setInstallStatus('⬇️ Downloading WinXPro-release.apk... Once finished, tap the notification or open your Downloads folder to install.')
    try {
      const link = document.createElement('a')
      link.href = '/WinXPro-release.apk'
      link.download = 'WinXPro-release.apk'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      window.location.href = '/WinXPro-release.apk'
    }
  }

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallStatus('✅ WinX Pro added to Home Screen successfully!')
        setTimeout(() => onClose(), 2000)
      }
      setDeferredPrompt(null)
    } else if (isStandalone) {
      setInstallStatus('✅ WinX Pro is already installed on your device!')
    } else {
      setActiveTab('pwa')
      setInstallStatus(isIOS ? 'Follow Safari steps below to add to Home Screen.' : 'Follow Chrome steps below to add to Home Screen.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
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
          maxWidth: '390px',
          background: 'linear-gradient(180deg, #0e1c13 0%, #060b08 100%)',
          border: '1.5px solid #00E65B',
          borderRadius: '22px',
          padding: '22px 18px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 230, 91, 0.25)',
          color: '#ffffff',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
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
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#a0aec0',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* App Header Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <img
            src="/app-icon.png"
            alt="WinX Pro"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              border: '1.5px solid #00E65B',
              boxShadow: '0 4px 14px rgba(0, 230, 91, 0.35)',
              background: '#06120b',
              objectFit: 'contain'
            }}
          />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>WinX Pro</span>
              <span style={{ color: '#00E65B', fontSize: '14px' }}>✓</span>
            </div>
            <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 800, marginTop: '2px' }}>
              ★ 4.9 • Official Pakistan Gaming App
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Win PKR 8,888 Welcome Rewards
            </div>
          </div>
        </div>

        {/* Installation Options Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'apk' ? '#00E65B' : 'transparent',
              color: activeTab === 'apk' ? '#050a06' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🤖 Android APK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'pwa' ? '#00E65B' : 'transparent',
              color: activeTab === 'pwa' ? '#050a06' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📲 Instant Web App
          </button>
        </div>

        {/* Tab 1: Android APK */}
        {activeTab === 'apk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              background: 'rgba(0, 230, 91, 0.08)',
              border: '1px solid rgba(0, 230, 91, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#d1fae5',
              lineHeight: 1.5
            }}>
              Download the official Android APK to get the best gaming performance, instant deposits &amp; full screen experience.
            </div>

            <button
              type="button"
              onClick={handleDownloadApk}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00FF87 0%, #00E65B 100%)',
                border: 'none',
                color: '#050a06',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 230, 91, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>⬇️</span>
              <span>{downloadStarted ? 'Download Again (13.8 MB)' : 'Download APK File (13.8 MB)'}</span>
            </button>

            {/* Clear Step-by-Step for APK */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.6
            }}>
              <strong style={{ color: '#ffd54f' }}>How to Install APK:</strong><br />
              1. Tap the green <strong>Download APK</strong> button above.<br />
              2. When download completes, tap <strong>Open</strong> in notifications.<br />
              3. If prompted, allow <em>Install unknown apps</em> &amp; confirm <strong>Install</strong>.
            </div>
          </div>
        )}

        {/* Tab 2: PWA Web App */}
        {activeTab === 'pwa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#e2e8f0',
              lineHeight: 1.5
            }}>
              Add WinX Pro directly to your Home Screen without downloading any APK files. Plays instantly in full screen!
            </div>

            <button
              type="button"
              onClick={handlePwaInstall}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '12px',
                background: 'rgba(0, 230, 91, 0.15)',
                border: '1.5px solid #00E65B',
                color: '#00FF87',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📲</span>
              <span>{isStandalone ? 'Already Installed' : 'Add to Home Screen'}</span>
            </button>

            {/* Browser Specific Instructions */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.6
            }}>
              <strong style={{ color: '#ffd54f' }}>
                {isIOS ? '📱 iPhone Safari Steps:' : '📱 Android Chrome Steps:'}
              </strong><br />
              {isIOS ? (
                <>
                  1. Tap the <strong>Share</strong> button <span style={{ color: '#38bdf8' }}>⎋</span> at the bottom of Safari.<br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong> <span style={{ color: '#00E65B' }}>⊞</span>.<br />
                  3. Tap <strong>Add</strong> in the top right to start playing.
                </>
              ) : (
                <>
                  1. Tap the <strong>three dots (⋮)</strong> at top right of Chrome.<br />
                  2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.<br />
                  3. Confirm to place the icon on your home screen.
                </>
              )}
            </div>
          </div>
        )}

        {/* Live Notification / Feedback Status */}
        {installStatus && (
          <div style={{
            background: 'rgba(0, 230, 91, 0.14)',
            border: '1px solid #00E65B',
            color: '#00FF87',
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '11.5px',
            fontWeight: 800,
            marginTop: '6px',
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            {installStatus}
          </div>
        )}
      </div>
    </div>
  )
}
