import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading, isDemoMode, demoBalance, toggleDemoMode, spendDemoBalance, addDemoBalance } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ftgData, setFtgData] = useState(null)
  const [showFtgDetails, setShowFtgDetails] = useState(false)
  const [iframeReloadKey, setIframeReloadKey] = useState(0)

  // Live Provider Stream State
  const [gameMode, setGameMode] = useState('api')
  const [liveGameUrl, setLiveGameUrl] = useState(null)
  const [apiGameName, setApiGameName] = useState(null)
  const [apiProvider, setApiProvider] = useState(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  const activeUser = user || {
    id: 'guest_player',
    uid: 'guest_player',
    email: 'guest@winxpro.com.pk',
    displayName: 'Guest'
  }

  // Fetch real wallet balance
  const fetchWallet = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(user.id || user.uid || '')}&email=${encodeURIComponent(user.email || '')}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (user) {
      fetchWallet()
    }
  }, [user])

  // Listen for real-time balance updates from hosted GitHub open-source game iframes via WinXBridge
  useEffect(() => {
    const handleBridgeMessage = (event) => {
      const data = event?.data
      if (!data || data.type !== 'WINX_BALANCE_SYNC') return
      const nextBalance = Number(data.balance)
      if (!Number.isFinite(nextBalance)) return

      if (data.isDemo) {
        const diff = nextBalance - demoBalance
        if (diff < -0.01) spendDemoBalance(Math.abs(diff))
        else if (diff > 0.01) addDemoBalance(diff)
      } else {
        setWallet((prev) => ({
          ...(prev || { currency: 'PKR' }),
          balance: nextBalance
        }))
      }
    }

    window.addEventListener('message', handleBridgeMessage)
    return () => window.removeEventListener('message', handleBridgeMessage)
  }, [demoBalance, spendDemoBalance, addDemoBalance])

  // Effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 5000.0)

  // Map slug to our self-hosted GitHub open-source engines in /public/games/
  const resolveOpenSourceEngineUrl = (rawSlug) => {
    const slug = String(rawSlug || '').toLowerCase().replace(/^winx-/, '')
    const baseQuery = `user_id=${encodeURIComponent(activeUser.id || activeUser.uid || 'guest_player')}&email=${encodeURIComponent(activeUser.email || '')}&demo=${isDemoMode ? 'true' : 'false'}&balance=${encodeURIComponent(Math.round(activeBalance))}`

    if (
      slug.includes('mystical') ||
      slug.includes('forest') ||
      slug.includes('mahjong') ||
      slug.includes('bounty') ||
      slug.includes('fishing')
    ) {
      return `/games/mystical-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('super-ace') || slug.includes('diamond')) {
      return `/games/sibaxi-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('fortune-gem') || slug.includes('lucky-seven')) {
      return `/games/lucky-sevens/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('classic-slot') || slug.includes('lucky-reel') || slug.includes('slots')) {
      return `/games/phaser-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
    }

    if (slug.includes('aviator') || slug.includes('spribe')) {
      return `/games/aviator-spribe/index.html?${baseQuery}&game=aviator`
    }

    if (slug.includes('crash')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=crash#/crash`
    }
    if (slug.includes('mine')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=mines#/mines`
    }
    if (slug.includes('plinko')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=plinko#/plinko`
    }
    if (slug.includes('roulette')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=roulette#/roulette`
    }
    if (slug.includes('blackjack') || slug.includes('baccarat') || slug.includes('dragon') || slug.includes('poker')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=blackjack#/blackjack`
    }
    if (slug.includes('limbo')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=limbo#/limbo`
    }
    if (slug.includes('hilo')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=hilo#/hilo`
    }
    if (slug.includes('keno')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=keno#/keno`
    }
    if (slug.includes('wheel') || slug.includes('twist') || slug.includes('penalty') || slug.includes('derby')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=twist#/twist`
    }
    if (slug.includes('sic-bo') || slug.includes('sicbo') || slug.includes('pocket-dice')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=pocket-dice#/pocket-dice`
    }
    if (slug.includes('dice') || slug.includes('coin')) {
      return `/games/nours-casino/index.html?${baseQuery}&game=dice#/dice`
    }

    return `/games/mystical-slot/index.html?${baseQuery}&game=${encodeURIComponent(slug)}`
  }

  const fetchLiveGameUrl = async (customMoney) => {
    if (!gameId) return
    setApiLoading(true)
    setApiError(null)

    if (String(gameId).startsWith('ftg-') || String(gameId).startsWith('ftg_')) {
      try {
        const cleanId = String(gameId).replace(/^ftg[-_]/, '')
        const res = await fetch(`/api/freetogame/game?id=${encodeURIComponent(cleanId)}`)
        const json = await res.json()
        if (json.success && json.data) {
          setFtgData(json.data)
          setLiveGameUrl(json.data.game_url)
          setApiGameName(json.data.title)
          setApiProvider(json.data.developer || json.data.publisher || 'FreeToGame')
        } else {
          setApiError('FreeToGame title is currently initializing.')
        }
      } catch (err) {
        setApiError(err.message || 'Error connecting to FreeToGame service')
      } finally {
        setApiLoading(false)
      }
      return
    }

    const cleanSlug = String(gameId).toLowerCase().replace(/^winx-/, '')
    const nativeSelfHostedSlugs = [
      'mystical-forest-slot',
      'super-ace',
      'super-ace-deluxe',
      'fortune-gems',
      'fortune-gems-2',
      'crash',
      'stake-crash',
      'aviator',
      'aviator-pro',
      'spribe_aviator',
      'mines',
      'stake-mines',
      'minesweeper',
      'plinko',
      'stake-plinko',
      'roulette',
      'roulette-pro',
      'blackjack',
      'blackjack-pro',
      'limbo',
      'limbo-rocket',
      'dragon-tiger',
      'dragon-tiger-pro',
      'baccarat',
      'baccarat-pro',
      'classic-slots',
      'classic-slots-neon',
      'hilo',
      'hilo-streak',
      'coin-flip',
      'coin-flip-3d',
      'keno',
      'keno-neon',
      'sic-bo-macau',
      'sicbo',
      'sic-bo',
      'penalty',
      'penalty-shootout',
      'penalty-shootout-pro',
      'royal-derby',
      'derby',
      'mega-fortune-wheel',
      'wheel',
      'video-poker',
      'video-poker-pro',
      'fishing-joy',
      'fishing-joy-cannon',
      'mahjong-ways-gold',
      'wild-bounty-gold'
    ]

    if (
      String(gameId).toLowerCase().startsWith('winx-') ||
      nativeSelfHostedSlugs.includes(cleanSlug) ||
      nativeSelfHostedSlugs.includes(String(gameId).toLowerCase())
    ) {
      setGameMode('canvas')
      setApiLoading(false)
      return
    }

    try {
      const cleanUser = (activeUser.email || activeUser.displayName || 'player')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16) || 'player'

      const sessionCredits = customMoney || (isDemoMode ? 10000 : Math.max(activeBalance, 5000))

      const res = await fetch('/api/rapid/getGameUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          username: cleanUser,
          money: sessionCredits,
          currency: 'PKR',
          lang: 'en'
        })
      })

      const json = await res.json()
      if (json.success && json.gameUrl && json.gameUrl.startsWith('http')) {
        setLiveGameUrl(json.gameUrl)
        setApiGameName(json.gameName || null)
        setApiProvider(json.provider || null)
      } else {
        setGameMode('canvas')
      }
    } catch (err) {
      setGameMode('canvas')
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    if (gameId) {
      fetchLiveGameUrl()
    }
  }, [gameId, isDemoMode, user])

  const reloadStream = (extraFunds) => {
    setIframeReloadKey((prev) => prev + 1)
    fetchLiveGameUrl(extraFunds)
  }

  const toggleFullscreen = () => {
    const elem = document.documentElement
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const getGameTitle = () => {
    if (apiGameName && apiGameName.length < 30) return apiGameName
    if (!gameId) return 'Live Casino Game'
    if (gameId.length === 32) return 'BetNex Live Game'
    const words = String(gameId).replace(/^winx-/, '').replace(/[-_]/g, ' ').split(' ')
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const renderOpenSourceEngine = () => {
    const engineSrc = resolveOpenSourceEngineUrl(gameId)
    return (
      <iframe
        key={`${gameId}-${isDemoMode}-${iframeReloadKey}`}
        src={engineSrc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: '#070a14'
        }}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        title={getGameTitle()}
      />
    )
  }

  const renderFtgStage = () => {
    if (!ftgData) return null
    const isBrowserGame = (ftgData.platform || '').toLowerCase().includes('browser')

    if (isBrowserGame && !showFtgDetails) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            height: '36px',
            background: 'rgba(15, 32, 39, 0.95)',
            borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '11px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#00ff88', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '10px' }}>FREE</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>Instant Web Play</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowFtgDetails(true)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ℹ️ Info
              </button>
              <button
                type="button"
                onClick={() => window.open(ftgData.game_url, '_blank')}
                style={{
                  background: '#00ff88',
                  border: 'none',
                  color: '#000',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ↗️ New Tab
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <iframe
              src={liveGameUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
              allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-orientation-lock allow-pointer-lock allow-presentation"
              title={ftgData.title}
            />
          </div>
        </div>
      )
    }

    return (
      <div style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #0b101b 0%, #06090e 100%)',
        color: '#fff',
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '16px',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}>
          <img
            src={ftgData.thumbnail || ftgData.imageUrl}
            alt={ftgData.title}
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(0deg, rgba(6,9,14,0.98) 0%, rgba(6,9,14,0.7) 60%, transparent 100%)',
            padding: '20px 16px 14px'
          }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#fff' }}>{ftgData.title}</h1>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100vh', margin: '0 auto', background: '#0c0317', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', marginBottom: '12px' }}>🎰</div>
          <div>Loading Game Engine...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '100vw', height: '100dvh', margin: '0 auto', background: '#070a14', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header Bar */}
      <div style={{ 
        height: '48px',
        padding: '0 14px', 
        background: '#120722', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        zIndex: 50,
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,215,0,0.3)',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⬅ Lobby
            </button>
          </Link>
          
          <div style={{ 
            fontWeight: '900', 
            color: 'var(--accent)', 
            fontSize: '13px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            🎮 {getGameTitle()}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => reloadStream()}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '5px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Reload Game"
          >
            🔄
          </button>

          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: isDemoMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 215, 0, 0.15)', 
              border: `1px solid ${isDemoMode ? '#00e676' : 'var(--accent)'}`, 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Click to toggle Demo/Real Mode"
          >
            <span>{isDemoMode ? '🎮 DEMO' : '💰 REAL'}</span>
            <span style={{ color: isDemoMode ? '#00e676' : 'var(--accent)' }}>
              Rs {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <button 
            onClick={toggleFullscreen}
            style={{ padding: '5px 9px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 'Exit' : '⛶'}
          </button>
        </div>
      </div>

      {/* Main Embedded Open-Source Game Stage */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100dvh - 48px)', background: '#070a14', overflow: 'hidden' }}>
        {ftgData ? renderFtgStage() : gameMode === 'api' && liveGameUrl ? (
          <iframe 
            src={liveGameUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              background: '#000'
            }}
            allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-orientation-lock allow-pointer-lock allow-presentation allow-popups-to-escape-sandbox"
            title={getGameTitle()}
          />
        ) : (
          renderOpenSourceEngine()
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
