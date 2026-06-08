import React, { useState, useEffect } from 'react'

const SYMBOLS = {
  'WILD': { char: '🦅', name: 'Garuda Wild', val: 25, color: '#f5c242' },
  'RUBY': { char: '🔴', name: 'Ruby', val: 15, color: '#ff4444' },
  'EMERALD': { char: '🟢', name: 'Emerald', val: 10, color: '#00c851' },
  'SAPPHIRE': { char: '🔵', name: 'Sapphire', val: 6, color: '#33b5e5' },
  'A': { char: 'A', name: 'Ace', val: 3, color: '#ffbb00' },
  'K': { char: 'K', name: 'King', val: 2, color: '#ffbb00' },
  'Q': { char: 'Q', name: 'Queen', val: 1.5, color: '#fff' },
  'J': { char: 'J', name: 'Jack', val: 1, color: '#fff' }
}

const MULTIPLIERS = [1, 2, 3, 5, 15]

const PAYLINES = [
  { id: 0, coords: [[0, 0], [1, 0], [2, 0]], label: 'Top Row' },
  { id: 1, coords: [[0, 1], [1, 1], [2, 1]], label: 'Middle Row' },
  { id: 2, coords: [[0, 2], [1, 2], [2, 2]], label: 'Bottom Row' },
  { id: 3, coords: [[0, 0], [1, 1], [2, 2]], label: 'Diagonal Down' },
  { id: 4, coords: [[0, 2], [1, 1], [2, 0]], label: 'Diagonal Up' }
]

