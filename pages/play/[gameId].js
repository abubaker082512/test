import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

// Native Interactive Game Engines
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

  // Current effective wallet balance (Real or Demo)
  const activeBalance = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 100.0)
  const activeWalletObj = {
    balance: activeBalance,
    currency: 'Pi'
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
    if (!gameId) return 'Live Game'
    const words = gameId.replace(/[-_]/g, ' ').split(' ')
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const renderGameComponent = () => {
    const props = {
      user: activeUser,
      wallet: activeWalletObj,
      fetchWallet: isDemoMode ? () => {} : fetchWallet,
      isDemoMode,
      demoBalance,
      spendDemoBalance,
      addDemoBalance
    }

    // 1. JILI & Super Ace
    if (normalizedSlug.includes('super-ace') || normalizedSlug.includes('slots-pg') || normalizedSlug.includes('cq9-slots') || normalizedSlug.includes('gold-slots')) {
      return <SuperAce {...props} />
    }

    // 2. Fortune Gems
    if (normalizedSlug.includes('fortune-gem') || normalizedSlug.includes('fortune-garuda') || normalizedSlug.includes('jili-slots') || normalizedSlug.includes('mg-slots') || normalizedSlug.includes('bng-slots')) {
      return <FortuneGems {...props} />
    }

    // 3. Mahjong Ways
    if (normalizedSlug.includes('mahjong') || normalizedSlug.includes('aztec') || normalizedSlug.includes('wg-slots')) {
      return <MahjongWays {...props} />
    }

    // 4. Wild Bounty
    if (normalizedSlug.includes('wild-bounty') || normalizedSlug.includes('bounty')) {
      return <WildBounty {...props} />
    }

    // 5. Crash & Aviator
    if (normalizedSlug.includes('crash') || normalizedSlug.includes('aviator') || normalizedSlug.includes('spribe')) {
      return <CrashGame {...props} />
    }

    // 6. Fishing Games
    if (normalizedSlug.includes('fishin') || normalizedSlug.includes('fishing-joy') || normalizedSlug.includes('fish')) {
      return <FishingJoy {...props} />
    }

    // 7. Roulette Live & Auto
    if (normalizedSlug.includes('roulette')) {
      return <RouletteGame {...props} />
    }

    // 8. Blackjack
    if (normalizedSlug.includes('blackjack') || normalizedSlug.includes('kingmidas')) {
      return <BlackjackGame {...props} />
    }

    // 9. Baccarat
    if (normalizedSlug.includes('baccarat')) {
      return <BaccaratGame {...props} />
    }

    // 10. Dragon Tiger
    if (normalizedSlug.includes('dragon-tiger') || normalizedSlug.includes('dragon')) {
      return <DragonTigerGame {...props} />
    }

    // 11. Poker Games (Texas Hold'em, Omaha, Caribbean, 3 Card, Video Poker)
    if (normalizedSlug.includes('poker') || normalizedSlug.includes('holdem') || normalizedSlug.includes('omaha') || normalizedSlug.includes('caribbean') || normalizedSlug.includes('sexy-live') || normalizedSlug.includes('jili-cards')) {
      return <VideoPokerGame {...props} />
    }

    // 12. Plinko
    if (normalizedSlug.includes('plinko')) {
      return <PlinkoGame {...props} />
    }

    // 13. Minesweeper / Mines
    if (normalizedSlug.includes('mine')) {
      return <MinesweeperGame {...props} />
    }

    // 14. Dice
    if (normalizedSlug.includes('dice')) {
      return <DiceGame {...props} />
    }

    // 15. Limbo
    if (normalizedSlug.includes('limbo')) {
      return <LimboGame {...props} />
    }

    // 16. Coin Flip
    if (normalizedSlug.includes('coin') || normalizedSlug.includes('flip')) {
      return <CoinFlip {...props} />
    }

    // 17. HiLo
    if (normalizedSlug.includes('hilo')) {
      return <HiloGame {...props} />
    }

    // 18. Keno
    if (normalizedSlug.includes('keno')) {
      return <KenoGame {...props} />
    }

    // 19. SicBo
    if (normalizedSlug.includes('sicbo') || normalizedSlug.includes('sic-bo')) {
      return <SicBoGame {...props} />
    }

    // 20. Penalty Shootout
    if (normalizedSlug.includes('penalty') || normalizedSlug.includes('shootout')) {
      return <PenaltyShootout {...props} />
    }

    // 21. Derby Racing
    if (normalizedSlug.includes('derby') || normalizedSlug.includes('horse') || normalizedSlug.includes('racing')) {
      return <DerbyGame {...props} />
    }

    // 22. Cockfight
    if (normalizedSlug.includes('cockfight')) {
      return <CockfightGame {...props} />
    }

    // 23. Lucky Wheel
    if (normalizedSlug.includes('wheel') || normalizedSlug.includes('spin') || normalizedSlug.includes('crazy_time')) {
      return <WheelGame {...props} />
    }

    // 24. Sportsbook & Live Match Betting
    if (normalizedSlug.includes('sports') || normalizedSlug.includes('betstack') || normalizedSlug.includes('nfl') || normalizedSlug.includes('nba') || normalizedSlug.includes('soccer') || normalizedSlug.includes('mlb')) {
      return <SportsBook {...props} />
    }

    // Default: High-performance Neon Classic Slots for all other slots (Pragmatic, PaddyPower, RainbowRiches, etc.)
    return <ClassicSlots {...props} gameId={gameId} title={getGameTitle()} />
  }

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Game...</div>

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Universal Top Header */}
      <div style={{ 
        padding: '10px 16px', 
        background: '#121215', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #222',
        zIndex: 20,
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #333',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⬅ Lobby
            </button>
          </Link>
          <div style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎮 {getGameTitle()}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Demo Mode / Real Mode Toggle Badge */}
          <div 
            onClick={() => toggleDemoMode(!isDemoMode)}
            style={{ 
              background: isDemoMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 215, 0, 0.15)', 
              border: `1px solid ${isDemoMode ? '#00e676' : 'var(--accent)'}`, 
              padding: '4px 10px', 
              borderRadius: '14px', 
              fontSize: '12px', 
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
            style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 'Exit Full' : '⛶ Fullscreen'}
          </button>

          {!user && (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="btn primary"
              style={{ padding: '5px 12px', fontSize: '11px' }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Direct Live Game Stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#070709' }}>
        {renderGameComponent()}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
