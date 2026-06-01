import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'

export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query

  const [multiplier, setMultiplier] = useState(1.0)
  const [status, setStatus] = useState('waiting')

  useEffect(() => {
    if (gameId !== 'crash') return;

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
  }, [gameId])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Playing: {gameId?.toUpperCase()}</div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn small">Exit Game</button>
        </Link>
      </div>
      
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
    </div>
  )
}
