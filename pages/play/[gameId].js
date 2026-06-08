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

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [liveGameUrl, setLiveGameUrl] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)

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

  useEffect(() => {
    if (!user || !gameId) return

    const fetchLiveUrl = async () => {
      // Check if mock mode is active
      if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return

      setLiveLoading(true)
      try {
        const res = await fetch('/api/rapid/getGameUrl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, username: user.email })
        })
        const data = await res.json()
        if (data.gameUrl || (data.data && data.data.url)) {
          setLiveGameUrl(data.gameUrl || data.data.url)
        }
      } catch (err) {
        console.error('Failed to fetch live game url:', err)
      } finally {
        setLiveLoading(false)
      }
    }

    fetchLiveUrl()
  }, [user, gameId])

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
    switch (gameId) {
      // 🚀 Blockchain / Crash
      case 'crash': 
      case 'xgame-blockchain':
      case 'wg-blockchain':
        return <CrashGame {...props} />
      
      // 🟢 Plinko
      case 'plinko': 
        return <PlinkoGame {...props} />
      
      // 🃏 Cards & Table
      case 'blackjack': 
      case 'jili-cards':
      case 'kingmidas-cards':
      case 'wg-cards':
      case 'mini-roulette':
      case 'blackjack-live':
        return <BlackjackGame {...props} />
      
      // 🎰 Slots
      case 'super-ace': 
      case 'super-ace-deluxe':
      case 'gold-slots':
      case 'slots-pg':
      case 'jili-slots':
      case 'wg-slots':
      case 'fc-slots':
      case 'jdb-slots':
      case 'pp-slots':
      case 'mg-slots':
      case 'cq9-slots':
      case 'bng-slots':
      case 'fortune-garuda':
      case 'wild-bounty':
      case 'treasures-of-aztec':
      case 'pinata-wins':
      case 'mahjong-ways-2':
      case 'boxing-king':
        return <SuperAce {...props} />
      
      case 'fortune-gems': 
        return <FortuneGems {...props} />
      
      // 💣 Mines
      case 'minesweeper': 
      case 'minesweeper-orig':
        return <MinesweeperGame {...props} />
      
      // 🦈 Fishing
      case 'fishing-joy': 
      case 'jdb-fishing':
      case 'jili-fishing':
      case 'fc-fishing':
      case 'ka-fishing':
      case 'ky-fishing':
      case 'baison-fishing':
      case 'wg-fishing':
      case 'cq9-fishing':
      case 'yellowbat-fishing':
        return <FishingJoy {...props} />
      
      // 🐓 Cockfight
      case 'ds88-cockfight':
        return <CockfightGame {...props} />

      // ⚽ SportsBook
      case 'crown-sports':
      case 'wg-sports':
      case 'ug-sports':
      case 'poly-sports':
      case '3-sing-sports':
      case 'fb-sports':
        return <SportsBook {...props} />

      default: 
        return <div style={{ padding: '40px', textAlign: 'center' }}>Game "{gameId}" not found.</div>
    }
  }

  if (liveLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '48px', animation: 'spin-slow 2s infinite' }}>🎡</div>
        <h2 style={{ marginTop: '16px' }}>Loading Live Game Room...</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px' }}>Securing partner casino session connection</p>
      </div>
    )
  }

  if (liveGameUrl) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
        {/* Game navigation header with Live Wallet Indicator */}
        <div style={{ 
          padding: '10px 16px', 
          background: '#0e1118', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border)' 
        }}>
          <div style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎮 LIVE {gameId?.replace('-', ' ')}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {wallet && (
              <div style={{ 
                background: '#07080c', 
                border: '1px solid var(--border)', 
                padding: '6px 12px', 
                borderRadius: '16px', 
                fontSize: '13px', 
                fontWeight: '800' 
              }}>
                💰 Balance: <span style={{ color: 'var(--accent)' }}>₱{parseFloat(wallet.balance).toFixed(2)}</span>
              </div>
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ padding: '6px 14px', fontSize: '12px' }}>Exit</button>
            </Link>
          </div>
        </div>
        
        <iframe 
          src={liveGameUrl} 
          style={{ width: '100%', height: 'calc(100vh - 55px)', border: 'none' }}
          title={gameId} 
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Game navigation header with Live Wallet Indicator */}
      <div style={{ 
        padding: '10px 16px', 
        background: '#0e1118', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🎮 {gameId?.replace('-', ' ')}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {wallet && (
            <div style={{ 
              background: '#07080c', 
              border: '1px solid var(--border)', 
              padding: '6px 12px', 
              borderRadius: '16px', 
              fontSize: '13px', 
              fontWeight: '800' 
            }}>
              💰 Balance: <span style={{ color: 'var(--accent)' }}>₱{parseFloat(wallet.balance).toFixed(2)}</span>
            </div>
          )}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ padding: '6px 14px', fontSize: '12px' }}>Exit</button>
          </Link>
        </div>
      </div>
      
      {renderGame()}
    </div>
  )
}
