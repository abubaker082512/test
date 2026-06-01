import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'

function CrashEngine() {
  const [multiplier, setMultiplier] = useState(1.0)
  const [status, setStatus] = useState('waiting')

  useEffect(() => {
    // Fetch initial state
    const fetchState = async () => {
      const { data } = await supabase.from('crash_state').select('*').eq('id', 1).single()
      if (data) {
        setMultiplier(data.multiplier)
        setStatus(data.status)
      }
    }
    fetchState()

    // Subscribe to real-time updates for crash_state
    const channel = supabase.channel('public:crash_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crash_state' }, (payload) => {
        const newState = payload.new
        setMultiplier(newState.multiplier)
        setStatus(newState.status)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '64px' }}>{status === 'crashed' ? '💥' : '🚀'}</div>
      <h2>Crash Game Engine</h2>
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
          {status === 'running' ? 'CASH OUT' : 'PLACE BET'}
        </button>
      </div>
    </div>
  )
}

function SlotsEngine() {
  const [spinning, setSpinning] = useState(false)
  const [symbols, setSymbols] = useState(['🍒', '🍒', '🍒'])

  const spin = () => {
    setSpinning(true)
    setTimeout(() => {
      setSpinning(false)
      const mockSymbols = ['🍒', '🍋', '🔔', '💎', '7️⃣']
      setSymbols([
        mockSymbols[Math.floor(Math.random() * mockSymbols.length)],
        mockSymbols[Math.floor(Math.random() * mockSymbols.length)],
        mockSymbols[Math.floor(Math.random() * mockSymbols.length)]
      ])
    }, 1500)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '64px' }}>🎰</div>
      <h2>Gold Slots Engine</h2>
      
      <div style={{ padding: '24px', border: `2px solid var(--accent)`, borderRadius: '12px', background: '#1a1a1a', width: '80%', maxWidth: '400px', textAlign: 'center' }}>
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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Playing: {gameId?.toUpperCase()}</div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn small">Exit Game</button>
        </Link>
      </div>
      
      {gameId === 'crash' ? <CrashEngine /> : <SlotsEngine />}
    </div>
  )
}
