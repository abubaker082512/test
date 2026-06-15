import React, { useState, useEffect } from 'react'

const GOAL_SPOTS = [
  { id: 'TL', name: 'Top Left', top: '15%', left: '15%' },
  { id: 'TR', name: 'Top Right', top: '15%', left: '75%' },
  { id: 'C', name: 'Center', top: '45%', left: '45%' },
  { id: 'BL', name: 'Bottom Left', top: '70%', left: '15%' },
  { id: 'BR', name: 'Bottom Right', top: '70%', left: '75%' }
]

const MULTIPLIERS = [1.92, 3.84, 7.68, 15.36, 30.72]

export default function PenaltyShootout({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [activeRound, setActiveRound] = useState(false)
  const [goalsCount, setGoalsCount] = useState(0)
  const [keeperPos, setKeeperPos] = useState('C') // Goalie starts center
  const [ballPos, setBallPos] = useState({ top: '90%', left: '45%' })
  const [kicking, setKicking] = useState(false)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Visual states
  const [goalHighlight, setGoalHighlight] = useState(null) // 'goal' | 'save'

  const startGameRound = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setGoalHighlight(null)
    setGoalsCount(0)
    setBallPos({ top: '90%', left: '45%' })
    setKeeperPos('C')

    // 1. Submit bet to start shootout round
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Failed to place bet.' })
      }
      fetchWallet()
    } catch (e) {
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    setActiveRound(true)
    setProcessing(false)
  }

  const kickBall = (spotId) => {
    if (!activeRound || kicking || processing) return
    
    setKicking(true)
    setMessage(null)
    setGoalHighlight(null)

    // Position ball to target spot
    const spot = GOAL_SPOTS.find(s => s.id === spotId)
    setBallPos({ top: spot.top, left: spot.left })

    // Randomize goalie dive spot
    const keeperDive = GOAL_SPOTS[Math.floor(Math.random() * GOAL_SPOTS.length)].id
    setKeeperPos(keeperDive)

    setTimeout(() => {
      // Check result
      if (spotId === keeperDive) {
        // Goalie saved it
        setGoalHighlight('save')
        setMessage({ type: 'error', text: '💥 SAVED! Goalkeeper blocked the shot. Lost bet!' })
        setActiveRound(false)
        setKicking(false)
        fetchWallet()
      } else {
        // Goal scored
        setGoalHighlight('goal')
        const nextGoals = goalsCount + 1
        setGoalsCount(nextGoals)
        
        if (nextGoals >= MULTIPLIERS.length) {
          // Max streak reached, auto cashout
          autoCashOut(nextGoals)
        } else {
          setMessage({
            type: 'success',
            text: `⚽ GOAL! Multiplier increased to ${MULTIPLIERS[nextGoals - 1]}x! Cash out or shoot again!`
          })
          setKicking(false)
        }
      }
    }, 1000)
  }

  const autoCashOut = async (goals) => {
    const mult = MULTIPLIERS[goals - 1]
    setProcessing(true)
    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          bet_amount: betAmount,
          multiplier: mult
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({
          type: 'success',
          text: `🏆 STREAK COMPLETED! 5/5 Goals Scored. Cashed Out ₱${(betAmount * mult).toFixed(2)}!`
        })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Payout credit error.' })
    }
    setActiveRound(false)
    setKicking(false)
    setProcessing(false)
    fetchWallet()
  }

  const cashOutRound = async () => {
    if (!activeRound || goalsCount === 0 || kicking || processing) return
    setProcessing(true)

    const mult = MULTIPLIERS[goalsCount - 1]

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          bet_amount: betAmount,
          multiplier: mult
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({
          type: 'success',
          text: `💰 Cashed Out Safely! Won ₱${(betAmount * mult).toFixed(2)} (${mult}x)`
        })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to credit cashout.' })
    }

    setActiveRound(false)
    setProcessing(false)
    fetchWallet()
  }

  const getGoalieStyle = () => {
    const spot = GOAL_SPOTS.find(s => s.id === keeperPos)
    return {
      position: 'absolute',
      top: spot.top,
      left: spot.left,
      transform: 'translate(-50%, -50%)',
      fontSize: '40px',
      transition: 'all 0.5s ease-out',
      zIndex: 3
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #1b5e20 0%, #0d3c1b 100%)', // Stadium Green turf
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '2px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffea00',
          letterSpacing: '1px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          marginBottom: '16px'
        }}>⚽ PENALTY SHOOTOUT</h2>

        {/* Multiplier steps list */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: '#071b0c',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #1b5e20'
        }}>
          {MULTIPLIERS.map((mult, idx) => {
            const stepNum = idx + 1
            const isCompleted = goalsCount >= stepNum
            const isActive = goalsCount + 1 === stepNum

            return (
              <div 
                key={idx} 
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: isCompleted || isActive ? 1.0 : 0.4,
                  transform: isActive ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isCompleted ? '#00e676' : isActive ? '#ffea00' : '#444',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '4px'
                }}>
                  {stepNum}
                </div>
                <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{mult}x</div>
              </div>
            )
          })}
        </div>

        {/* Goalpost arena */}
        <div style={{
          height: '200px',
          background: '#2e7d32',
          border: '6px solid #fff',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          position: 'relative',
          marginBottom: '24px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
        }}>
          {/* Goalie representation */}
          <div style={getGoalieStyle()}>
            🧤🕴️🧤
          </div>

          {/* Target Hotspots */}
          {activeRound && !kicking && GOAL_SPOTS.map(spot => (
            <button
              key={spot.id}
              onClick={() => kickBall(spot.id)}
              style={{
                position: 'absolute',
                top: spot.top,
                left: spot.left,
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 234, 0, 0.2)',
                border: '2px dashed #ffea00',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffea00',
                fontSize: '10px',
                fontWeight: '900',
                zIndex: 2,
                boxShadow: '0 0 8px rgba(255,234,0,0.3)'
              }}
            >
              ⚽
            </button>
          ))}

          {/* Animated Soccer Ball */}
          <div style={{
            position: 'absolute',
            top: ballPos.top,
            left: ballPos.left,
            transform: 'translate(-50%, -50%)',
            fontSize: '32px',
            transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 4
          }}>
            ⚽
          </div>

          {/* Goal Scored / Saved full screen banners */}
          {goalHighlight === 'goal' && (
            <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', background: '#00e676', color: '#000', padding: '6px 16px', borderRadius: '12px', fontSize: '18px', fontWeight: '950', zIndex: 5, animation: 'pulse 0.5s infinite alternate' }}>
              GOAL!!! ⚽🎉
            </div>
          )}
          {goalHighlight === 'save' && (
            <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', background: '#ff1744', color: '#fff', padding: '6px 16px', borderRadius: '12px', fontSize: '18px', fontWeight: '950', zIndex: 5 }}>
              BLOCKED! 🧤💥
            </div>
          )}
        </div>

        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
            padding: '10px',
            borderRadius: '8px',
            color: message.type === 'success' ? '#00e676' : '#ff1744',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {message.text}
          </div>
        )}

        {/* Footer controls cabinet */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!activeRound ? (
            <>
              {/* Stake adjustments */}
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <button
                  disabled={processing}
                  onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#113a1a', color: '#fff', border: '1px solid #00e676', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  -
                </button>
                <div style={{
                  flex: 1,
                  background: '#071c0c',
                  border: '1px solid #00e676',
                  borderRadius: '8px',
                  color: '#fff',
                  lineHeight: '34px',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  ₱{betAmount}
                </div>
                <button
                  disabled={processing}
                  onClick={() => setBetAmount(betAmount + 10)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#113a1a', color: '#fff', border: '1px solid #00e676', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={startGameRound}
                disabled={processing}
                style={{
                  flex: 1.2,
                  background: 'linear-gradient(90deg, #ffea00 0%, #00e676 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: '950',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                START STREAK
              </button>
            </>
          ) : (
            <>
              <button
                onClick={cashOutRound}
                disabled={goalsCount === 0 || kicking || processing}
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #00e676 0%, #00b0ff 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '950',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CASH OUT [₱{(betAmount * (goalsCount > 0 ? MULTIPLIERS[goalsCount - 1] : 0)).toFixed(2)}]
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
