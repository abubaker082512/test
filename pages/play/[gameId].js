import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

// Native Interactive Game Engines (Fallback / Local Mode)
import SuperAce from '../../components/games/SuperAce'
import FortuneGems from '../../components/games/FortuneGems'
import MahjongWays from '../../components/games/MahjongWays'
import WildBounty from '../../components/games/WildBounty'
import CrashGame from '../../components/games/CrashGame'
import FishingJoy from '../../components/games/FishingJoy'
import FishHunterGame from '../../components/games/FishHunterGame'
import RouletteGame from '../../components/games/RouletteGame'
import BlackjackGame from '../../components/games/BlackjackGame'
import BaccaratGame from '../../components/games/BaccaratGame'
import DragonTigerGame from '../../components/games/DragonTigerGame'
import VideoPokerGame from '../../components/games/VideoPokerGame'
import PlinkoGame from '../../components/games/PlinkoGame'
import MinesweeperGame from '../../components/games/MinesweeperGame'
import DiceGame from '../../components/games/DiceGame'
import LimboGame from '../../components/games/LimboGame'
import CoinFlip from '../../components/games/CoinFlip'
import HiloGame from '../../components/games/HiloGame'
import KenoGame from '../../components/games/KenoGame'
import SicBoGame from '../../components/games/SicBoGame'
import PenaltyShootout from '../../components/games/PenaltyShootout'
import DerbyGame from '../../components/games/DerbyGame'
import CockfightGame from '../../components/games/CockfightGame'
import WheelGame from '../../components/games/WheelGame'
import SportsBook from '../../components/games/SportsBook'
import ClassicSlots from '../../components/games/ClassicSlots'

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading, isDemoMode, demoBalance, toggleDemoMode, spendDemoBalance, addDemoBalance } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Live Provider Stream State
  const [gameMode, setGameMode] = useState('api')
  const [liveGameUrl, setLiveGameUrl] = useState(null)
  const [rawLaunchUrl, setRawLaunchUrl] = useState(null)
  const [apiGameName, setApiGameName] = useState(null)
  const [apiProvider, setApiProvider] = useState(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [streamKey, setStreamKey] = useState(Date.now())

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

  // Effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 100.0)
  const activeWalletObj = {
    balance: activeBalance,
    currency: 'Pi'
  }

  // Fetch official live game launch URL from provider API
  const fetchLiveGameUrl = async () => {
    if (!gameId) return
    setApiLoading(true)
    setApiError(null)

    try {
      const cleanUser = (activeUser.email || activeUser.displayName || 'player')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16) || 'player'

      const res = await fetch('/api/rapid/getGameUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          username: cleanUser,
          money: activeBalance,
          currency: 'PKR',
          lang: 'en'
        })
      })

      const json = await res.json()
      if (json.success && json.gameUrl) {
        setLiveGameUrl(json.gameUrl)
        setRawLaunchUrl(json.rawLaunchUrl || json.gameUrl)
        setApiGameName(json.gameName || null)
        setApiProvider(json.provider || null)
      } else {
        setApiError(json.error || 'Direct provider session temporarily unavailable')
      }
    } catch (err) {
      console.error('Error fetching live game URL:', err)
      setApiError(err.message || 'Network error fetching game stream')
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    if (gameId) {
      fetchLiveGameUrl()
    }
  }, [gameId, isDemoMode])

  const reloadStream = () => {
    setStreamKey(Date.now())
    fetchLiveGameUrl()
  }

  const openInNewTab = () => {
    const target = rawLaunchUrl || liveGameUrl
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
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

  // Determine game title and provider
  const normalizedSlug = (gameId || '').toLowerCase()

  const getGameTitle = () => {
    if (apiGameName) return apiGameName
    if (!gameId) return 'Live Casino Game'
    const words = gameId.replace(/[-_]/g, ' ').split(' ')
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const renderCanvasFallback = () => {
    const props = {
      user: activeUser,
      wallet: activeWalletObj,
      fetchWallet: isDemoMode ? () => {} : fetchWallet,
      isDemoMode,
      demoBalance,
      spendDemoBalance,
      addDemoBalance
    }

    if (normalizedSlug.includes('super-ace') || normalizedSlug.includes('slots-pg') || normalizedSlug.includes('cq9-slots') || normalizedSlug.includes('gold-slots')) {
      return <SuperAce {...props} />
    }
    if (normalizedSlug.includes('fortune-gem') || normalizedSlug.includes('fortune-garuda') || normalizedSlug.includes('jili-slots') || normalizedSlug.includes('mg-slots') || normalizedSlug.includes('bng-slots')) {
      return <FortuneGems {...props} />
    }
    if (normalizedSlug.includes('mahjong') || normalizedSlug.includes('aztec') || normalizedSlug.includes('wg-slots')) {
      return <MahjongWays {...props} />
    }
    if (normalizedSlug.includes('wild-bounty') || normalizedSlug.includes('bounty')) {
      return <WildBounty {...props} />
    }
    if (normalizedSlug.includes('crash') || normalizedSlug.includes('aviator') || normalizedSlug.includes('spribe')) {
      return <CrashGame {...props} />
    }
    if (normalizedSlug.includes('fishin') || normalizedSlug.includes('fishing-joy') || normalizedSlug.includes('fish')) {
      return <FishingJoy {...props} />
    }
    if (normalizedSlug.includes('roulette')) {
      return <RouletteGame {...props} />
    }
    if (normalizedSlug.includes('blackjack') || normalizedSlug.includes('kingmidas')) {
      return <BlackjackGame {...props} />
    }
    if (normalizedSlug.includes('baccarat')) {
      return <BaccaratGame {...props} />
    }
    if (normalizedSlug.includes('dragon-tiger') || normalizedSlug.includes('dragon')) {
      return <DragonTigerGame {...props} />
    }
    if (normalizedSlug.includes('poker') || normalizedSlug.includes('holdem') || normalizedSlug.includes('omaha') || normalizedSlug.includes('caribbean') || normalizedSlug.includes('sexy-live') || normalizedSlug.includes('jili-cards')) {
      return <VideoPokerGame {...props} />
    }
    if (normalizedSlug.includes('plinko')) {
      return <PlinkoGame {...props} />
    }
    if (normalizedSlug.includes('mine')) {
      return <MinesweeperGame {...props} />
    }
    if (normalizedSlug.includes('dice')) {
      return <DiceGame {...props} />
    }
    if (normalizedSlug.includes('limbo')) {
      return <LimboGame {...props} />
    }
    if (normalizedSlug.includes('coin') || normalizedSlug.includes('flip')) {
      return <CoinFlip {...props} />
    }
    if (normalizedSlug.includes('hilo')) {
      return <HiloGame {...props} />
    }
    if (normalizedSlug.includes('keno')) {
      return <KenoGame {...props} />
    }
    if (normalizedSlug.includes('sicbo') || normalizedSlug.includes('sic-bo')) {
      return <SicBoGame {...props} />
    }
    if (normalizedSlug.includes('penalty') || normalizedSlug.includes('shootout')) {
      return <PenaltyShootout {...props} />
    }
    if (normalizedSlug.includes('derby') || normalizedSlug.includes('horse') || normalizedSlug.includes('racing')) {
      return <DerbyGame {...props} />
    }
    if (normalizedSlug.includes('cockfight')) {
      return <CockfightGame {...props} />
    }
    if (normalizedSlug.includes('wheel') || normalizedSlug.includes('spin') || normalizedSlug.includes('crazy_time')) {
      return <WheelGame {...props} />
    }
    if (normalizedSlug.includes('sports') || normalizedSlug.includes('betstack') || normalizedSlug.includes('nfl') || normalizedSlug.includes('nba') || normalizedSlug.includes('soccer') || normalizedSlug.includes('mlb')) {
      return <SportsBook {...props} />
    }

    return <ClassicSlots {...props} gameId={gameId} title={getGameTitle()} />
  }

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', marginBottom: '12px' }}>🎰</div>
          <div>Loading Game Environment...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Universal Top Header */}
      <div style={{ 
        height: '48px',
        padding: '0 12px', 
        background: '#121216', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #222',
        zIndex: 50,
        gap: '8px'
      }}>
        {/* Left: Navigation & Game Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #333',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
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
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            🎮 {getGameTitle()}
          </div>
        </div>
        
        {/* Right: Controls & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          
          {/* Reload Stream Button */}
          <button
            onClick={reloadStream}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid #333',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Reload Game Stream"
          >
            🔄
          </button>

          {/* Popout Button (opens in fresh tab for full browser compatibility) */}
          {liveGameUrl && (
            <button
              onClick={openInNewTab}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #333',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title="Open Game in Full Window"
            >
              ↗
            </button>
          )}

          {/* Demo Mode / Real Mode Toggle Badge */}
          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: isDemoMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 215, 0, 0.15)', 
              border: `1px solid ${isDemoMode ? '#00e676' : 'var(--accent)'}`, 
              padding: '4px 8px', 
              borderRadius: '14px', 
              fontSize: '11px', 
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Click to toggle Demo/Real Mode"
          >
            <span>{isDemoMode ? '🎮 DEMO' : '💰 REAL'}</span>
            <span style={{ color: isDemoMode ? '#00e676' : 'var(--accent)' }}>
              Pi {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.08)' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 'Exit' : '⛶'}
          </button>
        </div>
      </div>

      {/* Main Interactive Direct Live Game Stage */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 48px)', background: '#07070a', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {gameMode === 'api' ? (
          apiLoading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', border: '4px solid rgba(255,215,0,0.2)', borderTop: '4px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>Connecting to Live Provider Stream...</div>
              <div style={{ color: '#888', fontSize: '13px' }}>Generating verified session token for {getGameTitle()}</div>
            </div>
          ) : liveGameUrl ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(circle at center, #1b122c 0%, #080511 100%)' }}>
              
              {/* Sleek Live Game Launch Hub */}
              <div style={{
                maxWidth: '460px',
                width: '100%',
                background: 'rgba(18, 14, 30, 0.95)',
                border: '1px solid rgba(255, 215, 0, 0.35)',
                borderRadius: '20px',
                padding: '32px 24px',
                textAlign: 'center',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 24px rgba(255, 215, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '18px',
                backdropFilter: 'blur(12px)'
              }}>
                
                {/* Glowing Provider Icon */}
                <div style={{ 
                  width: '84px', 
                  height: '84px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,140,0,0.1) 100%)',
                  border: '2px solid rgba(255,215,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  boxShadow: '0 0 20px rgba(255,215,0,0.25)'
                }}>
                  🎰
                </div>

                {/* Game Title & Provider Verification Badge */}
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    {getGameTitle()}
                  </h1>
                  <div style={{ fontSize: '13px', color: '#00e676', fontWeight: 'bold', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }}></span>
                    <span>Official {apiProvider || 'Live Provider'} Stream Active</span>
                  </div>
                </div>

                {/* Session Active Balance */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px', 
                  padding: '12px 18px', 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '600' }}>Active Session Funds:</span>
                  <strong style={{ color: isDemoMode ? '#00e676' : 'var(--accent)', fontSize: '16px', fontWeight: '900' }}>
                    Pi {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                {/* Primary User Gesture Play Action */}
                <button
                  onClick={openInNewTab}
                  style={{
                    width: '100%',
                    padding: '18px 0',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ff9100 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '17px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(255, 215, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    letterSpacing: '0.6px',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>▶ TAP TO PLAY LIVE STREAM</span>
                </button>

                <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                  ⚡ Clicking activates full sound, HD WebGL acceleration & official provider bet sync.
                </div>

                {/* Secondary Action Controls */}
                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
                  <button
                    onClick={reloadStream}
                    style={{
                      flex: 1,
                      padding: '11px 0',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh Token
                  </button>

                  <Link href="/" style={{ flex: 1, textDecoration: 'none' }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '11px 0',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ⬅ Back to Lobby
                    </button>
                  </Link>
                </div>

              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>API Stream Connection Offline</div>
              <div style={{ color: '#aaa', fontSize: '13px', maxWidth: '400px', marginBottom: '16px' }}>
                {apiError || 'The live provider session could not be established.'}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={reloadStream} 
                  className="btn" 
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px' }}
                >
                  🔄 Retry Stream
                </button>
                <button 
                  onClick={() => setGameMode('canvas')} 
                  className="btn" 
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px' }}
                >
                  ⚡ Play Canvas Engine
                </button>
              </div>
            </div>
          )
        ) : (
          renderCanvasFallback()
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
