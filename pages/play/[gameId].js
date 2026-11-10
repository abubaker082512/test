import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'
import softCatalog from '../../data/softaggregator_catalog.json'

const SLUG_ALIASES = {
  'diamond-teen20': 'x887bde40b16350c', // Spribe Aviator
  'diamond-teen': 'x887bde40b16350c',
  'diamond-teen9': 'x887bde40b16350c',
  'diamond-joker20': 'x887bde40b16350c',
  'diamond-ab20': 'x887bde40b16350c',
  'diamond-lucky7': 'x887bde40b16350c',
  'diamond-dt20': 'x887bde40b16350c',
  'diamond-baccarat': 'xddb07a7a584679c',
  'diamond-poker20': 'xddb07a7a584679c',
  'aviator': 'x887bde40b16350c',
  'super-ace': 'xe1c00f1b46ebc87',
  'super-ace-deluxe': 'x50a0b59eee3ad61',
  'fortune-gems': 'x4220b3aa086524a',
  'fortune-gems-2': 'x6ae59fc87ac977e',
  'fortune-gems-3': 'x7ac8b6d24d040b5',
  'mahjong-ways': 'xe92c6d594da6a33',
  'mahjong-ways-2': 'x81efe399c900eeb',
  'gates-of-olympus': 'xddb07a7a584679c',
  'fortune-tiger': 'x0677695eabcfb08',
  'fortune-rabbit': 'x252cc9f28ea457d',
  'fortune-ox': 'xbe185ba1c2b21af'
}

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading: authLoading, isDemoMode } = useAuth()

  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [launchUrl, setLaunchUrl] = useState(null)
  const [launchLoading, setLaunchLoading] = useState(true)
  const [launchError, setLaunchError] = useState(null)
  const [gameMeta, setGameMeta] = useState(null)

  const activeUser = user || {
    id: 'guest_player',
    uid: 'guest_player',
    email: '',
    displayName: 'Player'
  }

  // Active wallet balance (strict single-source-of-truth from walletStore/Firestore)
  const activeBalance = wallet && wallet.balance !== undefined 
    ? parseFloat(wallet.balance) 
    : (user?.balance !== undefined ? parseFloat(user.balance) : 0.0)

  // Fetch real wallet balance
  const fetchWallet = async () => {
    const uid = user ? (user.id || user.uid || '') : 'guest_player'
    const email = user ? (user.email || '') : ''
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (!authLoading) {
      fetchWallet()
      const poll = setInterval(fetchWallet, 4000)
      return () => clearInterval(poll)
    }
    const onWalletUpdated = () => fetchWallet()
    const onFrameMessage = (e) => {
      if (e.data && e.data.type === 'WINX_BALANCE_SYNC' && typeof e.data.balance === 'number') {
        setWallet(prev => prev ? ({ ...prev, balance: e.data.balance }) : { balance: e.data.balance, currency: 'PKR' })
        window.dispatchEvent(new Event('wallet-updated'))
      }
    }
    window.addEventListener('wallet-updated', onWalletUpdated)
    window.addEventListener('message', onFrameMessage)
    return () => {
      window.removeEventListener('wallet-updated', onWalletUpdated)
      window.removeEventListener('message', onFrameMessage)
    }
  }, [user, authLoading])

  // Prevent recursive iframe embedding
  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.top.location.href = window.location.href
    }
  }, [])

  // Resolve target hash ID
  const resolvedTargetId = SLUG_ALIASES[gameId] || gameId

  // Look up game metadata in catalog
  useEffect(() => {
    if (!resolvedTargetId) return
    const allGames = Object.values(softCatalog || {}).filter(Array.isArray).flat()
    const found = allGames.find(g => g.id_hash === resolvedTargetId || String(g.id) === String(resolvedTargetId))
    if (found) {
      setGameMeta(found)
    }
  }, [resolvedTargetId])

  // Direct Launch via SoftAggregator API
  const launchSoftAggregatorGame = async () => {
    if (!resolvedTargetId) return
    setLaunchLoading(true)
    setLaunchError(null)

    const rawId = user ? (user.id || user.uid || user.email || 'player') : 'guest_player'
    const cleanUser = String(rawId)
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24) || 'player'

    try {
      const res = await fetch('/api/softaggregator/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameid: resolvedTargetId,
          user_id: user ? (user.id || user.uid || cleanUser) : 'guest_player',
          email: user?.email || '',
          demo: isDemoMode,
          device: 'mobile'
        })
      })

      const json = await res.json()

      let finalUrl = null
      if (typeof json.launch_url === 'string' && json.launch_url.startsWith('http')) {
        finalUrl = json.launch_url
      } else if (json.launch_url && typeof json.launch_url.gameurl === 'string' && json.launch_url.gameurl.startsWith('http')) {
        finalUrl = json.launch_url.gameurl
      } else if (json.launch_url && typeof json.launch_url.url === 'string' && json.launch_url.url.startsWith('http')) {
        finalUrl = json.launch_url.url
      }

      if (json.success && finalUrl) {
        setLaunchUrl(finalUrl)
        setLaunchLoading(false)
      } else {
        setLaunchError(json.error || json.details?.message || 'Unable to launch game session.')
        setLaunchLoading(false)
      }
    } catch (err) {
      setLaunchError(err.message || 'Network error connecting to game server.')
      setLaunchLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedTargetId && !authLoading) {
      launchSoftAggregatorGame()
    }
  }, [resolvedTargetId, isDemoMode, user, authLoading])

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {})
        }
        setIsFullscreen(false)
      }
    } catch (e) {}
  }

  const gameTitle = gameMeta?.name || 'Live Casino Game'
  const providerName = gameMeta?.provider_name || 'SoftAggregator'

  return (
    <div
      className="winx-game-stage-shell"
      style={{
        width: '100%',
        maxWidth: '480px',
        height: '100dvh',
        margin: '0 auto',
        background: '#070a14',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          height: '52px',
          padding: '0 10px',
          background: 'linear-gradient(180deg, #0b1322 0%, #070d18 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55)',
          zIndex: 50,
          gap: '6px',
          flexShrink: 0
        }}
      >
        {/* Left: Back to Lobby + Game Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#e2e8f0',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>⬅</span>
              <span>Lobby</span>
            </button>
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 900,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {gameTitle}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#34d399',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {providerName}
            </span>
          </div>
        </div>

        {/* Right: Wallet Balance + Deposit Quick Action + Sync + Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div
            style={{
              background: 'rgba(5, 24, 15, 0.95)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              padding: '4px 8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '7.5px', fontWeight: 900, color: '#34d399', letterSpacing: '0.04em' }}>
                PKR WALLET
              </span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffd54f', fontFamily: 'monospace' }}>
                Rs {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <Link href="/wallet" target="_blank" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '3px 7px',
                  borderRadius: '5px',
                  fontSize: '10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
                title="Quick Deposit to recharge balance"
              >
                <span>+</span>
                <span>Deposit</span>
              </button>
            </Link>
          </div>

          <button
            type="button"
            onClick={fetchWallet}
            style={{
              width: '28px',
              height: '28px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Refresh Wallet Balance"
          >
            🔄
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              width: '28px',
              height: '28px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontSize: '11px',
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

      {/* Main Game Stage - Purely Streams SoftAggregator Official Session */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: 'calc(100dvh - 52px)',
          background: '#070a14',
          overflow: 'hidden'
        }}
      >
        {launchLoading && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(ellipse at 50% 50%, #0c1a2e 0%, #050a12 100%)',
              color: '#fff',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '16px', animation: 'spin 3s linear infinite' }}>
              🎰
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#00ff88', marginBottom: '6px' }}>
              Launching {gameTitle}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Connecting to {providerName} Game Server via SoftAggregator API...
            </div>
            <div
              style={{
                width: '180px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ff88, #38bdf8)',
                  animation: 'pulse 1.2s ease-in-out infinite'
                }}
              />
            </div>
          </div>
        )}

        {launchError && !launchLoading && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#070a14',
              color: '#fff',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '38px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#f43f5e', marginBottom: '8px' }}>
              Game Launch Notice
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: '#cbd5e1',
                maxWidth: '340px',
                lineHeight: 1.5,
                marginBottom: '20px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '12px 14px',
                borderRadius: '10px'
              }}
            >
              {launchError}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={launchSoftAggregatorGame}
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00bb66)',
                  color: '#000',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry Launch
              </button>
              <Link href="/">
                <button
                  type="button"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  ⬅ Lobby
                </button>
              </Link>
            </div>
          </div>
        )}

        {launchUrl && !launchLoading && (
          <iframe
            src={launchUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              background: '#000'
            }}
            allow="autoplay; fullscreen; payment; microphone; camera; geolocation; clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-orientation-lock allow-pointer-lock allow-presentation"
            title={gameTitle}
          />
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
