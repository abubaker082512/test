import React, { useState, useEffect } from 'react'

const SPRIBE_URL_MAP = {
  'aviator': 'https://demo.spribe.io/launch/aviator?currency=PKR&lang=en',
  'mines': 'https://demo.spribe.io/launch/mines?currency=PKR&lang=en',
  'plinko': 'https://demo.spribe.io/launch/plinko?currency=PKR&lang=en',
  'dice': 'https://demo.spribe.io/launch/dice?currency=PKR&lang=en',
  'hilo': 'https://demo.spribe.io/launch/hilo?currency=PKR&lang=en',
  'keno': 'https://demo.spribe.io/launch/keno?currency=PKR&lang=en'
}

export default function SpribeOfficialEngine({
  gameSlug = 'aviator',
  user,
  wallet,
  fetchWallet,
  isDemoMode,
  demoBalance,
  spendDemoBalance,
  addDemoBalance
}) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const cleanKey = String(gameSlug || 'aviator').toLowerCase()
  let matchedType = 'aviator'
  if (cleanKey.includes('mine')) matchedType = 'mines'
  else if (cleanKey.includes('plinko')) matchedType = 'plinko'
  else if (cleanKey.includes('dice')) matchedType = 'dice'
  else if (cleanKey.includes('hilo')) matchedType = 'hilo'
  else if (cleanKey.includes('keno')) matchedType = 'keno'

  const targetUrl = SPRIBE_URL_MAP[matchedType] || SPRIBE_URL_MAP['aviator']
  const titleDisplay = `SPRIBE ${matchedType.toUpperCase()}`

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#070b14',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Loading Indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#070b14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>✈️</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#e11d48', letterSpacing: '0.06em' }}>
            CONNECTING OFFICIAL {titleDisplay}...
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Genuine Spribe Turbo Engine • PKR Currency
          </div>
        </div>
      )}

      {/* Official Game Frame */}
      <iframe
        src={targetUrl}
        onLoad={() => setLoading(false)}
        onError={() => setLoadError(true)}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: '#000'
        }}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write; accelerometer; gyroscope"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        title={titleDisplay}
      />
    </div>
  )
}
