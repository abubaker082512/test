import React, { useState } from 'react'

const PRAGMATIC_URL_MAP = {
  'olympus': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate&lang=en&cur=PKR',
  'sweet-bonanza': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20sweetbonz&lang=en&cur=PKR',
  'sugar-rush': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20sugarrush&lang=en&cur=PKR',
  'big-bass': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs10bbbonanza&lang=en&cur=PKR',
  'starlight': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20starlight&lang=en&cur=PKR',
  'mahjong-wins': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs10mahjongwin&lang=en&cur=PKR',
  'aztec-gems': 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs5aztecgems&lang=en&cur=PKR'
}

export default function PragmaticOfficialEngine({
  gameSlug = 'olympus',
  user,
  wallet,
  fetchWallet,
  isDemoMode,
  demoBalance,
  spendDemoBalance,
  addDemoBalance
}) {
  const [loading, setLoading] = useState(true)

  const cleanKey = String(gameSlug || 'olympus').toLowerCase()
  let matchedType = 'olympus'
  if (cleanKey.includes('sweet') || cleanKey.includes('bonanza')) matchedType = 'sweet-bonanza'
  else if (cleanKey.includes('sugar') || cleanKey.includes('rush')) matchedType = 'sugar-rush'
  else if (cleanKey.includes('bass') || cleanKey.includes('fishing')) matchedType = 'big-bass'
  else if (cleanKey.includes('starlight') || cleanKey.includes('princess')) matchedType = 'starlight'
  else if (cleanKey.includes('mahjong')) matchedType = 'mahjong-wins'
  else if (cleanKey.includes('aztec')) matchedType = 'aztec-gems'

  const targetUrl = PRAGMATIC_URL_MAP[matchedType] || PRAGMATIC_URL_MAP['olympus']
  const titleDisplay = `PRAGMATIC PLAY • ${matchedType.toUpperCase().replace('-', ' ')}`

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
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.06em' }}>
            CONNECTING {titleDisplay}...
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Official Pragmatic Play HTML5 Engine • PKR Currency
          </div>
        </div>
      )}

      {/* Official Game Frame */}
      <iframe
        src={targetUrl}
        onLoad={() => setLoading(false)}
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
