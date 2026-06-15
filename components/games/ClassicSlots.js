import React, { useState, useEffect } from 'react'

const SYMBOLS = [
  { char: '💎', name: 'Diamond', weight: 8, payout3x: 50 },
  { char: '👑', name: 'Crown', weight: 5, payout3x: 100 },
  { char: '🔔', name: 'Bell', weight: 12, payout3x: 25 },
  { char: '🍋', name: 'Lemon', weight: 18, payout3x: 10 },
  { char: '🍒', name: 'Cherry', weight: 22, payout3x: 5 },
  { char: '⭐', name: 'Star', weight: 10, payout3x: 30 }
]

export default function ClassicSlots({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(['💎', '💎', '💎'])
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Visual effects
  const [spinClass, setSpinClass] = useState([false, false, false])
  const [highlightWin, setHighlightWin] = useState(false)

  const handleBetChange = (amount) => {
    if (spinning) return
    setBetAmount(Math.max(1, amount))
  }

  // Draw weighted random symbol
  const getRandomSymbol = () => {
    const totalWeight = SYMBOLS.reduce((sum, sym) => sum + sym.weight, 0)
    let roll = Math.random() * totalWeight
    for (const sym of SYMBOLS) {
      if (roll < sym.weight) return sym
      roll -= sym.weight
    }
    return SYMBOLS[SYMBOLS.length - 1]
  }

  const spinSlots = async () => {
    if (spinning || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setSpinning(true)
    setMessage(null)
    setHighlightWin(false)
    setSpinClass([true, true, true])

    // 1. Place bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setSpinning(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet placement failed.' })
      }
      fetchWallet()
    } catch (e) {
      setSpinning(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    // 2. Perform reel deceleration stops
    // Reel 1 stops at 800ms, Reel 2 at 1400ms, Reel 3 at 2000ms
    const finalSyms = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    
    // Animate ticks
    let tickCount = 0
    const tickInterval = setInterval(() => {
      setReels(prev => [
        spinClass[0] ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char : prev[0],
        spinClass[1] ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char : prev[1],
        spinClass[2] ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char : prev[2]
      ])
      tickCount++
    }, 80)

    // Stop Reel 1
    setTimeout(() => {
      setReels(prev => [finalSyms[0].char, prev[1], prev[2]])
      setSpinClass(prev => [false, prev[1], prev[2]])
    }, 800)

    // Stop Reel 2
    setTimeout(() => {
      setReels(prev => [finalSyms[0].char, finalSyms[1].char, prev[2]])
      setSpinClass(prev => [false, false, prev[2]])
    }, 1400)

    // Stop Reel 3 and evaluate
    setTimeout(() => {
      clearInterval(tickInterval)
      setReels([finalSyms[0].char, finalSyms[1].char, finalSyms[2].char])
      setSpinClass([false, false, false])
      setSpinning(false)

      evaluateSpin(finalSyms)
    }, 2000)
  }

  const evaluateSpin = async (finalSyms) => {
    const sym1 = finalSyms[0]
    const sym2 = finalSyms[1]
    const sym3 = finalSyms[2]

    let multiplier = 0
    let winLabel = ''

    // 3 of a kind match
    if (sym1.char === sym2.char && sym2.char === sym3.char) {
      multiplier = sym1.payout3x
      winLabel = `Jackpot! 3x ${sym1.name}s`
    }
    // Cherries specific multipliers (Any 2 Cherries or 1 Cherry)
    else {
      const cherryCount = finalSyms.filter(s => s.char === '🍒').length
      if (cherryCount === 2) {
        multiplier = 2
        winLabel = '2x Cherries'
      } else if (cherryCount === 1) {
        multiplier = 1
        winLabel = '1x Cherry'
      }
    }

    if (multiplier > 0) {
      setHighlightWin(true)
      try {
        const res = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            bet_amount: betAmount,
            multiplier: multiplier
          })
        })
        const data = await res.json()
        if (data.success) {
          setMessage({
            type: 'success',
            text: `🎉 WIN! ${winLabel} (+₱${(betAmount * multiplier).toFixed(2)})`
          })
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to credit winnings.' })
      }
    } else {
      setMessage({
        type: 'error',
        text: '💥 No matches. Pull the lever to spin again!'
      })
    }

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
      background: 'linear-gradient(180deg, #10061e 0%, #03010b 100%)', // Sleek dark cyber neon background
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#150c26',
        border: '3px solid #ff007f', // Cyber Hot Pink neon border
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 0 30px rgba(255, 0, 127, 0.4)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Neon Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '900',
          color: '#00ffff', // Cyber Cyan neon
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: '0 0 15px rgba(0, 255, 255, 0.6)',
          marginBottom: '20px'
        }}>🍒 NEON SLOTS 777</h2>

        {/* Mini payout rates info chart */}
        <div style={{
          background: '#0a0514',
          border: '1px solid #ff007f',
          borderRadius: '8px',
          padding: '8px',
          fontSize: '9px',
          color: '#ccc',
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '20px'
        }}>
          <div>👑 Crown: 100x</div>
          <div>💎 Diamond: 50x</div>
          <div>⭐ Star: 30x</div>
          <div>🔔 Bell: 25x</div>
          <div>🍒 Cherry: 5x</div>
        </div>

        {/* Reels grid area */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          background: '#040208',
          border: highlightWin ? '3px solid #00ffff' : '3px solid #ff007f',
          borderRadius: '16px',
          padding: '28px 16px',
          marginBottom: '24px',
          boxShadow: highlightWin ? '0 0 25px rgba(0, 255, 255, 0.6)' : 'none',
          position: 'relative'
        }}>
          {/* Middle Winning Red Horizontal Pointer Payline */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '2px',
            background: 'rgba(255, 0, 127, 0.75)',
            boxShadow: '0 0 10px rgba(255, 0, 127, 0.9)',
            zIndex: 2,
            pointerEvents: 'none'
          }}></div>

          {reels.map((char, idx) => (
            <div key={idx} style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(to bottom, #1d0f36, #0e051d)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
              animation: spinClass[idx] ? 'spin-slow 0.15s linear infinite' : 'none',
              transition: 'transform 0.1s'
            }}>
              {char}
            </div>
          ))}
        </div>

        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(0,255,255,0.1)' : 'rgba(255,0,127,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,255,255,0.2)' : 'rgba(255,0,127,0.2)'}`,
            padding: '10px',
            borderRadius: '8px',
            color: message.type === 'success' ? '#00ffff' : '#ff007f',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            {message.text}
          </div>
        )}

        {/* Input stake control & Spin Trigger */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <button
              disabled={spinning}
              onClick={() => handleBetChange(betAmount - 10)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#300b4a', color: '#fff', border: '1px solid #ff007f', fontWeight: 'bold', cursor: 'pointer' }}
            >
              -
            </button>
            <div style={{
              flex: 1,
              background: '#040208',
              border: '1px solid #ff007f',
              borderRadius: '8px',
              color: '#fff',
              lineHeight: '34px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              ₱{betAmount}
            </div>
            <button
              disabled={spinning}
              onClick={() => handleBetChange(betAmount + 10)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#300b4a', color: '#fff', border: '1px solid #ff007f', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          <button
            onClick={spinSlots}
            disabled={spinning || processing}
            style={{
              flex: 1.2,
              background: 'linear-gradient(90deg, #ff007f 0%, #00ffff 100%)',
              color: '#000',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '950',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(255, 0, 127, 0.3)'
            }}
          >
            {spinning ? 'SPINNING...' : 'SPIN REELS'}
          </button>
        </div>
      </div>
    </div>
  )
}
