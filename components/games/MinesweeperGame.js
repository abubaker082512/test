import React, { useState, useEffect } from 'react'

export default function MinesweeperGame({ user, wallet, fetchWallet }) {
  const [grid, setGrid] = useState(Array(25).fill('❓'))
  const [bombs, setBombs] = useState([])
  const [active, setActive] = useState(false)
  const [betAmount, setBetAmount] = useState(10)
  const [multiplier, setMultiplier] = useState(1.0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Custom states for styling & reveal tumbles
  const [explodingIndex, setExplodingIndex] = useState(null)

  const startGame = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setProcessing(true)
    setMessage(null)
    setExplodingIndex(null)

    // Deduct bet
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

    // Set 4 random bomb positions out of 25
    const positions = []
    while (positions.length < 4) {
      const idx = Math.floor(Math.random() * 25)
      if (!positions.includes(idx)) positions.push(idx)
    }

    setBombs(positions)
    setGrid(Array(25).fill('❓'))
    setMultiplier(1.0)
    setRevealedCount(0)
    setActive(true)
    setProcessing(false)
    fetchWallet()
  }

  const reveal = (idx) => {
    if (!active || grid[idx] !== '❓' || processing) return
    
    const isBomb = bombs.includes(idx)
    const newGrid = [...grid]
    
    if (isBomb) {
      setExplodingIndex(idx)
      newGrid[idx] = '💥'
      
      // Reveal all bombs
      bombs.forEach(b => { 
        if (b !== idx) newGrid[b] = '💣' 
      })
      
      setGrid(newGrid)
      setActive(false)
      setMessage({ type: 'error', text: '💥 BOOM! Struck a cyber mine. Lost bet!' })
      fetchWallet()
    } else {
      newGrid[idx] = '💎'
      setGrid(newGrid)
      
      const newCount = revealedCount + 1
      setRevealedCount(newCount)
      
      // Multiplier increases exponentially
      let nextMult = 1.2
      if (newCount === 2) nextMult = 1.5
      else if (newCount === 3) nextMult = 2.0
      else if (newCount === 4) nextMult = 3.0
      else if (newCount === 5) nextMult = 5.0
      else if (newCount > 5) nextMult = parseFloat((5.0 + (newCount - 5) * 1.5).toFixed(1))
      
      setMultiplier(nextMult)
    }
  }

  const cashOut = async () => {
    if (!active || processing) return
    setProcessing(true)

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
      setActive(false)
      setMessage({ type: 'success', text: `💰 Cashed Out Safely! +₱${(betAmount * multiplier).toFixed(2)} (${multiplier}x)` })
    }
    setProcessing(false)
    fetchWallet()
  }

  return (
    <div className="game-screen-wrapper">
      <div className="game-glass-panel" style={{ border: '1px solid rgba(0, 230, 118, 0.3)' }}>
        <h2 className="game-title-neon" style={{
          color: '#00e676',
          textShadow: '0 0 15px rgba(0, 230, 118, 0.6), 0 2px 4px #000'
        }}>
          💣 CYBER MINES
        </h2>

        {active && (
          <div style={{ 
            fontSize: '14px', 
            color: '#00e676', 
            fontWeight: '900', 
            background: 'rgba(0,230,118,0.1)', 
            padding: '8px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '1px solid rgba(0,230,118,0.2)'
          }}>
            Multiplier: {multiplier}x | Gems Found: {revealedCount}/21
          </div>
        )}
        
        {/* 5x5 Cyber Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '8px', 
          background: 'rgba(0,0,0,0.6)', 
          padding: '16px', 
          borderRadius: '16px', 
          border: '1px solid rgba(0, 230, 118, 0.15)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
          justifyItems: 'center',
          marginBottom: '20px'
        }}>
          {grid.map((cell, i) => {
            const isExploded = explodingIndex === i
            const isRevealed = cell === '💎'
            
            return (
              <div 
                key={i} 
                onClick={() => reveal(i)} 
                style={{ 
                  width: '54px', 
                  height: '54px', 
                  background: isExploded 
                    ? 'linear-gradient(135deg, #ff1744 0%, #b71c1c 100%)' 
                    : isRevealed 
                      ? 'linear-gradient(135deg, #00e676 0%, #00a152 100%)' 
                      : 'linear-gradient(135deg, #131b26 0%, #080c10 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '26px', 
                  cursor: active ? 'pointer' : 'default', 
                  borderRadius: '10px', 
                  border: isExploded ? '2px solid #fff' : isRevealed ? '2px solid #fff' : '1px solid rgba(255,255,255,0.06)', 
                  transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: isExploded 
                    ? '0 0 15px #ff1744, 0 4px 6px rgba(0,0,0,0.4)' 
                    : isRevealed 
                      ? '0 0 15px #00e676, 0 4px 6px rgba(0,0,0,0.4)' 
                      : '0 4px 6px rgba(0,0,0,0.3)',
                  transform: (isExploded || isRevealed) ? 'scale(0.92)' : 'none',
                  userSelect: 'none'
                }}
              >
                {cell}
              </div>
            )
          })}
        </div>

        {message && (
          <div style={{ 
            padding: '10px 16px', 
            borderRadius: '8px', 
            fontSize: '12px', 
            marginBottom: '16px',
            background: message.type === 'error' ? 'rgba(255, 23, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)', 
            color: message.type === 'error' ? '#ff1744' : '#00e676', 
            border: `1px solid ${message.type === 'error' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 230, 118, 0.2)'}`,
            fontWeight: 'bold'
          }}>
            {message.text}
          </div>
        )}

        {/* Action controls */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px', 
          width: '100%'
        }}>
          {!active ? (
            <>
              {/* Chip selectors */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '4px' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button 
                    key={amt} 
                    className={`premium-chip-btn ${betAmount === amt ? 'active' : ''}`}
                    onClick={() => setBetAmount(amt)}
                    disabled={processing}
                    style={{
                      background: betAmount === amt 
                        ? 'linear-gradient(135deg, #00e676 0%, #00a152 100%)' 
                        : 'linear-gradient(135deg, #131b26 0%, #080c10 100%)',
                      border: betAmount === amt ? '2px solid #ffea00' : '2.5px dashed rgba(255,255,255,0.2)'
                    }}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
              <button 
                className="game-btn-primary" 
                onClick={startGame} 
                style={{
                  background: 'linear-gradient(90deg, #00e676 0%, #00a152 100%)',
                  boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)'
                }}
                disabled={processing}
              >
                {processing ? 'PREPARING GRID...' : `PLACE BET: ₱${betAmount}`}
              </button>
            </>
          ) : (
            <button 
              className="game-btn-primary" 
              onClick={cashOut} 
              style={{ 
                background: 'linear-gradient(90deg, #ffea00 0%, #ff8f00 100%)',
                boxShadow: '0 4px 20px rgba(255, 234, 0, 0.4)'
              }} 
              disabled={processing}
            >
              {processing ? 'COLLECTING...' : `SAFE CASH OUT — ₱${(betAmount * multiplier).toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
