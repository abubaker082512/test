import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

// Premium Game Components Imports
import CrashGame from '../../components/games/CrashGame'
import PlinkoGame from '../../components/games/PlinkoGame'
import BlackjackGame from '../../components/games/BlackjackGame'
import SuperAce from '../../components/games/SuperAce'
import FortuneGems from '../../components/games/FortuneGems'
import MinesweeperGame from '../../components/games/MinesweeperGame'
import FishingJoy from '../../components/games/FishingJoy'
import CockfightGame from '../../components/games/CockfightGame'
import SportsBook from '../../components/games/SportsBook'
import RouletteGame from '../../components/games/RouletteGame'
import BaccaratGame from '../../components/games/BaccaratGame'
import HiloGame from '../../components/games/HiloGame'
import KenoGame from '../../components/games/KenoGame'
import LimboGame from '../../components/games/LimboGame'
import DragonTigerGame from '../../components/games/DragonTigerGame'
import SicBoGame from '../../components/games/SicBoGame'
import VideoPokerGame from '../../components/games/VideoPokerGame'
import ClassicSlots from '../../components/games/ClassicSlots'
import PenaltyShootout from '../../components/games/PenaltyShootout'
import FishHunterGame from '../../components/games/FishHunterGame'
import MahjongWays from '../../components/games/MahjongWays'
import WildBounty from '../../components/games/WildBounty'
import CoinFlip from '../../components/games/CoinFlip'
import DerbyGame from '../../components/games/DerbyGame'
import DiceGame from '../../components/games/DiceGame'
import WheelGame from '../../components/games/WheelGame'

// Reverse map from 32-char provider API hashes to fallback built-in engine components
const HASH_TO_SLUG = {
  // JILI Flagships
  'bdfb23c974a2517198c5443adeea77a8': 'super-ace',
  '80aad2a10ae6a95068b50160d6c78897': 'super-ace-deluxe',
  'a990de177577a2e6a889aaac5f57b429': 'fortune-gems',
  '664fba4da609ee82b78820b1f570f4ad': 'fortune-gems',
  '981f5f9675002fbeaaf24c4128b938d7': 'super-ace', // Boxing King
  'db249defce63610fccabfa829a405232': 'fortune-gems', // Money Coming
  '490096198e28f770a3f85adb6ee49e0f': 'super-ace', // Golden Empire
  '3cf4a85cb6dcf4d8836c982c359cd72d': 'fishing-joy', // Jackpot Fishing
  'e794bf5717aca371152df192341fe68b': 'fishing-joy', // Royal Fishing
  'e333695bcff28acdbecc641ae6ee2b23': 'fishing-joy', // Bombing Fishing
  'eef3e28f0e3e7b72cbca61e7924d00f1': 'fishing-joy', // Dinosaur Tycoon

  // Evolution Live Dealers
  'b4af506243cafae52908e8fa266f8ff6': 'mini-roulette', // Speed Roulette
  '87a7f4550407f5ed73c3353a54a11187': 'blackjack-live', // Blackjack VIP 12
  '7b44393101abad7ac31e21fc1bdb3d56': 'baccarat', // Emperor Speed Baccarat B
  '36b1e71c6f51827e24261d06a22b1e31': 'mini-roulette', // French Roulette Gold
  '5cb6aa4e2ce1c775c568561401ffdfca': 'dragon-tiger', // Fan Tan

  // PG Soft
  '1189baca156e1bbbecc3b26651a63565': 'mahjong-ways-2',
  'ba2adf72179e1ead9e3dae8f0a7d4c07': 'mahjong-ways-2',
  '2fa9a84d096d6ff0bab53f81b79876c8': 'wild-bounty',
  'fb2a2ac51303c0a0801dbe6a72d936f7': 'wild-bounty',

  // Pragmatic Play
  'e30cd08c54817096e863975e309bb457': 'super-ace',
  '8a0b30eb466a8a07027cbddc19369d0f': 'fortune-gems',
  'e1d2da140286507e851fde1cb2fdd4ba': 'super-ace'
}

