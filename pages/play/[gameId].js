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
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(user.id || user.uid || '')}&email=${encodeURIComponent(user.email || '')}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
        return
      }
    } catch (e) {}

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
              💰 <span style={{ color: 'var(--accent)' }}>Pi {parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {liveGameUrl && (
            <button 
              onClick={() => {
                const elem = document.getElementById('game-iframe');
                if (elem) {
                  if (elem.requestFullscreen) elem.requestFullscreen();
                  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
                  else window.open(liveGameUrl, '_blank');
                } else {
                  window.open(liveGameUrl, '_blank');
                }
              }}
              className="btn"
              style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)' }}
              title="Fullscreen"
            >
              ⛶ Fullscreen
            </button>
          )}

          <button 
            onClick={fetchLiveUrl}
            className="btn"
            style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)' }}
            title="Reload Game"
          >
            🔄
          </button>

          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ padding: '5px 12px', fontSize: '11px' }}>Exit</button>
          </Link>
        </div>
      </div>

      {/* Main Game Stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0a0d14' }}>
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
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '6px' }}>Establishing secure API session & Real-time Balance Bridge</p>
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
                ? `Provider message: ${liveError}.` 
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Quick Direct Launch Banner */}
            <div style={{
              background: 'linear-gradient(90deg, #1e3a8a 0%, #065f46 100%)',
              padding: '8px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              zIndex: 10
            }}>
              <span>🎮 <strong>Official Live Session Ready</strong>. If game shows loader below, click direct mode:</span>
              <button
                onClick={() => window.open(liveGameUrl, '_blank', 'noopener,noreferrer')}
                style={{
                  background: '#00e676',
                  color: '#000',
                  fontWeight: '800',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                🚀 Open Direct Window
              </button>
            </div>

            <iframe 
              id="game-iframe"
              src={liveGameUrl}
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none', 
                flex: 1,
                background: '#000'
              }}
              allow="fullscreen; autoplay; encrypted-media; camera; microphone; clipboard-read; clipboard-write; screen-wake-lock"
              title={gameTitle || 'Game'}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
