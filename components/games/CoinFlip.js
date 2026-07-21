import React, { useState, useEffect } from 'react'

const MULTIPLIERS = [1.96, 3.84, 7.52, 14.74, 28.89, 56.62]

export default function CoinFlip({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [choice, setChoice] = useState('Red') // 'Red' | 'Blue'
  const [activeRound, setActiveRound] = useState(false)
  const [streak, setStreak] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [coinResult, setCoinResult] = useState('Red')
  const [flipDegree, setFlipDegree] = useState(0)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)

  const startRound = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setStreak(0)
    setFlipDegree(0)
    setCoinResult('Red')

    // 1. Submit bet to start coin flip streak
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet placement failed.' })
      }
      fetchWallet()
    } catch (e) {
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    setActiveRound(true)
    setProcessing(false)
  }

  const flipCoin = () => {
    if (!activeRound || flipping || processing) return

    setFlipping(true)
    setMessage(null)

    // Calculate result
    const outcomes = ['Red', 'Blue']
    const result = outcomes[Math.floor(Math.random() * 2)]
    
    // Add multiple rotations (e.g. 5 full spins = 1800deg) plus matching final degrees
    const randomSpins = 5 + Math.floor(Math.random() * 3)
    const resultDeg = result === 'Red' ? 0 : 180
    const finalDeg = flipDegree + (randomSpins * 360) + resultDeg

    setFlipDegree(finalDeg)

    setTimeout(() => {
      setCoinResult(result)
      setFlipping(false)

      if (choice === result) {
        const nextStreak = streak + 1
        setStreak(nextStreak)

        if (nextStreak >= MULTIPLIERS.length) {
          autoCashOut(nextStreak)
        } else {
          setMessage({
            type: 'success',
            text: `🎯 CORRECT! Landed on ${result}. Streak: ${nextStreak} (Multiplier: ${MULTIPLIERS[nextStreak - 1]}x)`
          })
        }
      } else {
        // Lose round
        setMessage({
          type: 'error',
          text: `💥 Loss! Landed on ${result}. Streak lost!`
        })
        setActiveRound(false)
        fetchWallet()
      }
    }, 1200)
  }

  const autoCashOut = async (finalStreak) => {
    setProcessing(true)
    const mult = MULTIPLIERS[finalStreak - 1]

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
          text: `🏆 MAX STREAK COMPLETED! 6/6 correct flips. Won ₱${(betAmount * mult).toFixed(2)}!`
        })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Payout credit error.' })
    }
    setActiveRound(false)
    setProcessing(false)
    fetchWallet()
  }

  const cashOut = async () => {
    if (!activeRound || streak === 0 || flipping || processing) return
    setProcessing(true)
    const mult = MULTIPLIERS[streak - 1]

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

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #070e17 0%, #03070b 100%)', // Sleek cyber black/blue
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#0d1527',
        border: '2px solid #00e5ff', // Neon Cyan cyber border
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
        textAlign: 'center'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#00e5ff',
          letterSpacing: '1.5px',
          textShadow: '0 0 10px rgba(0, 229, 255, 0.3)',
          margin: '0 0 16px'
        }}>🪙 CRYPTO COIN FLIP</h2>

        {/* Multipliers Ticker */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: '#040915',
          border: '1px solid #1c2e4a',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '24px'
        }}>
          {MULTIPLIERS.map((mult, idx) => {
            const stepNum = idx + 1
            const isCompleted = streak >= stepNum
            const isActive = streak + 1 === stepNum

            return (
              <div key={idx} style={{
                flex: 1,
                opacity: isCompleted || isActive ? 1.0 : 0.3,
                transform: isActive ? 'scale(1.1)' : 'none',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isCompleted ? '#00e676' : isActive ? '#ffea00' : '#444',
                  color: '#000',
                  fontWeight: '900',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 4px'
                }}>
                  {stepNum}
                </div>
                <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{mult}x</div>
              </div>
            )
          })}
        </div>

        {/* 3D Coin Arena */}
        <div style={{
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1000px',
          marginBottom: '28px',
          position: 'relative'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${flipDegree}deg)`,
            transition: flipping ? 'transform 1.2s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
          }}>
            {/* Heads (Red Coin Face) */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff1744 0%, #b71c1c 100%)',
              border: '4px solid #ffea00',
              backfaceVisibility: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              color: '#fff',
              boxShadow: '0 0 20px rgba(255,23,68,0.5), inset 0 0 10px rgba(0,0,0,0.5)'
            }}>
              🔴
            </div>

            {/* Tails (Blue Coin Face) */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #29b6f6 0%, #01579b 100%)',
              border: '4px solid #ffea00',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              color: '#fff',
              boxShadow: '0 0 20px rgba(41,182,246,0.5), inset 0 0 10px rgba(0,0,0,0.5)'
            }}>
              🔵
            </div>
          </div>
        </div>

        {/* Bet pads (Red vs Blue Selection Selector) */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            disabled={flipping || activeRound}
            onClick={() => setChoice('Red')}
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #1f1220 0%, #100611 100%)',
              border: choice === 'Red' ? '2.5px solid #ff1744' : '1px solid #243049',
              borderRadius: '12px',
              padding: '16px 8px',
              cursor: 'pointer',
              color: '#fff',
              boxShadow: choice === 'Red' ? '0 0 15px rgba(255,23,68,0.35)' : 'none',
              transform: choice === 'Red' ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔴</div>
            <div style={{ fontWeight: '900', color: '#ff1744', fontSize: '13px' }}>RED COIN</div>
          </button>

          <button
            disabled={flipping || activeRound}
            onClick={() => setChoice('Blue')}
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #0e1e2d 0%, #050d17 100%)',
              border: choice === 'Blue' ? '2.5px solid #29b6f6' : '1px solid #243049',
              borderRadius: '12px',
              padding: '16px 8px',
              cursor: 'pointer',
              color: '#fff',
              boxShadow: choice === 'Blue' ? '0 0 15px rgba(41,182,246,0.35)' : 'none',
              transform: choice === 'Blue' ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔵</div>
            <div style={{ fontWeight: '900', color: '#29b6f6', fontSize: '13px' }}>BLUE COIN</div>
          </button>
        </div>

        {/* Messaging Box */}
        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
            padding: '10px',
            borderRadius: '8px',
            color: message.type === 'success' ? '#00e676' : '#ff1744',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {message.text}
          </div>
        )}

        {/* Controls cabinet panel */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!activeRound ? (
            <>
              {/* Stake adjustments */}
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <button
                  disabled={processing}
                  onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0e1a2f', color: '#00e5ff', border: '1px solid #00e5ff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  -
                </button>
                <div style={{
                  flex: 1,
                  background: '#040812',
                  border: '1px solid #00e5ff',
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
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0e1a2f', color: '#00e5ff', border: '1px solid #00e5ff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={startRound}
                disabled={processing}
                style={{
                  flex: 1.2,
                  background: 'linear-gradient(90deg, #00e5ff 0%, #29b6f6 100%)',
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
                onClick={flipCoin}
                disabled={flipping || processing}
                style={{
                  flex: 1,
                  background: choice === 'Red' ? 'linear-gradient(90deg, #ff1744 0%, #b71c1c 100%)' : 'linear-gradient(90deg, #29b6f6 0%, #01579b 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '950',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {flipping ? 'SPINNING...' : `FLIP [${choice}]`}
              </button>
              <button
                onClick={cashOut}
                disabled={streak === 0 || flipping || processing}
                style={{
                  flex: 1,
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
                CASH OUT [₱{(betAmount * (streak > 0 ? MULTIPLIERS[streak - 1] : 0)).toFixed(2)}]
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