// Set of games that are live dealer video rooms (Evolution Live, Pragmatic Live)
const LIVE_DEALER_GAMES = new Set([
  'mini-roulette', 'blackjack', 'blackjack-live', 'baccarat', 'sexy-live', 
  'dragon-tiger', 'b4af506243cafae52908e8fa266f8ff6', '87a7f4550407f5ed73c3353a54a11187', 
  '7b44393101abad7ac31e21fc1bdb3d56', '36b1e71c6f51827e24261d06a22b1e31', 
  '5cb6aa4e2ce1c775c568561401ffdfca', 'pp-live', 'paddy-roulette-live', 
  'paddy-blackjack-exclusive', 'paddy-mega-fire-blaze'
])

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [liveGameUrl, setLiveGameUrl] = useState(null)
  const [rawLaunchUrl, setRawLaunchUrl] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState(null)
  const [gameTitle, setGameTitle] = useState('')
  const [playMode, setPlayMode] = useState('native') // 'native' | 'live'
  const [streamTimedOut, setStreamTimedOut] = useState(false)

  // Initialize preferred play mode
  useEffect(() => {
    if (!gameId) return
    const isLiveDealer = LIVE_DEALER_GAMES.has(gameId)
    setPlayMode(isLiveDealer ? 'live' : 'native')
  }, [gameId])

  const fetchWallet = async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    if (data) setWallet(data)
  }

  useEffect(() => {
    if (!user) return
    fetchWallet()

    // Real-time wallet subscription inside play game wrapper
    const channel = supabase.channel('play-wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, (payload) => {
        setWallet(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchLiveUrl = async () => {
    if (!user || !gameId) return
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return

    setLiveLoading(true)
    setLiveError(null)
    setStreamTimedOut(false)
    try {
      const res = await fetch('/api/rapid/getGameUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId, 
          username: user.id || user.email || 'player'
        })
      })
      const data = await res.json()
      const url = data.gameUrl || (data.data && data.data.url) || (data.payload && data.payload.game_launch_url) || data.game_launch_url
      if (url) {
        setLiveGameUrl(url)
        setRawLaunchUrl(data.rawLaunchUrl || url)
        if (data.gameName) setGameTitle(data.gameName)
      } else if (data.error) {
        setLiveError(data.error)
      }
    } catch (err) {
      console.error('Failed to fetch live game url:', err)
      setLiveError('Network error connecting to live game provider.')
    } finally {
      setLiveLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveUrl()
  }, [user, gameId])

  // Timer to detect if live provider stream hangs on the logo
  useEffect(() => {
    if (playMode === 'live' && liveGameUrl) {
      const timer = setTimeout(() => {
        setStreamTimedOut(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [playMode, liveGameUrl])

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Game...</div>

  if (!user) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You must log in to play {gameId?.replace('-', ' ')} and manage your wallet.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
          <Link href="/"><button className="btn">Back to Home</button></Link>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  const renderGame = () => {
    const props = { user, wallet, fetchWallet }
    const resolvedId = HASH_TO_SLUG[gameId] || gameId
    switch (resolvedId) {
      // 🚀 Blockchain / Crash / Limbo / CoinFlip
      case 'crash': 
        return <CrashGame {...props} />

      case 'dice':
      case 'crypto-dice':
        return <DiceGame {...props} />

      case 'wheel':
      case 'lucky-wheel':
        return <WheelGame {...props} />

      case 'xgame-blockchain':
        return <LimboGame {...props} />

      case 'wg-blockchain':
        return <CoinFlip {...props} />
      
      // 🟢 Plinko
      case 'plinko': 
        return <PlinkoGame {...props} />
      
      // 🃏 Cards & Table / Sic Bo / Video Poker / Dragon Tiger
      case 'blackjack': 
      case 'blackjack-live':
        return <BlackjackGame {...props} />

      case 'wg-cards':
        return <SicBoGame {...props} />

      case 'jili-cards':
        return <VideoPokerGame {...props} />

      case 'mini-roulette':
      case 'pp-live':
        return <RouletteGame {...props} />

      case 'baccarat':
        return <BaccaratGame {...props} />

      case 'sexy-live':
        return <DragonTigerGame {...props} />

      case 'hilo':
      case 'kingmidas-cards':
        return <HiloGame {...props} />

      case 'keno':
      case 'bng-slots':
        return <KenoGame {...props} />
      
      // 🎰 Slots / Classic Slots / Mahjong Ways / Wild Bounty
      case 'super-ace': 
      case 'super-ace-deluxe':
      case 'gold-slots':
      case 'slots-pg':
      case 'pp-slots':
      case 'fortune-garuda':
      case 'treasures-of-aztec':
      case 'pinata-wins':
      case 'boxing-king':
        return <SuperAce {...props} />

      case 'mahjong-ways-2':
        return <MahjongWays {...props} />

      case 'wild-bounty':
        return <WildBounty {...props} />
      
      case 'fortune-gems': 
      case 'jili-slots':
      case 'wg-slots':
      case 'jdb-slots':
      case 'mg-slots':
        return <FortuneGems {...props} />

      case 'fc-slots':
      case 'cq9-slots':
        return <ClassicSlots {...props} />
      
      // 💣 Mines
      case 'minesweeper': 
      case 'minesweeper-orig':
        return <MinesweeperGame {...props} />
      
      // 🦈 Fishing / Fish Hunter
      case 'fishing-joy': 
      case 'jili-fishing':
      case 'fc-fishing':
      case 'ky-fishing':
      case 'wg-fishing':
      case 'yellowbat-fishing':
        return <FishingJoy {...props} />

      case 'jdb-fishing':
      case 'ka-fishing':
      case 'baison-fishing':
      case 'cq9-fishing':
        return <FishHunterGame {...props} />
      
      // 🐓 Cockfight
      case 'ds88-cockfight':
        return <CockfightGame {...props} />

      // ⚽ SportsBook / Penalty Shootout / Derby Racing
      case 'crown-sports':
      case 'ug-sports':
        return <SportsBook {...props} />

      case 'poly-sports':
      case '3-sing-sports':
        return <DerbyGame {...props} />

      case 'wg-sports':
      case 'fb-sports':
        return <PenaltyShootout {...props} />

      default: 
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1, 
            padding: '40px 20px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎰</div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '8px', fontSize: '22px' }}>
              Live Game Session Offline
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '440px', lineHeight: '1.6', marginBottom: '24px' }}>
              {liveError 
                ? `Connection note: ${liveError}. The game provider may currently be updating server tables.` 
                : `We could not establish an active partner session for table "${gameId}". Please retry or choose another live game.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn primary" onClick={fetchLiveUrl}>
                🔄 Retry Connection
              </button>
              <Link href="/casino" style={{ textDecoration: 'none' }}>
                <button className="btn" style={{ background: '#1c2438' }}>
                  🎲 127+ Providers Lobby
                </button>
              </Link>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button className="btn">
                  🏠 Back to Home
                </button>
              </Link>
            </div>
          </div>
        )
    }
  }

  const launchUrl = rawLaunchUrl || liveGameUrl

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Universal Game Navigation Header */}
      <div style={{ 
        padding: '8px 14px', 
        background: '#0e1118', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border)',
        zIndex: 20,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎮 {gameTitle || gameId?.replace('-', ' ')}
          </div>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: '800', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: playMode === 'live' ? '#1e3a8a' : '#065f46',
            color: playMode === 'live' ? '#60a5fa' : '#34d399',
            textTransform: 'uppercase'
          }}>
            {playMode === 'live' ? '🌐 Partner Stream' : '⚡ Instant Engine'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Play Mode Switcher */}
          <div style={{ 
            display: 'flex', 
            background: '#07080c', 
            border: '1px solid #1e293b', 
            borderRadius: '18px', 
            padding: '2px' 
          }}>
            <button 
              onClick={() => setPlayMode('native')}
              style={{
                background: playMode === 'native' ? 'var(--accent)' : 'transparent',
                color: playMode === 'native' ? '#000' : 'var(--muted)',
                fontWeight: '800',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Instant loading 60fps game engine"
            >
              ⚡ Instant
            </button>
            <button 
              onClick={() => {
                setPlayMode('live')
                if (!liveGameUrl && !liveLoading) fetchLiveUrl()
              }}
              style={{
                background: playMode === 'live' ? '#2563eb' : 'transparent',
                color: playMode === 'live' ? '#fff' : 'var(--muted)',
                fontWeight: '800',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Live partner video stream"
            >
              🌐 Stream
            </button>
          </div>

          {wallet && (
            <div style={{ 
              background: '#07080c', 
              border: '1px solid var(--border)', 
              padding: '4px 10px', 
              borderRadius: '14px', 
              fontSize: '12px', 
              fontWeight: '800' 
            }}>
              💰 <span style={{ color: 'var(--accent)' }}>Rs {parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {launchUrl && (
            <button 
              className="btn" 
              style={{ 
                padding: '5px 10px', 
                fontSize: '11px', 
                background: '#1e293b', 
                color: '#38bdf8', 
                border: '1px solid #334155',
                cursor: 'pointer',
                fontWeight: '700'
              }}
              onClick={() => window.open(launchUrl, '_blank')}
              title="Launch session in a dedicated new tab"
            >
              ⛶ New Tab
            </button>
          )}

          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ padding: '5px 12px', fontSize: '11px' }}>Exit</button>
          </Link>
        </div>
      </div>

      {/* Main Game Stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {playMode === 'live' ? (
          liveLoading ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', animation: 'spin-slow 2s infinite' }}>🎡</div>
              <h3 style={{ marginTop: '16px', fontSize: '18px' }}>Connecting to Live Partner Room...</h3>
              <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '6px' }}>Securing official API session & PKR bridge</p>
              <button 
                className="btn primary" 
                style={{ marginTop: '20px', fontSize: '12px', padding: '8px 18px' }}
                onClick={() => setPlayMode('native')}
              >
                ⚡ Switch to Instant Play Mode
              </button>
            </div>
          ) : liveGameUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <iframe 
                src={liveGameUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={gameTitle || gameId} 
                allow="autoplay; fullscreen; payment; microphone; camera; clipboard-read; clipboard-write; screen-wake-lock"
                allowFullScreen={true}
                loading="eager"
              />

              {/* Floating Helper Banner if stream takes long to load */}
              {streamTimedOut && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                  zIndex: 30,
                  maxWidth: '90%',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ fontSize: '20px' }}>💡</div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Stream taking long or showing a logo?
                  </div>
                  <button 
                    className="btn primary" 
                    style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '800' }}
                    onClick={() => setPlayMode('native')}
                  >
                    ⚡ Play Instant Engine
                  </button>
                  {launchUrl && (
                    <button 
                      className="btn" 
                      style={{ padding: '6px 10px', fontSize: '11px', background: '#334155' }}
                      onClick={() => window.open(launchUrl, '_blank')}
                    >
                      ⛶ Open New Tab
                    </button>
                  )}
                  <button 
                    onClick={() => setStreamTimedOut(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', marginLeft: '4px' }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎰</div>
              <h3 style={{ fontSize: '18px', color: 'var(--accent)' }}>Partner Stream Connecting...</h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '8px 0 20px', maxWidth: '380px' }}>
                {liveError || 'Loading partner stream. You can switch to Instant Engine anytime without waiting.'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn primary" onClick={() => setPlayMode('native')}>
                  ⚡ Play Instant Engine
                </button>
                <button className="btn" onClick={fetchLiveUrl}>
                  🔄 Retry Stream
                </button>
              </div>
            </div>
          )
        ) : (
          renderGame()
        )}
      </div>
    </div>
  )
}
