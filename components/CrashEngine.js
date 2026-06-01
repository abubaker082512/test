import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

export default function CrashEngine() {
  const { user } = useAuth()
  const [status, setStatus] = useState('waiting')
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00)
  const [crashTarget, setCrashTarget] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [activeBet, setActiveBet] = useState(null) // { amount }
  const [wallet, setWallet] = useState(null)
  const [message, setMessage] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  // Fetch wallet
  const fetchWallet = async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    setWallet(data)
  }

  useEffect(() => { fetchWallet() }, [user])

  // Crash multiplier formula: e^(0.00006 * elapsed_ms)
  const startAnimation = () => {
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const m = Math.pow(Math.E, 0.00006 * elapsed)
      setDisplayMultiplier(parseFloat(m.toFixed(2)))
    }, 100)
  }

  const stopAnimation = (finalMultiplier) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayMultiplier(parseFloat(finalMultiplier))
  }

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const fetchState = async () => {
      const { data } = await supabase.from('crash_state').select('*').eq('id', 1).single()
      if (data) {
        setStatus(data.status)
        if (data.status === 'running') startAnimation()
        else setDisplayMultiplier(data.status === 'crashed' ? data.multiplier : 1.00)
      }
    }
    fetchState()

    const channel = supabase.channel('crash-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crash_state' }, (payload) => {
        const s = payload.new.status
        setStatus(s)
        if (s === 'running') {
          setDisplayMultiplier(1.00)
          startAnimation()
        } else if (s === 'crashed') {
          stopAnimation(payload.new.multiplier)
          setCrashTarget(payload.new.multiplier)
          // Auto-reset active bet if not cashed out
          setActiveBet(null)
          fetchWallet()
        } else if (s === 'waiting') {
          setDisplayMultiplier(1.00)
          setCrashTarget(null)
          fetchWallet()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const triggerRound = async () => {
    setTriggering(true)
    setMessage(null)
    await fetch('/api/crash/tick', { method: 'POST' })
    setTimeout(() => setTriggering(false), 1000)
  }

  const placeBet = async () => {
    if (!user || !wallet) return setMessage({ type: 'error', text: 'Login required' })
    if (status !== 'waiting') return setMessage({ type: 'error', text: 'Wait for next round' })
    if (betAmount > wallet.balance) return setMessage({ type: 'error', text: 'Insufficient balance' })

    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()
    if (data.success) {
      setActiveBet({ amount: betAmount })
      setWallet(w => ({ ...w, balance: data.new_balance }))
      setMessage({ type: 'success', text: `Bet ₱${betAmount} placed! Cash out before it crashes!` })
    } else {
      setMessage({ type: 'error', text: data.error })
    }
  }

  const cashOut = async () => {
    if (!activeBet || status !== 'running') return
    const res = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, bet_amount: activeBet.amount, multiplier: displayMultiplier })
    })
    const data = await res.json()
    if (data.success) {
      setActiveBet(null)
      setWallet(w => ({ ...w, balance: data.new_balance }))
      setMessage({ type: 'success', text: `Cashed out! +₱${data.payout.toFixed(2)} at ${displayMultiplier}x` })
    }
  }

  const isCrashed = status === 'crashed'
  const isRunning = status === 'running'
  const color = isCrashed ? '#ff4444' : (displayMultiplier >= 2 ? '#00ff88' : 'var(--accent)')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px' }}>
      {/* Wallet Balance */}
      {wallet && (
        <div style={{ background: '#1a1a1a', padding: '8px 24px', borderRadius: '24px', border: '1px solid #333', fontSize: '14px' }}>
          💰 Wallet: <strong style={{ color: 'var(--accent)' }}>₱{parseFloat(wallet.balance).toFixed(2)}</strong>
        </div>
      )}

      {/* Crash Display */}
      <div style={{
        width: '90%', maxWidth: '480px',
        background: 'linear-gradient(135deg, #0a0a0a, #111)',
        border: `2px solid ${color}`,
        borderRadius: '20px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: `0 0 40px ${color}33`
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {isCrashed ? '💥' : isRunning ? '🚀' : '⏳'}
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {isCrashed ? 'CRASHED!' : isRunning ? 'LIVE — RISING' : 'WAITING FOR NEXT ROUND'}
        </div>
        <div style={{
          fontSize: '72px',
          fontWeight: '900',
          color,
          fontFamily: 'monospace',
          lineHeight: 1,
          transition: 'color 0.3s'
        }}>
          {displayMultiplier.toFixed(2)}x
        </div>

        {message && (
          <div style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000033' : '#00ff8833', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
            {message.text}
          </div>
        )}

        {/* Bet Controls */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={betAmount}
            min={1}
            onChange={e => setBetAmount(Number(e.target.value))}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '16px', textAlign: 'center' }}
            disabled={status !== 'waiting' || !!activeBet}
          />
          {!activeBet ? (
            <button className="btn primary" onClick={placeBet} disabled={status !== 'waiting'} style={{ flex: 1, padding: '12px', fontSize: '16px' }}>
              BET ₱{betAmount}
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={!isRunning}
              style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', background: '#00ff88', color: '#000', fontWeight: 'bold', border: 'none', cursor: isRunning ? 'pointer' : 'not-allowed', opacity: isRunning ? 1 : 0.5 }}
            >
              CASH OUT<br />
              <small>₱{(activeBet.amount * displayMultiplier).toFixed(2)}</small>
            </button>
          )}
        </div>

        {/* Quick bet amounts */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
              ₱{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Host Controls */}
      {status === 'waiting' && (
        <button className="btn" onClick={triggerRound} disabled={triggering} style={{ borderColor: '#555', color: '#555', fontSize: '12px' }}>
          {triggering ? 'Starting...' : '⚡ Force Start Round (Host)'}
        </button>
      )}
    </div>
  )
}
