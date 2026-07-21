import React, { useState, useEffect } from 'react'

const WESTERN_SYMBOLS = [
  { char: '🔫', name: 'Revolver', payout: 6, color: '#e0e0e0' },
  { char: '🤠', name: 'Cowboy', payout: 5, color: '#ffb74d' },
  { char: '💰', name: 'Gold Bag', payout: 4, color: '#ffd54f' },
  { char: '⭐', name: 'Sheriff Badge', payout: 3, color: '#ffea00' },
  { char: '🥃', name: 'Whiskey', payout: 1.5, color: '#ffcc80' },
  { char: '🌵', name: 'Cactus', payout: 1, color: '#81c784' }
]

const MULTIPLIERS = [1, 2, 4, 8]

export default function WildBounty({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [grid, setGrid] = useState([])
  const [goldenFrames, setGoldenFrames] = useState([]) // coordinates e.g. "col-row"
  const [winningIndexes, setWinningIndexes] = useState([])
  const [multiplierIdx, setMultiplierIdx] = useState(0)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showPayoutOverlay, setShowPayoutOverlay] = useState(false)
  const [payoutVal, setPayoutVal] = useState(0)

  // Initialize random grid
  const generateRandomGrid = () => {
    const newGrid = []
    for (let c = 0; c < 5; c++) {
      const col = []
      for (let r = 0; r < 3; r++) {
        col.push(WESTERN_SYMBOLS[Math.floor(Math.random() * WESTERN_SYMBOLS.length)])
      }
      newGrid.push(col)
    }
    return newGrid
  }

  // Generate random golden frames
  const generateGoldenFrames = () => {
    const coords = []
    while (coords.length < 3) {
      const col = Math.floor(Math.random() * 5)
      const row = Math.floor(Math.random() * 3)
      const format = `${col}-${row}`
      if (!coords.includes(format)) coords.push(format)
    }
    return coords
  }

  useEffect(() => {
    setGrid(generateRandomGrid())
    setGoldenFrames(generateGoldenFrames())
  }, [])

  const spinReels = async () => {
    if (spinning || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setSpinning(true)
    setMessage(null)
    setWinningIndexes([])
    setShowPayoutOverlay(false)
    setMultiplierIdx(0)
    
    // 1. Submit bet to server
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

    // 2. Spin animation ticks
    let ticks = 0
    const interval = setInterval(() => {
      setGrid(generateRandomGrid())
      ticks++
      if (ticks > 12) {
        clearInterval(interval)
        
        const finalGrid = generateRandomGrid()
        const finalFrames = generateGoldenFrames()
        setGrid(finalGrid)
        setGoldenFrames(finalFrames)
        setSpinning(false)

        evaluateRound(finalGrid, finalFrames, 0, 0)
      }
    }, 90)
  }

  const evaluateRound = async (currentGrid, currentFrames, stepIndex, accumulatedWin) => {
    // Simple payline verification: matching symbols in consecutive columns starting left
    const winsMap = []
    const winCoordinates = []
    let roundPayout = 0

    WESTERN_SYMBOLS.forEach(symbol => {
      let colMatches = []
      for (let c = 0; c < 5; c++) {
        let rows = []
        for (let r = 0; r < 3; r++) {
          if (currentGrid[c][r].char === symbol.char) {
            rows.push(r)
          }
        }
        if (rows.length > 0) {
          colMatches.push({ col: c, rows })
        } else {
          break; // consecutive constraint
        }
      }

      if (colMatches.length >= 3) {
        let ways = 1
        colMatches.forEach(match => {
          ways *= match.rows.length
          match.rows.forEach(r => {
            winCoordinates.push(`${match.col}-${r}`)
          })
        })

        const baseVal = symbol.payout * (colMatches.length * 0.6)
        roundPayout += baseVal * ways * betAmount * 0.12
      }
    })

    if (roundPayout > 0) {
      // Golden frame transforms into WILD
      const activeMult = MULTIPLIERS[Math.min(stepIndex, MULTIPLIERS.length - 1)]
      const finalRoundWin = roundPayout * activeMult
      const nextAccumulatedWin = accumulatedWin + finalRoundWin

      setWinningIndexes(winCoordinates)
      setMultiplierIdx(stepIndex)

      await new Promise(r => setTimeout(r, 1000))

      // Cascade drop new items
      const nextGrid = currentGrid.map((col, c) => {
        return col.map((cell, r) => {
          const coord = `${c}-${r}`
          if (winCoordinates.includes(coord)) {
            // If the cell was within a Golden Frame, it returns a Wild symbol (represented as Sheriff Badge for high payout)
            if (currentFrames.includes(coord)) {
              return WESTERN_SYMBOLS[3] // Sheriff Badge Wild
            }
            return WESTERN_SYMBOLS[Math.floor(Math.random() * WESTERN_SYMBOLS.length)]
          }
          return cell
        })
      })

      setGrid(nextGrid)
      setWinningIndexes([])

      // Continue cascade shootout
      evaluateRound(nextGrid, currentFrames, stepIndex + 1, nextAccumulatedWin)
    } else {
      // Settle wagers
      if (accumulatedWin > 0) {
        const totalMultiplier = parseFloat((accumulatedWin / betAmount).toFixed(2))

        try {
          const res = await fetch('/api/wallet/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              bet_amount: betAmount,
              multiplier: totalMultiplier
            })
          })
          const data = await res.json()
          if (data.success) {
            setPayoutVal(accumulatedWin)
            setShowPayoutOverlay(true)
          }
        } catch (e) {
          setMessage({ type: 'error', text: 'Payout error.' })
        }
      } else {
        setMessage({
          type: 'error',
          text: '💥 Outlaw wins. Pull trigger to shoot again!'
        })
      }
      setProcessing(false)
      fetchWallet()
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
      background: 'linear-gradient(135deg, #3e2723 0%, #1b0d0a 100%)', // Western wood saloon color
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Payout celebration modal */}
      {showPayoutOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.3s'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff8f00 0%, #ff6f00 100%)',
            border: '4px solid #ffd700',
            borderRadius: '24px',
            padding: '30px 20px',
            textAlign: 'center',
            boxShadow: '0 0 35px rgba(255,143,0,0.6)',
            maxWidth: '300px',
            animation: 'scaleUp 0.3s'
          }}>
            <h2 style={{ color: '#ffd700', margin: '0 0 10px', fontSize: '28px', fontStyle: 'italic', fontWeight: '950', textShadow: '0 2px 5px #000' }}>🤠 BOUNTY WON!</h2>
            <div style={{ fontSize: '28px', color: '#fff', fontWeight: '900', textShadow: '0 2px 5px #000', marginBottom: '20px' }}>
              +₱{payoutVal.toFixed(2)}
            </div>
            <button className="btn primary" onClick={() => setShowPayoutOverlay(false)} style={{ width: '80%' }}>COLLECT GOLD</button>
          </div>
        </div>
      )}

      {/* Main Board */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#2d1a15',
        border: '3px solid #d84315', // Rust/Western boundary
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(216, 67, 21, 0.3)',
        textAlign: 'center'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffb74d',
          letterSpacing: '1.5px',
          textShadow: '0 2px 10px #000',
          margin: '0 0 14px'
        }}>🤠 WILD BOUNTY SHOWDOWN</h2>

        {/* Multipliers - Styled like revolver cylinder chambers */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {MULTIPLIERS.map((mult, idx) => {
            const isActive = multiplierIdx === idx
            return (
              <div key={idx} style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: isActive ? '#ffca28' : '#1b0d0a',
                border: '2px solid #d84315',
                color: isActive ? '#000' : '#ffb74d',
                fontWeight: '900',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 0 10px #ffca28' : 'none',
                transition: 'all 0.3s'
              }}>
                {mult}x
              </div>
            )
          })}
        </div>

        {/* 5x3 saloon wood grids */}
        <div style={{
          background: 'linear-gradient(to bottom, #190a07 0%, #0e0503 100%)',
          border: '2px solid #5d4037',
          borderRadius: '16px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          minHeight: '210px'
        }}>
          {grid.map((column, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {column.map((cell, rowIdx) => {
                const coord = `${colIdx}-${rowIdx}`
                const isWinning = winningIndexes.includes(coord)
                const isGolden = goldenFrames.includes(coord)

                return (
                  <div
                    key={rowIdx}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)',
                      border: isGolden ? '2px solid #ffea00' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      boxShadow: isWinning 
                        ? '0 0 12px #ff1744, inset 0 0 10px #000' 
                        : (isGolden ? '0 0 10px rgba(255,234,0,0.5)' : '0 4px 6px rgba(0,0,0,0.4)'),
                      transform: isWinning ? 'scale(0.92)' : 'none',
                      transition: 'all 0.25s',
                      userSelect: 'none',
                      position: 'relative',
                      minHeight: '52px'
                    }}
                  >
                    {/* Bullet hole representation when hit */}
                    {isWinning && (
                      <div style={{
                        position: 'absolute',
                        width: '18px',
                        height: '18px',
                        background: 'radial-gradient(circle, #212121 20%, #424242 60%, transparent 90%)',
                        border: '1px solid #757575',
                        borderRadius: '50%',
                        zIndex: 2
                      }}></div>
                    )}
                    <span style={{ filter: isWinning ? 'blur(0.5px)' : 'none', zIndex: 1 }}>
                      {cell.char}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
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
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <button
              disabled={spinning}
              onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#3e2723', color: '#ffca28', border: '1px solid #d84315', fontWeight: 'bold', cursor: 'pointer' }}
            >
              -
            </button>
            <div style={{
              flex: 1,
              background: '#1b0d0a',
              border: '1px solid #d84315',
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
              onClick={() => setBetAmount(betAmount + 10)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#3e2723', color: '#ffca28', border: '1px solid #d84315', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          <button
            onClick={spinReels}
            disabled={spinning || processing}
            style={{
              flex: 1.2,
              background: 'linear-gradient(90deg, #ff7043 0%, #ff5722 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '950',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(216, 67, 21, 0.4)'
            }}
          >
            {spinning ? 'SHOOTING...' : 'PULL TRIGGER'}
          </button>
        </div>
      </div>
    </div>
  )
}
