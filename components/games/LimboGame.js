import React, { useState, useEffect } from 'react'

export default function LimboGame({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [targetMultiplier, setTargetMultiplier] = useState(2.0)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00)
  const [spinning, setSpinning] = useState(false)
  const [resultVal, setResultVal] = useState(null)
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState([1.54, 12.03, 1.02, 2.50, 1.10])
  const [processing, setProcessing] = useState(false)

  const handleBetChange = (amount) => {
    if (spinning) return
    setBetAmount(Math.max(1, amount))
  }

  const handleTargetChange = (val) => {
    if (spinning) return
    let num = parseFloat(val)
    if (isNaN(num)) num = 1.01
    if (num < 1.01) num = 1.01
    if (num > 1000) num = 1000
    setTargetMultiplier(parseFloat(num.toFixed(2)))
  }

  const playLimbo = async () => {
    if (spinning || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setSpinning(true)
    setMessage(null)
    setResultVal(null)
    setCurrentMultiplier(1.00)

    // 1. Deduct bet from wallet
    try {
      const betRes = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const betData = await betRes.json()
      if (!betData.success) {
        setSpinning(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: betData.error || 'Bet placement failed.' })
      }
      fetchWallet()
    } catch (err) {
      console.error(err)
      setSpinning(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    // 2. Roll random number in Limbo
    // Standard crypto limbo math: 99% return, house edge 1%
    // roll = 99 / random(0, 99)
    const rand = Math.random()
    // Avoid division by zero
    const finalRoll = Math.max(1.00, parseFloat((99 / (rand * 99 + 0.01) * 0.99).toFixed(2)))

    // 3. Run multiplier animation
    let count = 1.00
    const duration = 1500 // 1.5 seconds animation
    const steps = 30
    const increment = (finalRoll - 1.00) / steps
    let currentStep = 0

    const timer = setInterval(async () => {
      currentStep++
      if (currentStep >= steps) {
        clearInterval(timer)
        setCurrentMultiplier(finalRoll)
        setResultVal(finalRoll)
        setSpinning(false)
        setHistory(prev => [finalRoll, ...prev].slice(0, 10))

        const didWin = finalRoll >= targetMultiplier

        if (didWin) {
          // Claim payout
          try {
            const payRes = await fetch('/api/wallet/payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                bet_amount: betAmount,
                multiplier: targetMultiplier
              })
            })
            const payData = await payRes.json()
            if (payData.success) {
              setMessage({
                type: 'success',
                text: `🎉 WIN! Crashed at ${finalRoll}x (Target: ${targetMultiplier}x). Won ₱${(betAmount * targetMultiplier).toFixed(2)}!`
              })
            } else {
              setMessage({ type: 'error', text: 'Payout credit error. Contact support.' })
            }
          } catch (e) {
            setMessage({ type: 'error', text: 'Network error crediting payout.' })
          }
        } else {
          setMessage({
            type: 'error',
            text: `💥 Loss! Crashed at ${finalRoll}x (Target: ${targetMultiplier}x). Try again!`
          })
        }

        setProcessing(false)
        fetchWallet()
      } else {
        count += increment
        setCurrentMultiplier(parseFloat(count.toFixed(2)))
      }
    }, duration / steps)
  }

  // Calculate Win Probability
  const winProbability = parseFloat((99 / targetMultiplier).toFixed(2))

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #0f121d 0%, #06070b 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#131926',
        borderRadius: '16px',
        border: '1px solid #243049',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '900',
          color: '#00e676',
          marginBottom: '20px',
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(0, 230, 118, 0.3)'
        }}>🚀 CYBER LIMBO</h2>

        {/* History Ticker */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '24px',
          overflowX: 'auto',
          padding: '4px'
        }}>
          {history.map((h, i) => (
            <span key={i} style={{
              background: h >= 2.0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)',
              color: h >= 2.0 ? '#00e676' : '#ff1744',
              border: `1px solid ${h >= 2.0 ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.3)'}`,
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Multiplier display arena */}
        <div style={{
          background: '#090d15',
          borderRadius: '12px',
          border: '1px solid #1c2538',
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated decorative grid background */}
          <div style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            backgroundImage: 'radial-gradient(circle, #1a2233 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            opacity: 0.15,
            transform: spinning ? 'translateY(10px)' : 'none',
            transition: 'transform 0.1s linear'
          }}></div>

          <div style={{
            fontSize: '56px',
            fontWeight: '900',
            color: resultVal !== null 
              ? (resultVal >= targetMultiplier ? '#00e676' : '#ff1744')
              : '#ffffff',
            textShadow: resultVal !== null
              ? (resultVal >= targetMultiplier ? '0 0 20px rgba(0, 230, 118, 0.4)' : '0 0 20px rgba(255, 23, 68, 0.4)')
              : '0 0 15px rgba(255,255,255,0.1)',
            transition: 'color 0.2s',
            zIndex: 1
          }}>
            {currentMultiplier.toFixed(2)}x
          </div>
          <span style={{ fontSize: '11px', color: '#65789b', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px', zIndex: 1 }}>
            {spinning ? 'SPINNING ROCKET...' : 'TARGET REACHED'}
          </span>
        </div>

        {/* Game inputs panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#65789b', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Bet Amount (₱)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={betAmount}
                disabled={spinning}
                onChange={(e) => handleBetChange(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  background: '#090d15',
                  border: '1px solid #243049',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              />
              <button disabled={spinning} onClick={() => handleBetChange(betAmount * 2)} style={{ background: '#1c2538', border: '1px solid #243049', color: '#fff', padding: '0 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>2X</button>
              <button disabled={spinning} onClick={() => handleBetChange(Math.floor(betAmount / 2))} style={{ background: '#1c2538', border: '1px solid #243049', color: '#fff', padding: '0 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>1/2</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#65789b', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Target Multiplier
              </label>
              <input
                type="number"
                step="0.05"
                min="1.01"
                max="1000"
                value={targetMultiplier}
                disabled={spinning}
                onChange={(e) => handleTargetChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090d15',
                  border: '1px solid #243049',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#65789b', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Win Probability
              </label>
              <div style={{
                background: '#090d15',
                border: '1px solid #1c2538',
                borderRadius: '8px',
                color: '#00e676',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {winProbability}%
              </div>
            </div>
          </div>

          {message && (
            <div style={{
              background: message.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
              padding: '12px',
              borderRadius: '8px',
              color: message.type === 'success' ? '#00e676' : '#ff1744',
              fontSize: '12px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {message.text}
            </div>
          )}

          <button
            onClick={playLimbo}
            disabled={spinning || processing}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #00e676 0%, #00b0ff 100%)',
              color: '#000',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '8px'
            }}
          >
            {spinning ? 'SPINNING ROCKET...' : `BET & LAUNCH [₱${betAmount}]`}
          </button>
        </div>
      </div>
    </div>
  )
}
