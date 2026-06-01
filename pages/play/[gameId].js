import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

function CrashEngine() {
  const [multiplier, setMultiplier] = useState(1.0)
  const [status, setStatus] = useState('waiting')
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    const fetchState = async () => {
      const { data } = await supabase.from('crash_state').select('*').eq('id', 1).single()
      if (data) {
        setMultiplier(data.multiplier)
        setStatus(data.status)
      }
    }
    fetchState()

    const channel = supabase.channel('public:crash_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crash_state' }, (payload) => {
        setMultiplier(payload.new.multiplier)
        setStatus(payload.new.status)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const triggerRound = async () => {
    setTriggering(true)
    await fetch('/api/crash/tick', { method: 'POST' })
    setTimeout(() => setTriggering(false), 1000)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '64px' }}>{status === 'crashed' ? '💥' : '🚀'}</div>
      <h2>Crash Engine</h2>
      <p style={{ color: '#aaa', textTransform: 'capitalize' }}>Status: {status}</p>
      
      <div style={{ padding: '24px', border: `2px dashed ${status === 'crashed' ? 'red' : '#333'}`, borderRadius: '12px', background: '#1a1a1a', width: '80%', maxWidth: '400px', textAlign: 'center' }}>
        <div>Current Multiplier</div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: status === 'crashed' ? 'red' : '#00ff88', margin: '16px 0' }}>
          {multiplier.toFixed(2)}x
        </div>
        <button 
          className="btn primary" 
          style={{ width: '100%', padding: '16px', fontSize: '20px' }}
          disabled={status !== 'waiting'}
        >
          PLACE BET
        </button>
        {status === 'waiting' && (
          <button className="btn" onClick={triggerRound} disabled={triggering} style={{ width: '100%', marginTop: '12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            {triggering ? 'Starting...' : 'Host: Force Start Round'}
          </button>
        )}
      </div>
    </div>
  )
}

function SlotsEngine({ title, icon, symbolsPool, borderCol }) {
  const [spinning, setSpinning] = useState(false)
  const [symbols, setSymbols] = useState([icon, icon, icon])

  const spin = () => {
    setSpinning(true)
    setTimeout(() => {
      setSpinning(false)
      setSymbols([
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)],
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)],
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)]
      ])
    }, 1500)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '64px' }}>{icon}</div>
      <h2>{title} Engine</h2>
      
      <div style={{ padding: '24px', border: `2px solid ${borderCol}`, borderRadius: '12px', background: '#1a1a1a', width: '80%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '48px', margin: '24px 0', background: '#000', padding: '16px', borderRadius: '8px' }}>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[0]}</span>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[1]}</span>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[2]}</span>
        </div>
        <button 
          className="btn primary" 
          onClick={spin}
          style={{ width: '100%', padding: '16px', fontSize: '20px' }}
          disabled={spinning}
        >
          {spinning ? 'SPINNING...' : 'SPIN - ₱10.00'}
        </button>
      </div>
    </div>
  )
}

function MinesweeperEngine() {
  const [grid, setGrid] = useState(Array(25).fill('❓'))
  const [active, setActive] = useState(false)
  
  const startGame = () => {
    setGrid(Array(25).fill('❓'))
    setActive(true)
  }

  const reveal = (idx) => {
    if (!active || grid[idx] !== '❓') return;
    const isBomb = Math.random() < 0.15; // 15% bomb chance per click
    const newGrid = [...grid]
    if (isBomb) {
      newGrid[idx] = '💣'
      setActive(false)
    } else {
      newGrid[idx] = '💎'
    }
    setGrid(newGrid)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Minesweeper Engine</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#1a1a1a', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
        {grid.map((cell, i) => (
          <div key={i} onClick={() => reveal(i)} style={{ width: '50px', height: '50px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: active ? 'pointer' : 'default', borderRadius: '4px', border: '1px solid #222' }}>
            {cell}
          </div>
        ))}
      </div>
      <button className="btn primary" onClick={startGame} style={{ width: '200px', padding: '16px' }}>
        {active ? 'CASH OUT' : 'BET ₱10'}
      </button>
    </div>
  )
}

function FishingEngine() {
  const [score, setScore] = useState(0)
  
  const shoot = () => {
    const isHit = Math.random() < 0.40;
    if (isHit) {
      setScore(s => s + Math.floor(Math.random() * 50) + 10)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Fishing Joy Engine</h2>
      <div style={{ position: 'relative', width: '300px', height: '400px', background: 'linear-gradient(to bottom, #001f3f, #0074D9)', borderRadius: '12px', overflow: 'hidden', border: '2px solid #00aaff' }} onClick={shoot}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#fff', fontWeight: 'bold' }}>Payout: ₱{score}</div>
        {/* Mock floating fish */}
        <div style={{ position: 'absolute', top: '150px', left: '100px', fontSize: '32px' }}>🐠</div>
        <div style={{ position: 'absolute', top: '250px', left: '200px', fontSize: '48px' }}>🦈</div>
        <div style={{ position: 'absolute', top: '350px', left: '50px', fontSize: '24px' }}>🦐</div>
        
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: '#fff', opacity: 0.5 }}>Tap anywhere to shoot net</div>
      </div>
    </div>
  )
}

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Game...</div>

  if (!user) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You must log in to play {gameId} and manage your wallet.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
          <Link href="/"><button className="btn">Back to Home</button></Link>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  const renderGame = () => {
    switch (gameId) {
      case 'crash': return <CrashEngine />
      case 'gold-slots': return <SlotsEngine title="Gold Slots" icon="🎰" symbolsPool={['🍒', '🍋', '🔔', '💎', '7️⃣']} borderCol="var(--accent)" />
      case 'super-ace': return <SlotsEngine title="Super Ace" icon="🂡" symbolsPool={['♠️', '♥️', '♣️', '♦️', '🃏']} borderCol="#ff4444" />
      case 'fortune-gems': return <SlotsEngine title="Fortune Gems" icon="💎" symbolsPool={['💎', '🟢', '🔴', '🔵', '🟣']} borderCol="#44ff44" />
      case 'minesweeper': return <MinesweeperEngine />
      case 'fishing-joy': return <FishingEngine />
      default: return <div style={{ padding: '40px' }}>Game "{gameId}" not found.</div>
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{gameId?.toUpperCase().replace('-', ' ')}</div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn small">Exit</button>
        </Link>
      </div>
      
      {renderGame()}
    </div>
  )
}
