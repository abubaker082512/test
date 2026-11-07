import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function DownloadApp() {
  const [downloading, setDownloading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase()
      setIsIOS(/iphone|ipad|ipod/.test(ua))
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)

      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleDownloadAPK = () => {
    setDownloading(true)
    const link = document.createElement('a')
    link.href = '/WinXPro-release.apk'
    link.download = 'WinXPro-release.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloading(false), 3000)
  }

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } else {
      alert('To add to Home Screen:\n1. Tap the three dots (⋮) in Chrome\n2. Select "Install app" or "Add to Home screen"')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070a14', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Download WinX Pro Android App &amp; iOS PWA | Official 2026</title>
        <meta name="description" content="Download the official WinX Pro APK for Android and install on iOS. Instant PKR deposits, 11,200+ games, and exclusive PKR 8,888 welcome bonus." />
      </Head>

      <NavBar />

      <main style={{ flex: 1, maxWidth: '480px', width: '100%', margin: '0 auto', padding: '16px 14px 90px', boxSizing: 'border-box' }}>
        {/* Hero Card */}
        <div style={{
          background: 'radial-gradient(circle at 50% 10%, #173822 0%, #0d1711 100%)',
          border: '1.5px solid #6dff38',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 28px rgba(109, 255, 56, 0.25)',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {/* App Icon */}
          <div style={{
            width: '84px',
            height: '84px',
            margin: '0 auto 16px',
            borderRadius: '22px',
            background: '#070a14',
            border: '2px solid #6dff38',
            boxShadow: '0 8px 24px rgba(109, 255, 56, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/winx-logo.png" alt="WinX Pro" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>WinX Pro Official</span>
            <span style={{ color: '#38bdf8', fontSize: '18px' }}>✓</span>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: '#6dff38', marginTop: '4px' }}>
            ★ 4.9 • Official Pakistan Gaming App (v2.8.4)
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Instant JazzCash &amp; Easypaisa • 11,200+ Games • Fast Withdrawals
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Direct APK Download Button */}
            <button
              type="button"
              onClick={handleDownloadAPK}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6dff38 0%, #34b31a 100%)',
                border: 'none',
                color: '#07160a',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 25px rgba(109, 255, 56, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#07160a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{downloading ? 'Downloading WinX Pro APK (13.8 MB)...' : 'Download Android APK (13.8 MB)'}</span>
            </button>

            {/* PWA / Web App Option */}
            <button
              type="button"
              onClick={handleInstallPWA}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1.5px solid rgba(109, 255, 56, 0.4)',
                color: '#6dff38',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📱</span>
              <span>{isStandalone ? 'Web App Already Installed' : 'Add WinX Pro to Home Screen (PWA)'}</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#0e1713', border: '1px solid rgba(109, 255, 56, 0.15)', borderRadius: '16px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>0ms Latency</div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>High-frequency betting engine</div>
          </div>

          <div style={{ background: '#0e1713', border: '1px solid rgba(109, 255, 56, 0.15)', borderRadius: '16px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎁</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffd54f' }}>Rs 8,888 Free</div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Welcome app install reward</div>
          </div>

          <div style={{ background: '#0e1713', border: '1px solid rgba(109, 255, 56, 0.15)', borderRadius: '16px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛡️</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>100% Verified</div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Safe &amp; virus-free APK build</div>
          </div>

          <div style={{ background: '#0e1713', border: '1px solid rgba(109, 255, 56, 0.15)', borderRadius: '16px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>💬</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8' }}>24/7 VIP Chat</div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Instant human support agent</div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div style={{
          background: '#0d1511',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ffd54f', marginBottom: '10px' }}>
            {isIOS ? '🍏 iOS Installation Steps' : '🤖 Android Installation Steps'}
          </div>

          {isIOS ? (
            <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>1.</strong> Open <strong>Safari</strong> on your iPhone or iPad.</div>
              <div><strong>2.</strong> Tap the <strong>Share</strong> icon (square with arrow up) at the bottom.</div>
              <div><strong>3.</strong> Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</div>
              <div><strong>4.</strong> Tap <strong>&quot;Add&quot;</strong> in the top right to start playing instantly.</div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>1.</strong> Tap <strong>&quot;Download Android APK&quot;</strong> above.</div>
              <div><strong>2.</strong> If prompted, tap <strong>&quot;Download anyway&quot;</strong> (safe official build).</div>
              <div><strong>3.</strong> Open the downloaded file and tap <strong>&quot;Install&quot;</strong>.</div>
              <div><strong>4.</strong> Launch WinX Pro from your apps drawer to claim your rewards.</div>
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#6dff38', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
            ← Return to WinX Pro Lobby
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
