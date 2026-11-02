import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

// Native Interactive Game Engines (Fallback / Canvas Mode)
import SuperAce from '../../components/games/SuperAce'
import FortuneGems from '../../components/games/FortuneGems'
import MahjongWays from '../../components/games/MahjongWays'
import WildBounty from '../../components/games/WildBounty'
import CrashGame from '../../components/games/CrashGame'
import FishingJoy from '../../components/games/FishingJoy'
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
  const [ftgData, setFtgData] = useState(null)
  const [showFtgDetails, setShowFtgDetails] = useState(false)

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

  // Effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 100.0)
  const activeWalletObj = {
    balance: activeBalance,
    currency: 'Pi'
  }

  // Fetch official live game launch URL from provider API with synchronized high-balance session
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

    const nativeSelfHostedSlugs = [
      'super-ace',
      'super-ace-deluxe',
      'fortune-gems',
      'fortune-gems-2',
      'crash',
      'aviator',
      'spribe_aviator',
      'mines',
      'minesweeper',
      'plinko'
    ];

    if (nativeSelfHostedSlugs.includes(String(gameId).toLowerCase())) {
      setGameMode('canvas');
      setApiLoading(false);
      return;
    }

    try {
      const cleanUser = (activeUser.email || activeUser.displayName || 'player')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16) || 'player'

      // Guarantee generous starting session credits (10,000 Demo / Real Wallet sync) so single wallet 305 never triggers
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
        setApiError(json.error || 'Direct provider stream unavailable')
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
  }, [gameId, isDemoMode, user])

  const reloadStream = (extraFunds) => {
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

  // Determine game title and provider cleanly
  const normalizedSlug = (gameId || '').toLowerCase()

  const getGameTitle = () => {
    if (apiGameName && apiGameName.length < 30) return apiGameName
    if (!gameId) return 'Live Casino Game'
    if (gameId.length === 32) return 'BetNex Live Game'
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
              allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write; focus-without-user-activation *"
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
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ background: '#00ff88', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '4px' }}>
                100% FREE
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                {ftgData.genre}
              </span>
              <span style={{ background: 'rgba(0,229,255,0.2)', color: '#00e5ff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                {ftgData.platform}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#fff' }}>{ftgData.title}</h1>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
              By {ftgData.developer || ftgData.publisher || 'FreeToGame'} • Released {ftgData.release_date || 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.open(ftgData.game_url, '_blank')}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '14px',
              background: 'linear-gradient(135deg, #00ff88, #00bb66)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '900',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(0, 255, 136, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🚀 Play Now ({isBrowserGame ? 'Instant Web' : 'Free Access'})
          </button>

          {isBrowserGame && showFtgDetails && (
            <button
              type="button"
              onClick={() => setShowFtgDetails(false)}
              style={{
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🎮 Resume Game
            </button>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          padding: '14px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '16px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#ddd'
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#00ff88' }}>About the Game</h3>
          <p style={{ margin: 0 }}>{ftgData.description || ftgData.short_description}</p>
        </div>

        {ftgData.screenshots && ftgData.screenshots.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#00ff88' }}>In-Game Screenshots</h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {ftgData.screenshots.map((s, idx) => (
                <img
                  key={idx}
                  src={s.image}
                  alt={ftgData.title + ' screenshot'}
                  style={{ width: '220px', height: '124px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                />
              ))}
            </div>
          </div>
        )}

        {ftgData.minimum_system_requirements && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#aaa'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', color: '#00e5ff' }}>Minimum System Requirements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <div><strong>OS:</strong> {ftgData.minimum_system_requirements.os || 'Windows 10/11'}</div>
              <div><strong>CPU:</strong> {ftgData.minimum_system_requirements.processor || 'Intel/AMD Dual Core'}</div>
              <div><strong>RAM:</strong> {ftgData.minimum_system_requirements.memory || '4 GB'}</div>
              <div><strong>GPU:</strong> {ftgData.minimum_system_requirements.graphics || 'DirectX 11+'}</div>
              <div><strong>Storage:</strong> {ftgData.minimum_system_requirements.storage || '5 GB'}</div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '11px' }}>
          Free to Play provided via official FreeToGame API partner network.
        </div>
      </div>
    )
  }


  if (loading) {
    return (
      <div style={{ width: '100%', maxWidth: '480px', height: '100vh', margin: '0 auto', background: '#0c0317', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', marginBottom: '12px' }}>🎰</div>
          <div>Loading Game Interface...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', height: '100vh', margin: '0 auto', background: '#0c0317', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header Bar in Interface */}
      <div style={{ 
        height: '48px',
        padding: '0 12px', 
        background: '#120722', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        zIndex: 50,
        gap: '8px'
      }}>
        {/* Left: Lobby Link & Clean Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,215,0,0.3)',
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
        
        {/* Right: Controls & Wallet Sync */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          
          {/* Reload Stream Button */}
          <button
            onClick={() => reloadStream()}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
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

          {/* Balance Toggle Badge */}
          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: isDemoMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 215, 0, 0.15)', 
              border: `1px solid ${isDemoMode ? '#00e676' : 'var(--accent)'}`, 
              padding: '4px 8px', 
              borderRadius: '12px', 
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
              Rs {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

                    {ftgData && (
            <button
              onClick={() => window.open(ftgData.game_url, '_blank')}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00aa55)',
                border: 'none',
                color: '#000',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Launch in New Full Window"
            >
              🚀 Launch
            </button>
          )}
          <button 
            onClick={toggleFullscreen}
            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 'Exit' : '⛶'}
          </button>
        </div>
      </div>

      {/* Main Direct Embedded Game Stage Inside Interface */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 48px)', background: '#000', overflow: 'hidden' }}>
        {ftgData ? renderFtgStage() : gameMode === 'api' ? (
          apiLoading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '16px', background: '#0c0317' }}>
              <div style={{ width: '52px', height: '52px', border: '4px solid rgba(255,215,0,0.2)', borderTop: '4px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>Loading Game Session...</div>
              <div style={{ color: '#888', fontSize: '13px' }}>Connecting to {apiProvider || 'BetNex'} Live Game Engine</div>
            </div>
          ) : liveGameUrl ? (
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
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#0c0317' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>API Stream Connection Offline</div>
              <div style={{ color: '#aaa', fontSize: '13px', maxWidth: '400px', marginBottom: '16px' }}>
                {apiError || 'The live provider session could not be established.'}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => reloadStream()} 
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
