import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '../../components/NavBar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

const FEATURED_PROVIDERS = [
  { id: 'ALL', name: 'All Games', icon: '🔥', count: 'Exclusives' },
  { id: 'SLOTS', name: 'Slots', icon: '🎰', count: 'Jackpots' },
  { id: 'LIVE', name: 'Live Casino', icon: '🎡', count: 'Live HD' },
  { id: 'CARDS', name: 'Cards & Table', icon: '🃏', count: 'VIP Tables' },
  { id: 'JACKPOTS', name: 'Jackpots', icon: '⚡', count: 'Mega Pots' }
]

export default function CasinoLobby() {
  const { user } = useAuth()
  const [selectedProvider, setSelectedProvider] = useState('ALL')
  const [allGames, setAllGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Fetch games from Paddy Power
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const fetchGames = async () => {
      try {
        const res = await fetch('/api/paddypower/games')
        const data = await res.json()
        if (isMounted && data.games) {
          setAllGames(data.games.map(g => ({
            id: g.id || g.slug,
            name: g.name || g.title,
            img: g.img || g.imageUrl || '/games/fortune_gems.png',
            provider: 'PADDYPOWER',
            category: g.category || 'Slots',
            badge: g.badge || 'Popular'
          })))
        }
      } catch (e) {
        console.error('Failed to load Paddy Power games:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchGames()

    return () => {
      isMounted = false
    }
  }, [])

  const games = allGames.filter(g => {
    if (selectedProvider === 'ALL') return true
    if (selectedProvider === 'SLOTS') return g.category.toLowerCase().includes('slot')
    if (selectedProvider === 'LIVE') return g.category.toLowerCase().includes('live')
    if (selectedProvider === 'CARDS') return g.category.toLowerCase().includes('card') || g.category.toLowerCase().includes('table')
    if (selectedProvider === 'JACKPOTS') return g.category.toLowerCase().includes('jackpot') || g.badge?.toLowerCase().includes('jackpot')
    return true
  })

  const filteredGames = games.filter(g => 
    g.name && g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">
      <NavBar />

      <div style={{ padding: '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Hero Header */}
        <div style={{
          background: 'radial-gradient(circle at center, #004d40 0%, #00120a 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '36px' }}>☘️</span>
          <h1 style={{ color: 'var(--accent)', fontSize: '24px', margin: '8px 0 4px', fontWeight: '900' }}>
            PADDY POWER CASINO LOBBY
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '500px', margin: '0 auto' }}>
            Play authentic Paddy Power exclusive slots, live dealer roulette, blackjack tables, and progressive jackpots. Real-time Fiat balances enabled.
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
          {FEATURED_PROVIDERS.map(p => {
            const active = selectedProvider === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                style={{
                  background: active ? 'linear-gradient(135deg, #00e676 0%, #00897b 100%)' : '#131926',
                  color: active ? '#000' : '#fff',
                  border: '1px solid ' + (active ? '#00e676' : 'rgba(255,255,255,0.08)'),
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  boxShadow: active ? '0 4px 12px rgba(0, 230, 118, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                <span style={{ 
                  fontSize: '10px', 
                  opacity: 0.8, 
                  background: active ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', 
                  padding: '2px 6px', 
                  borderRadius: '10px' 
                }}>
                  {p.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
            {selectedProvider} ({filteredGames.length} Available)
          </div>
          <input 
            type="text"
            placeholder="Search game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#131926',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '12px',
              width: '180px'
            }}
          />
        </div>

        {/* Live Provider Games Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>🎡</div>
            <p>Fetching official games from {selectedProvider} API...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '14px'
          }}>
            {filteredGames.map((game, idx) => (
              <div 
                key={game.id || idx}
                style={{
                  background: '#131926',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
              >
                {/* Game Thumbnail */}
                <div style={{
                  height: '110px',
                  background: '#0a0e17',
                  backgroundImage: game.img ? `url(${game.img})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    color: 'var(--accent)',
                    fontWeight: 'bold'
                  }}>
                    {selectedProvider}
                  </span>
                </div>

                {/* Game Details & Play Button */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '8px'
                  }} title={game.name}>
                    {game.name}
                  </div>

                  <Link href={`/play/${game.id}`} style={{ textDecoration: 'none' }}>
                    <button
                      onClick={(e) => {
                        if (!user) {
                          e.preventDefault()
                          setIsAuthModalOpen(true)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #00e676 0%, #00897b 100%)',
                        color: '#000',
                        border: 'none',
                        fontWeight: '900',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      PLAY (Fiat)
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontSize: '13px' }}>
            No games found for {selectedProvider}.
          </div>
        )}

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