export default function FortuneGems({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState([
    ['A', 'A', 'A'],
    ['K', 'K', 'K'],
    ['Q', 'Q', 'Q']
  ]) // 3 columns x 3 rows symbols
  const [multiplierReel, setMultiplierReel] = useState([1, 2, 3]) // 4th column multipliers
  const [activeMultiplier, setActiveMultiplier] = useState(1)
  const [message, setMessage] = useState(null)
  
  // Visual Effects
  const [activePaylines, setActivePaylines] = useState([]) // indices of winning paylines
  const [spinState, setSpinState] = useState([false, false, false, false])

  const triggerSpin = async () => {
    if (spinning) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setMessage(null)
    setSpinning(true)
    setActivePaylines([])
    
    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()
    if (!data.success) {
      setSpinning(false)
      return setMessage({ type: 'error', text: data.error })
    }
    fetchWallet()

    // 1. Reel spin animation loop
    setSpinState([true, true, true, true])
    let timer = 0
    const interval = setInterval(() => {
      setReels(prev => {
        return prev.map((col, cIdx) => {
          if (!spinState[cIdx]) return col
          return col.map(() => {
            const keys = Object.keys(SYMBOLS)
            return keys[Math.floor(Math.random() * keys.length)]
          })
        })
      })
      setMultiplierReel(prev => {
        if (!spinState[3]) return prev
        return prev.map(() => MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)])
      })
      timer += 100
    }, 100)

    // Stop Reels sequentially
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setSpinState(prev => {
        const next = [...prev]
        next[i] = false
        return next
      })
    }

    clearInterval(interval)

    // 2. Generate final results
    const finalReels = []
    for (let c = 0; c < 3; c++) {
      const column = []
      for (let r = 0; r < 3; r++) {
        const rand = Math.random()
        let sym = 'A'
        if (rand < 0.08) sym = 'WILD'
        else if (rand < 0.18) sym = 'RUBY'
        else if (rand < 0.3) sym = 'EMERALD'
        else if (rand < 0.45) sym = 'SAPPHIRE'
        else {
          const keys = ['A', 'K', 'Q', 'J']
          sym = keys[Math.floor(Math.random() * keys.length)]
        }
        column.push(sym)
      }
      finalReels.push(column)
    }

    // Generate multiplier Reel
    const multCol = [
      MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)],
      MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)],
      MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]
    ]
    const centerMultiplier = multCol[1] // The active multiplier is the middle position on Reel 4

    setReels(finalReels)
    setMultiplierReel(multCol)
    setActiveMultiplier(centerMultiplier)
    setSpinning(false)

    // 3. Evaluate payouts
    evaluateWin(finalReels, centerMultiplier)
  }

  const evaluateWin = async (grid, centerMult) => {
    let winPayout = 0
    const winningLines = []

    PAYLINES.forEach(line => {
      const [[c0, r0], [c1, r1], [c2, r2]] = line.coords
      const s0 = grid[c0][r0]
      const s1 = grid[c1][r1]
      const s2 = grid[c2][r2]

      // Check if all 3 match or contain WILDs
      const uniqueNonWild = new Set([s0, s1, s2])
      uniqueNonWild.delete('WILD')

      if (uniqueNonWild.size === 0) {
        // All WILDs! Garuda Jackpot!
        winPayout += SYMBOLS['WILD'].val
        winningLines.push(line.id)
      } else if (uniqueNonWild.size === 1) {
        // 3 matching symbols (or matching + WILDs)
        const targetSym = Array.from(uniqueNonWild)[0]
        winPayout += SYMBOLS[targetSym].val
        winningLines.push(line.id)
      }
    })

    if (winningLines.length > 0) {
      setActivePaylines(winningLines)
      const finalWin = winPayout * betAmount * centerMult * 0.15 // Scale win

      if (finalWin > 0) {
        await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier: (finalWin / betAmount) })
        })
        fetchWallet()
        setMessage({ type: 'success', text: `🎉 WINNER! Landed ${winningLines.length} payline(s) x${centerMult} Multiplier! +₱${finalWin.toFixed(2)}` })
      }
    } else {
      setMessage({ type: 'error', text: '😭 No match. Try again!' })
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
      background: 'linear-gradient(180deg, #021a0d 0%, #000c05 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      {/* Title */}
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00ff88, #00e5ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px',
        textShadow: '0 2px 10px rgba(0,255,136,0.2)'
      }}>
        FORTUNE GEMS
      </h2>

      {/* Main Reels Grid with 4th Multiplier Reel */}
      <div style={{
        background: '#0a0d14',
        border: '3px solid #00ff88',
        borderRadius: '16px',
        padding: '10px',
        boxShadow: '0 8px 30px rgba(0, 230, 118, 0.15)',
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '4/3',
        display: 'flex',
        gap: '8px',
        position: 'relative'
      }}>
        {/* Draw Payline overlay lines if winning */}
        {activePaylines.includes(0) && <div style={{ position: 'absolute', left: 0, right: '25%', top: '22%', height: '3px', background: '#00ff88', boxShadow: '0 0 10px #00ff88', zIndex: 10 }} />}
        {activePaylines.includes(1) && <div style={{ position: 'absolute', left: 0, right: '25%', top: '50%', height: '3px', background: '#00ff88', boxShadow: '0 0 10px #00ff88', zIndex: 10 }} />}
        {activePaylines.includes(2) && <div style={{ position: 'absolute', left: 0, right: '25%', top: '78%', height: '3px', background: '#00ff88', boxShadow: '0 0 10px #00ff88', zIndex: 10 }} />}
        
        {/* Diagonal Down */}
        {activePaylines.includes(3) && (
          <div style={{ 
            position: 'absolute', 
            left: 0, 
            right: '25%', 
            top: '50%', 
            height: '3px', 
            background: '#00ff88', 
            boxShadow: '0 0 10px #00ff88', 
            transform: 'rotate(24deg)', 
            transformOrigin: 'center', 
            zIndex: 10 
          }} />
        )}
        {/* Diagonal Up */}
        {activePaylines.includes(4) && (
          <div style={{ 
            position: 'absolute', 
            left: 0, 
            right: '25%', 
            top: '50%', 
            height: '3px', 
            background: '#00ff88', 
            boxShadow: '0 0 10px #00ff88', 
            transform: 'rotate(-24deg)', 
            transformOrigin: 'center', 
            zIndex: 10 
          }} />
        )}

        {/* Reels 1, 2, 3 (Symbols) */}
        {reels.map((column, colIdx) => (
          <div key={colIdx} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {column.map((symKey, rowIdx) => {
              const sym = SYMBOLS[symKey]
              const isSpinning = spinState[colIdx]

              return (
                <div 
                  key={rowIdx} 
                  style={{
                    flex: 1,
                    background: '#151b27',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
                    transition: 'all 0.15s'
                  }}
                  className={isSpinning ? 'reel-blur' : ''}
                >
                  <span style={{
                    color: sym?.color || '#fff',
                    textShadow: symKey === 'WILD' ? '0 0 10px rgba(245, 194, 66, 0.5)' : 'none'
                  }}>
                    {sym?.char || symKey}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        {/* Divider for 4th reel */}
        <div style={{
          width: '2px',
          background: 'rgba(0, 230, 118, 0.4)',
          boxShadow: '0 0 8px #00ff88',
          margin: '0 2px'
        }} />

        {/* Reel 4 (Multiplier Reel) */}
        <div style={{
          width: '25%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {multiplierReel.map((mult, rowIdx) => {
            const isSpinning = spinState[3]
            const isCenter = rowIdx === 1 // środkowa pozycja to aktywny mnożnik

            return (
              <div 
                key={rowIdx} 
                style={{
                  flex: 1,
                  background: isCenter ? 'linear-gradient(135deg, #2b3040 0%, #151b27 100%)' : '#10141e',
                  border: isCenter ? '2px solid var(--accent)' : '1px solid #222',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: isCenter ? 'var(--accent)' : 'var(--muted)',
                  boxShadow: isCenter ? '0 0 10px rgba(245, 194, 66, 0.3)' : 'none',
                  transition: 'all 0.15s'
                }}
                className={isSpinning ? 'reel-blur' : ''}
              >
                x{mult}
              </div>
            )
          })}
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '12px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
          maxWidth: '360px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Control panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '400px',
        marginTop: '16px',
        background: 'rgba(0,0,0,0.5)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        {/* Bet selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt} 
              className="btn" 
              onClick={() => setBetAmount(amt)}
              disabled={spinning}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                background: betAmount === amt ? 'var(--accent)' : '#000',
                color: betAmount === amt ? '#000' : '#fff',
                borderColor: betAmount === amt ? 'var(--accent)' : '#333'
              }}
            >
              ₱{amt}
            </button>
          ))}
        </div>

        {/* Spin trigger */}
        <button 
          className="btn primary"
          onClick={triggerSpin}
          disabled={spinning}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '1px'
          }}
        >
          {spinning ? 'SPINNING...' : `SPIN - ₱${betAmount}`}
        </button>
      </div>
    </div>
  )
}
