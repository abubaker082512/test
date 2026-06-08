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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #09100d 0%, #030504 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }} className="matrix-bg">
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00e676, #00ff88)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px',
        textShadow: '0 2px 12px rgba(0, 230, 118, 0.25)'
      }}>
        CYBER MINES
      </h2>

      {active && (
        <div style={{ 
          fontSize: '16px', 
          color: 'var(--success)', 
          fontWeight: 'bold',
          marginBottom: '12px',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(0,230,118,0.3)'
        }}>
          MULTIPLIER: {multiplier}x [₱{(betAmount * multiplier).toFixed(2)}]
        </div>
      )}
      
      {/* 5x5 Cyber Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '8px', 
        background: '#070a0e', 
        padding: '14px', 
        borderRadius: '16px', 
        border: '1px solid rgba(0, 230, 118, 0.2)',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
      }}>
        {grid.map((cell, i) => {
          const isExploded = explodingIndex === i
          const isRevealed = cell === '💎'
          
          return (
            <div 
              key={i} 
              onClick={() => reveal(i)} 
              style={{ 
                width: '52px', 
                height: '52px', 
                background: isExploded ? '#ff174415' : isRevealed ? '#00e67615' : '#0a0d14', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '24px', 
                cursor: active ? 'pointer' : 'default', 
                borderRadius: '10px', 
                border: isExploded ? '2px solid #ff1744' : isRevealed ? '2px solid #00e676' : '1px solid var(--border)', 
                transition: 'all 0.2s',
                boxShadow: isExploded ? '0 0 15px rgba(255, 23, 68, 0.4)' : isRevealed ? '0 0 15px rgba(0, 230, 118, 0.4)' : 'none'
              }}
            >
              {cell}
            </div>
          )
        })}
      </div>

      {message && (
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '8px', 
          fontSize: '12px', 
          marginTop: '16px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)', 
          color: message.type === 'error' ? '#ff6666' : '#00ff88', 
          border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
          maxWidth: '320px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Action controls */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '10px', 
        width: '100%', 
        maxWidth: '300px',
        marginTop: '16px' 
      }}>
        {!active ? (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[10, 50, 100, 500].map(amt => (
                <button 
                  key={amt} 
                  className="btn" 
                  onClick={() => setBetAmount(amt)}
                  disabled={processing}
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
            <button 
              className="btn primary" 
              onClick={startGame} 
              style={{ padding: '14px', fontWeight: 'bold' }} 
              disabled={processing}
            >
              {processing ? 'PREPARING GRID...' : `BET ₱${betAmount}`}
            </button>
          </>
        ) : (
          <button 
            className="btn primary" 
            onClick={cashOut} 
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #00e676 0%, #00c851 100%)', 
              color: '#000', 
              fontWeight: '900',
              boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)'
            }} 
            disabled={processing}
          >
            {processing ? 'COLLECTING...' : `SAFE CASH OUT — ₱${(betAmount * multiplier).toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}
