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
  const [lasers, setLasers] = useState([])
  const [hits, setHits] = useState([])
  
  const shoot = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Add laser animation
    const id = Date.now()
    setLasers(l => [...l, { id, x, y }])
    setTimeout(() => setLasers(l => l.filter(laser => laser.id !== id)), 300)

    // RNG for hit (40% win rate)
    const isHit = Math.random() < 0.40;
    if (isHit) {
      const payout = Math.floor(Math.random() * 50) + 10
      setScore(s => s + payout)
      
      // Add floating hit text
      setHits(h => [...h, { id, x, y, payout }])
      setTimeout(() => setHits(h => h.filter(hit => hit.id !== id)), 1000)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Fishing Joy Engine</h2>
      <div style={{ position: 'relative', width: '300px', height: '400px', background: 'linear-gradient(to bottom, #001f3f, #0074D9)', borderRadius: '12px', overflow: 'hidden', border: '2px solid #00aaff', cursor: 'crosshair' }} onClick={shoot}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#fff', fontWeight: 'bold', zIndex: 10 }}>Payout: ₱{score}</div>
        
        {/* Mock floating fish */}
        <div style={{ position: 'absolute', top: '150px', left: '100px', fontSize: '32px', animation: 'spin 4s linear infinite alternate' }}>🐠</div>
        <div style={{ position: 'absolute', top: '250px', left: '200px', fontSize: '48px', animation: 'spin 6s linear infinite alternate-reverse' }}>🦈</div>
        <div style={{ position: 'absolute', top: '350px', left: '50px', fontSize: '24px', animation: 'spin 3s linear infinite alternate' }}>🦐</div>
        
        {/* Lasers */}
        {lasers.map(l => (
          <div key={l.id} style={{ position: 'absolute', left: '150px', bottom: '0', width: '2px', height: '400px', background: 'yellow', transformOrigin: 'bottom', transform: `rotate(${Math.atan2(l.x - 150, 400 - l.y) * 180 / Math.PI}deg)`, opacity: 0.8, pointerEvents: 'none' }} />
        ))}

        {/* Hits */}
        {hits.map(h => (
          <div key={h.id} style={{ position: 'absolute', left: h.x - 20, top: h.y - 20, color: '#00ff88', fontWeight: 'bold', fontSize: '20px', animation: 'spin 1s linear forwards', pointerEvents: 'none', zIndex: 20 }}>
            +₱{h.payout}
          </div>
        ))}
        
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: '#fff', opacity: 0.5, pointerEvents: 'none' }}>Tap to shoot net</div>
      </div>
    </div>
  )
}

function CoinFlipEngine() {
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState(null)
  
  const flip = (choice) => {
    setFlipping(true)
    setResult(null)
    setTimeout(() => {
      setFlipping(false)
      const isWin = Math.random() < 0.40;
      setResult(isWin ? choice : (choice === 'Heads' ? 'Tails' : 'Heads'))
    }, 1500)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Coin Flip Engine</h2>
      <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(45deg, #ffd700, #ffaa00)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', margin: '24px 0', animation: flipping ? 'spin 0.2s linear infinite' : 'none' }}>
        {result === 'Heads' ? '👤' : (result === 'Tails' ? '🦅' : '🪙')}
      </div>
      {result && <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>Result: {result}</div>}
      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '300px' }}>
        <button className="btn primary" style={{ flex: 1 }} onClick={() => flip('Heads')} disabled={flipping}>Bet Heads</button>
        <button className="btn primary" style={{ flex: 1 }} onClick={() => flip('Tails')} disabled={flipping}>Bet Tails</button>
      </div>
    </div>
  )
}

function DiceEngine() {
  const [target, setTarget] = useState(50)
  const [roll, setRoll] = useState(null)
  
  const play = () => {
    // 40% win rate enforced arbitrarily for demo
    const isWin = Math.random() < 0.40;
    setRoll(isWin ? Math.floor(Math.random() * target) : Math.floor(Math.random() * (100 - target)) + target)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Crypto Dice Engine</h2>
      <div style={{ fontSize: '64px', margin: '24px 0', color: roll === null ? '#fff' : (roll < target ? '#00ff88' : '#ff4444') }}>
        {roll === null ? '🎲' : roll}
      </div>
      <div style={{ width: '80%', maxWidth: '400px', background: '#1a1a1a', padding: '24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Roll Under {target}</span>
          <span style={{ color: 'var(--accent)' }}>{(100 / target * 0.98).toFixed(2)}x Payout</span>
        </div>
        <input type="range" min="5" max="95" value={target} onChange={e => setTarget(e.target.value)} style={{ width: '100%', marginBottom: '24px' }} />
        <button className="btn primary" onClick={play} style={{ width: '100%', padding: '16px' }}>Roll Dice</button>
      </div>
    </div>
  )
}

function RouletteEngine() {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  
  const play = () => {
    setSpinning(true)
    setResult(null)
    setTimeout(() => {
      setSpinning(false)
      const colors = ['red', 'black', 'green']
      // 40% win roughly translates to common red/black bets here
      setResult(colors[Math.floor(Math.random() * colors.length)])
    }, 2000)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h2>Mini Roulette Engine</h2>
      <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '8px solid #333', background: `conic-gradient(#ff4444 0% 48%, #44ff44 48% 52%, #111 52% 100%)`, position: 'relative', animation: spinning ? 'spin 0.5s linear infinite' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
           {result === 'red' ? '🔴' : (result === 'black' ? '⚫' : (result === 'green' ? '🟢' : '🎡'))}
        </div>
      </div>
      <button className="btn primary" onClick={play} disabled={spinning} style={{ width: '80%', maxWidth: '300px', padding: '16px', marginTop: '24px' }}>Spin Wheel</button>
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
      case 'coin-flip': return <CoinFlipEngine />
      case 'crypto-dice': return <DiceEngine />
      case 'mini-roulette': return <RouletteEngine />
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
