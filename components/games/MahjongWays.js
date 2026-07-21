import React, { useState, useEffect } from 'react'

const MAHJONG_SYMBOLS = [
  { char: '发', name: 'Green Dragon', color: '#00e676', payout: 5 },
  { char: '中', name: 'Red Dragon', color: '#ff1744', payout: 4 },
  { char: '白', name: 'White Dragon', color: '#ffffff', payout: 3.5 },
  { char: '🀐', name: 'Bamboo 1', color: '#29b6f6', payout: 2 },
  { char: '🀙', name: 'Dot 1', color: '#ab47bc', payout: 1.5 },
  { char: '伍', name: 'Character 5', color: '#ffca28', payout: 1 },
  { char: '九', name: 'Character 9', color: '#ff7043', payout: 0.8 }
]

const MULTIPLIERS = [1, 2, 3, 5]

export default function MahjongWays({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [grid, setGrid] = useState([])
  const [cascadeStep, setCascadeStep] = useState(0) // multiplier index
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [winningIndexes, setWinningIndexes] = useState([])
  const [showBigWin, setShowBigWin] = useState(false)
  const [winAmountText, setWinAmountText] = useState('')

  // Initialize a random grid (5 columns, 4 rows)
  const generateRandomGrid = () => {
    const newGrid = []
    for (let c = 0; c < 5; c++) {
      const col = []
      for (let r = 0; r < 4; r++) {
        col.push(MAHJONG_SYMBOLS[Math.floor(Math.random() * MAHJONG_SYMBOLS.length)])
      }
      newGrid.push(col)
    }
    return newGrid
  }

  useEffect(() => {
    setGrid(generateRandomGrid())
  }, [])

  const spin = async () => {
    if (spinning || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setSpinning(true)
    setMessage(null)
    setWinningIndexes([])
    setShowBigWin(false)
    setCascadeStep(0)

    // 1. Deduct bet from wallet
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
    } catch (err) {
      setSpinning(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    // 2. Spin animation: tick randomize
    let ticks = 0
    const interval = setInterval(() => {
      setGrid(generateRandomGrid())
      ticks++
      if (ticks > 12) {
        clearInterval(interval)
        
        // Final spin stop
        const finalGrid = generateRandomGrid()
        setGrid(finalGrid)
        setSpinning(false)
        
        // Check wins
        evaluateGrid(finalGrid, 0, 0)
      }
    }, 90)
  }

  // Recursive cascade wins evaluation
  const evaluateGrid = async (currentGrid, stepIndex, accumulatedWin) => {
    // Look for matching symbols on adjacent reels (columns) starting from column 0
    // Simple way calculation: match identical symbols appearing in consecutive columns
    const matchedSymbols = []
    const winsMap = [] // list of grid positions { col, row }

    // Group symbols by column
    MAHJONG_SYMBOLS.forEach(symbol => {
      let colMatches = []
      for (let c = 0; c < 5; c++) {
        let rowsMatched = []
        for (let r = 0; r < 4; r++) {
          if (currentGrid[c][r].char === symbol.char) {
            rowsMatched.push(r)
          }
        }
        if (rowsMatched.length > 0) {
          colMatches.push({ col: c, rows: rowsMatched })
        } else {
          break; // must be consecutive from left to right
        }
      }

      // We need at least 3 consecutive columns for a win
      if (colMatches.length >= 3) {
        matchedSymbols.push({ symbol, colMatches })
      }
    })

    if (matchedSymbols.length > 0) {
      // Calculate win values
      let currentPayout = 0
      const winCoordinates = []

      matchedSymbols.forEach(({ symbol, colMatches }) => {
        // Ways to win: product of matching row counts per column
        let ways = 1
        colMatches.forEach(match => {
          ways *= match.rows.length
          match.rows.forEach(r => {
            winCoordinates.push(`${match.col}-${r}`)
          })
        })

        const basePayout = symbol.payout * (colMatches.length * 0.5)
        currentPayout += basePayout * ways * betAmount * 0.1
      })

      // Apply multiplier
      const activeMult = MULTIPLIERS[Math.min(stepIndex, MULTIPLIERS.length - 1)]
      const finalRoundWin = currentPayout * activeMult
      const nextAccumulatedWin = accumulatedWin + finalRoundWin

      // Highlight winning coordinates
      setWinningIndexes(winCoordinates)
      setCascadeStep(stepIndex)

      await new Promise(r => setTimeout(r, 1000))

      // Trigger tile drop cascade animation: replace winning coordinates with new random tiles
      const nextGrid = currentGrid.map((col, c) => {
        return col.map((cell, r) => {
          if (winCoordinates.includes(`${c}-${r}`)) {
            // Drop a new random tile
            return MAHJONG_SYMBOLS[Math.floor(Math.random() * MAHJONG_SYMBOLS.length)]
          }
          return cell
        })
      })

      setGrid(nextGrid)
      setWinningIndexes([])

      // Evaluate again recursively (Cascade 2)
      evaluateGrid(nextGrid, stepIndex + 1, nextAccumulatedWin)
    } else {
      // No more wins in this round. Payout total accumulated wins.
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
            setWinAmountText(`₱${accumulatedWin.toFixed(2)} (${totalMultiplier}x)`)
            if (totalMultiplier >= 10) {
              setShowBigWin(true)
            } else {
              setMessage({
                type: 'success',
                text: `🎉 WIN! Total Cascade payout: +₱${accumulatedWin.toFixed(2)}`
              })
            }
          }
        } catch (e) {
          setMessage({ type: 'error', text: 'Payout error.' })
        }
      } else {
        setMessage({
          type: 'error',
          text: '💥 No wins. Try another spin!'
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
      background: 'linear-gradient(135deg, #0f2519 0%, #030a06 100%)', // Deep emerald Chinese theme
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Big Win Popups */}
      {showBigWin && (
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
            background: 'linear-gradient(135deg, #d84315 0%, #ff8f00 100%)',
            border: '4px solid #ffd700',
            borderRadius: '24px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: '0 0 40px #ffd700',
            maxWidth: '320px',
            animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <h1 style={{ fontSize: '36px', color: '#ffd700', margin: '0 0 8px', textShadow: '0 2px 10px #000', fontWeight: '950', fontStyle: 'italic' }}>MEGA WIN!</h1>
            <p style={{ color: '#fff', fontSize: '13px', margin: '0 0 20px', fontWeight: 'bold' }}>CONGRATULATIONS!</p>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', textShadow: '0 2px 5px #000', marginBottom: '24px' }}>{winAmountText}</div>
            <button className="btn primary" onClick={() => setShowBigWin(false)} style={{ width: '80%' }}>COLLECT</button>
          </div>
        </div>
      )}

      {/* Main Board Cabinet */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '3px solid #ffca28', // Golden imperial border
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(255, 202, 40, 0.25)',
        textAlign: 'center'
      }}>
        {/* Header Title */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffd700',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          margin: '0 0 14px'
        }}>🀄 MAHJONG WAYS 2</h2>

        {/* Multipliers status display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#04140a',
          border: '1px solid #ffca28',
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '16px'
        }}>
          {MULTIPLIERS.map((mult, idx) => {
            const isActive = cascadeStep === idx
            return (
              <span key={idx} style={{
                color: isActive ? '#000' : '#ffca28',
                background: isActive ? '#ffca28' : 'transparent',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 10px #ffca28' : 'none'
              }}>
                {mult}x
              </span>
            )
          })}
        </div>

        {/* 5-Reel Ivory Grid */}
        <div style={{
          background: 'radial-gradient(circle, #0e301e 0%, #030e08 100%)',
          border: '2px solid #004d40',
          borderRadius: '16px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          minHeight: '260px'
        }}>
          {grid.map((column, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {column.map((cell, rowIdx) => {
                const coord = `${colIdx}-${rowIdx}`
                const isWinning = winningIndexes.includes(coord)

                return (
                  <div
                    key={rowIdx}
                    style={{
                      flex: 1,
                      background: isWinning ? '#ffe082' : 'linear-gradient(135deg, #ffffff 0%, #eceff1 100%)',
                      borderBottom: '5px solid #b0bec5',
                      borderLeft: '4px solid #cfd8dc',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: cell.color,
                      textShadow: cell.color === '#ffffff' ? '1px 1px 2px #000' : 'none',
                      boxShadow: isWinning 
                        ? '0 0 15px #ffd700, inset 0 0 8px rgba(255,202,40,0.5)' 
                        : '0 4px 6px rgba(0,0,0,0.3)',
                      transform: isWinning ? 'scale(0.95)' : 'none',
                      transition: 'all 0.25s',
                      userSelect: 'none',
                      minHeight: '52px'
                    }}
                  >
                    <span style={{ transform: 'translateY(-2px)' }}>
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

        {/* Stake Adjustment & Spin Panel */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <button
              disabled={spinning}
              onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#092515', color: '#ffca28', border: '1px solid #ffca28', fontWeight: 'bold', cursor: 'pointer' }}
            >
              -
            </button>
            <div style={{
              flex: 1,
              background: '#041008',
              border: '1px solid #ffca28',
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
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#092515', color: '#ffca28', border: '1px solid #ffca28', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          <button
            onClick={spin}
            disabled={spinning || processing}
            style={{
              flex: 1.2,
              background: 'linear-gradient(90deg, #ffea00 0%, #ff8f00 100%)',
              color: '#000',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '950',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(255, 202, 40, 0.4)'
            }}
          >
            {spinning ? 'FALLING...' : 'SPIN TILES'}
          </button>
        </div>
      </div>
    </div>
  )
}
