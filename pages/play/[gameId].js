import React, { useEffect, useRef, useState } from 'react'
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
  const iframeRef = useRef(null)
  const bootBalanceRef = useRef(null)

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

  //Effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet && wallet.balance !== undefined ? parseFloat(wallet.balance) : 150.0)

  if (bootBalanceRef.current === null || (wallet && bootBalanceRef.current === 150.0 && parseFloat(wallet.balance) !== 150.0)) {
    bootBalanceRef.current = activeBalance
  }

  // Push WINX_INIT to the game iframe without reloading its src URL
  const pushInitToIframe = (overrideBal) => {
    try {
      const win = iframeRef.current && iframeRef.current.contentWindow
      if (!win) return
      win.postMessage({
        type: 'WINX_INIT',
        userId: activeUser.id || activeUser.uid || 'guest_player',
        email: activeUser.email || '',
        isDemo: Boolean(isDemoMode),
        balance: typeof overrideBal === 'number' ? overrideBal : activeBalance
      }, '*')
    } catch (e) {}
  }

  // Fetch real wallet balance
  const fetchWallet = async () => {
    const uid = user ? (user.id || user.uid || '') : 'guest_player'
    const email = user ? (user.email || '') : ''
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
        const fetchedBal = parseFloat(json.wallet.balance)
        if (!isNaN(fetchedBal) && !isDemoMode) {
          bootBalanceRef.current = fetchedBal
          pushInitToIframe(fetchedBal)
        }
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (!loading) {
      fetchWallet()
    }
  }, [user, loading])

  // Sync mode/balance changes to iframe via postMessage
  useEffect(() => {
    pushInitToIframe(activeBalance)
  }, [isDemoMode, user])

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

  // Map slug to our self-hosted GitHub open-source engines in /public/games/
  // IMPORTANT: Do NOT interpolate live `activeBalance` into the iframe src, or React will reload the iframe on every bet!
  const resolveOpenSourceEngineUrl = (rawSlug) => {
    const slug = String(rawSlug || '').toLowerCase().replace(/^winx-/, '')
    const initialBal = Math.round(bootBalanceRef.current ?? activeBalance)
    const baseQuery = `user_id=${encodeURIComponent(activeUser.id || activeUser.uid || 'guest_player')}&email=${encodeURIComponent(activeUser.email || '')}&demo=${isDemoMode ? 'true' : 'false'}&balance=${encodeURIComponent(initialBal)}`

    if (slug.includes('euro-roulette') || slug.includes('european-roulette') || slug.includes('vip-roulette')) {
      return `/games/euro-roulette/index.html?${baseQuery}&game=euro-roulette`
    }

    if (slug.includes('baccarat')) {
      return `/games/baccarat-royale/index.html?${baseQuery}&game=baccarat-royale`
    }

    if (slug.includes('video-poker') || slug.includes('jacks-or-better') || slug.includes('poker')) {
      return `/games/video-poker/index.html?${baseQuery}&game=video-poker`
    }

    if (slug.includes('mega-fortune-wheel') || slug.includes('wheel-of-fortune') || slug.includes('fortune-wheel')) {
      return `/games/wheel-of-fortune/index.html?${baseQuery}&game=mega-fortune-wheel`
    }

    if (slug.includes('vegas-slot') || slug.includes('20-line') || slug.includes('pharaoh') || slug.includes('olympus')) {
      return `/games/vegas-slots/index.html?${baseQuery}&game=vegas-slots`
    }

    if (slug.includes('galaxy-slot') || slug.includes('star-wars') || slug.includes('space-slot')) {
      return `/games/galaxy-slots/index.html?${baseQuery}&game=galaxy-slots`
    }

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
    if (slug.includes('blackjack') || slug.includes('dragon')) {
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
      'vegas-slots',
      'galaxy-slots',
      'euro-roulette',
      'baccarat-royale',
      'wheel-of-fortune',
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
      'twist',
      'pocket-dice',
      'dice',
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
      bootBalanceRef.current = activeBalance
      fetchLiveGameUrl()
    }
  }, [gameId, isDemoMode, user])

  const reloadStream = (extraFunds) => {
    bootBalanceRef.current = activeBalance
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
        ref={iframeRef}
        key={`${gameId}-${isDemoMode}-${iframeReloadKey}`}
        src={engineSrc}
        onLoad={() => pushInitToIframe(activeBalance)}
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
      <div className="winx-game-stage-shell" style={{ width: '100%', height: '100vh', margin: '0 auto', background: '#070b14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎰</div>
          <div style={{ color: '#34d399', fontWeight: 700 }}>Loading WinX Game Engine...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="winx-game-stage-shell" style={{ width: '100%', maxWidth: '100vw', height: '100dvh', margin: '0 auto', background: '#070a14', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Unified Single WINX Dark-Emerald Top Header Across All Games */}
      <header style={{ 
        height: '58px',
        padding: '0 16px', 
        background: 'linear-gradient(180deg, #0b1322 0%, #070d18 100%)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55)',
        zIndex: 50,
        gap: '10px',
        flexShrink: 0
      }}>
        {/* Left: Back to Lobby + WINX Brand + Active Game Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button 
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#e2e8f0',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>⬅</span>
              <span>Lobby</span>
            </button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              fontWeight: '900',
              fontSize: '17px',
              flexShrink: 0
            }}>
              W
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '900',
                letterSpacing: '0.08em',
                color: '#f8fafc',
                lineHeight: 1.1
              }}>
                WINX
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.06em',
                color: '#10b981',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2
              }}>
                {getGameTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Unified PKR WALLET Box + Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: 'rgba(13, 22, 38, 0.95)', 
              border: `1px solid ${isDemoMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(16, 185, 129, 0.45)'}`, 
              padding: '5px 12px', 
              borderRadius: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
            title="Click to switch between Real PKR Wallet and Demo Wallet"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>
                {isDemoMode ? 'DEMO WALLET' : 'PKR WALLET'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#f8fafc', lineHeight: 1.25, fontFamily: 'monospace, sans-serif' }}>
                Rs {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span style={{
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '900',
              letterSpacing: '0.05em',
              background: isDemoMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(16, 185, 129, 0.2)',
              color: isDemoMode ? '#38bdf8' : '#34d399',
              border: `1px solid ${isDemoMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {isDemoMode ? 'DEMO' : 'REAL'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchWallet()
              reloadStream()
            }}
            style={{
              width: '36px',
              height: '36px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Sync Wallet & Reload Game"
          >
            🔄
          </button>

          <button 
            type="button"
            onClick={toggleFullscreen}
            style={{
              width: '36px',
              height: '36px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </header>

      {/* Main Embedded Open-Source Game Stage */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100dvh - 58px)', background: '#070a14', overflow: 'hidden' }}>
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
