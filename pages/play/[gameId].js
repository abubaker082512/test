import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'



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

  
  
  const fetchWallet = async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    if (data) setWallet(data)
  }

  useEffect(() => {
    if (!user) return
    fetchWallet()

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
    try {
      const res = await fetch('/api/rapid/getGameUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId, 
          username: user.id || user.email || 'player',
          home_url: window.location.origin + '/'
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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Universal Game Navigation Header */}
      <div style={{ 
        padding: '8px 14px', 
        background: 'var(--bg-secondary)', 
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
            background: 'var(--bg-secondary)',
            color: '#60a5fa',
            textTransform: 'uppercase'
          }}>
            🌐 Official API Provider
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {wallet && (
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border)', 
              padding: '4px 10px', 
              borderRadius: '14px', 
              fontSize: '12px', 
              fontWeight: '800' 
            }}>
              💰 <span style={{ color: 'var(--accent)' }}>Rs {parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ padding: '5px 12px', fontSize: '11px' }}>Exit</button>
          </Link>
        </div>
      </div>

      {/* Main Game Stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {liveLoading ? (
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
            <h3 style={{ marginTop: '16px', fontSize: '18px' }}>Connecting to Official Provider...</h3>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '6px' }}>Establishing secure API session & PKR Bridge</p>
          </div>
        ) : liveError ? (
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
              Game Session Offline
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '440px', lineHeight: '1.6', marginBottom: '24px' }}>
              {liveError 
                ? `Provider error: ${liveError}.` 
                : `We could not establish an active session for "${gameId}". Please retry.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn primary" onClick={fetchLiveUrl}>
                🔄 Retry Connection
              </button>
              <Link href="/casino" style={{ textDecoration: 'none' }}>
                <button className="btn" style={{ background: 'var(--card)' }}>
                  🎲 Return to Lobby
                </button>
              </Link>
            </div>
          </div>
        ) : liveGameUrl ? (
          (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '20px',
              textAlign: 'center',
              background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg) 100%)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎮</div>
              <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>{gameTitle || 'Provider Game'} is Ready!</h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.5' }}>
                This provider requires the game to be launched in fullscreen mode for the best performance and security.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  className="btn primary" 
                  style={{ 
                    padding: '16px 48px', 
                    fontSize: '20px', 
                    fontWeight: '900',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    borderRadius: '30px'
                  }}
                  onClick={() => window.location.href = liveGameUrl}
                >
                  ▶ PLAY NOW
                </button>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                  The game will securely open in this window.
                </p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
