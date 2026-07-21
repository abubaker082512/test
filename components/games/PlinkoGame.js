import React, { useState, useEffect, useRef } from 'react'

const MULTIPLIERS_CONFIG = {
  Low: {
    8: [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
    10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    12: [10, 5.0, 2.0, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 2.0, 5.0, 10]
  },
  Medium: {
    8: [13, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13],
    10: [22, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22],
    12: [33, 11, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11, 33]
  },
  High: {
    8: [29, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29],
    10: [76, 10, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10, 76],
    12: [170, 33, 11, 4.0, 1.1, 0.3, 0.2, 0.3, 1.1, 4.0, 11, 33, 170]
  }
}

const COLORS = ['#FF1744', '#FF9100', '#FFEA00', '#00E676', '#00E5FF', '#00E676', '#FFEA00', '#FF9100', '#FF1744']

export default function PlinkoGame({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [betAmount, setBetAmount] = useState(10)
  const [rows, setRows] = useState(8) // 8, 10, 12
  const [risk, setRisk] = useState('Medium') // 'Low' | 'Medium' | 'High'
  const [dropping, setDropping] = useState(false)
  const [message, setMessage] = useState(null)

  const activeMultipliers = MULTIPLIERS_CONFIG[risk][rows]

  // Board Peg coordinates
  const pegRadius = 3.5
  const ballRadius = 5.5
  const width = 360
  const height = 380

  // State to track peg hits for flash animations
  const [litPegs, setLitPegs] = useState({}) // key: 'row-col', val: timestamp

  // Draw board background and static elements
  const drawBoard = (ctx) => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0f1118'
    ctx.fillRect(0, 0, width, height)

    // Draw slots at bottom
    const slotWidth = width / activeMultipliers.length
    for (let i = 0; i < activeMultipliers.length; i++) {
      const x = i * slotWidth
      // Gradient slots
      ctx.fillStyle = COLORS[i % COLORS.length] + '12'
      ctx.fillRect(x, height - 35, slotWidth, 35)

      // Borders
      ctx.strokeStyle = '#232a3f'
      ctx.strokeRect(x, height - 35, slotWidth, 35)

      // Text
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.font = 'bold 9px Courier New'
      ctx.textAlign = 'center'
      ctx.fillText(`${activeMultipliers[i]}x`, x + slotWidth / 2, height - 12)
    }

    // Draw Pegs (Triangle structure)
    const now = Date.now()
    for (let r = 0; r < rows; r++) {
      const count = r + 3
      const rowY = 50 + r * (260 / rows)
      const rowWidth = (count - 1) * 24
      const startX = (width - rowWidth) / 2

      for (let c = 0; c < count; c++) {
        const x = startX + c * 24
        const pegKey = `${r}-${c}`
        const timeLit = litPegs[pegKey] || 0
        const isLit = now - timeLit < 200

        ctx.shadowBlur = isLit ? 10 : 0
        ctx.shadowColor = '#00ff88'
        ctx.fillStyle = isLit ? '#00ff88' : '#6a798d'
        
        ctx.beginPath()
        ctx.arc(x, rowY, pegRadius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.shadowBlur = 0 // reset
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawBoard(ctx)
  }, [rows, risk, litPegs])

  const dropBall = async () => {
    if (dropping) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }

    setMessage(null)
    setDropping(true)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()
    if (!data.success) {
      setDropping(false)
      return setMessage({ type: 'error', text: data.error })
    }
    fetchWallet()

    // Calculate ball path coordinates through pegs
    // Decisions: 0 = left bounce, 1 = right bounce
    let currentColumn = 1 // start middle
    const pathPoints = [{ x: width / 2, y: 20 }]

    for (let r = 0; r < rows; r++) {
      const count = r + 3
      const rowY = 50 + r * (260 / rows)
      const rowWidth = (count - 1) * 24
      const startX = (width - rowWidth) / 2

      const step = Math.random() < 0.5 ? 0 : 1
      currentColumn += step

      const x = startX + currentColumn * 24
      pathPoints.push({ x, y: rowY, row: r, col: currentColumn })
    }

    const finalSlot = currentColumn
    const multiplier = activeMultipliers[finalSlot]

    // Animation physics loop
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let currentStep = 0
    let progress = 0

    // Trail particles tracking
    const particles = []

    const animate = () => {
      if (currentStep >= pathPoints.length - 1) {
        // landed in bin
        finishGame(multiplier)
        return
      }

      const p0 = pathPoints[currentStep]
      const p1 = pathPoints[currentStep + 1]

      progress += 0.12 // speed
      if (progress >= 1.0) {
        progress = 0
        currentStep++
        
        // Trigger peg light/hit animation
        if (p1.row !== undefined) {
          const key = `${p1.row}-${p1.col}`
          setLitPegs(prev => ({ ...prev, [key]: Date.now() }))
        }
      }

      const t = progress
      const tCosine = (1 - Math.cos(t * Math.PI)) / 2
      const x = p0.x + (p1.x - p0.x) * tCosine
      const y = p0.y + (p1.y - p0.y) * t + Math.sin(t * Math.PI) * -5

      // Add trail particles
      particles.push({ x, y, alpha: 1 })
      if (particles.length > 8) particles.shift()

      // Redraw board
      drawBoard(ctx)

      // Draw trail particles
      particles.forEach((p, idx) => {
        p.alpha -= 0.1
        ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, ballRadius - 1, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw active falling ball
      ctx.shadowBlur = 12
      ctx.shadowColor = '#00ff88'
      ctx.fillStyle = '#00ff88'
      ctx.beginPath()
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0 // reset

      requestAnimationFrame(animate)
    }

    animate()
  }

  const finishGame = async (multiplier) => {
    const payRes = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
    })
    const payData = await payRes.json()

    if (payData.success) {
      if (multiplier >= 1) {
        setMessage({ type: 'success', text: `🎉 WINNER! Landed in ${multiplier}x slot! +₱${(betAmount * multiplier).toFixed(2)}` })
      } else {
        setMessage({ type: 'error', text: `😭 Lost bet in ${multiplier}x slot.` })
      }
    }
    setDropping(false)
    fetchWallet()
  }

  return (
    <div className="game-screen-wrapper">
      <div className="game-glass-panel" style={{ maxWidth: '440px', border: '1px solid rgba(245, 194, 66, 0.3)' }}>
        <h2 className="game-title-neon" style={{
          color: '#f5c242',
          textShadow: '0 0 15px rgba(245, 194, 66, 0.6), 0 2px 4px #000'
        }}>
          🔵 PLINKO PEGS
        </h2>

        {/* Physics Canvas Area */}
        <div style={{
          position: 'relative',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '10px',
          borderRadius: '20px',
          border: '1.5px solid rgba(245, 194, 66, 0.15)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 8px 25px rgba(0,0,0,0.5)',
          marginBottom: '16px'
        }}>
          <canvas ref={canvasRef} width={width} height={height} style={{ borderRadius: '14px', display: 'block', width: '100%' }} />
        </div>

        {/* Message feedback */}
        {message && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '11px',
            marginBottom: '12px',
            background: message.type === 'error' ? 'rgba(255, 23, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)',
            color: message.type === 'error' ? '#ff1744' : '#00e676',
            border: `1px solid ${message.type === 'error' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 230, 118, 0.2)'}`,
            fontWeight: 'bold'
          }}>
            {message.text}
          </div>
        )}

        {/* Settings Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Rows count */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px', fontWeight: '900', textTransform: 'uppercase' }}>Peg Rows</label>
              <select 
                value={rows} 
                onChange={e => setRows(Number(e.target.value))} 
                disabled={dropping}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#070b12', color: '#fff', fontSize: '12px', width: '100%', fontWeight: 'bold' }}
              >
                <option value="8">8 Rows</option>
                <option value="10">10 Rows</option>
                <option value="12">12 Rows</option>
              </select>
            </div>

            {/* Risk settings */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px', fontWeight: '900', textTransform: 'uppercase' }}>Risk Level</label>
              <select 
                value={risk} 
                onChange={e => setRisk(e.target.value)} 
                disabled={dropping}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#070b12', color: '#fff', fontSize: '12px', width: '100%', fontWeight: 'bold' }}
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>

          {/* Bet Chips */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0' }}>
            {[10, 50, 100, 500].map(amt => (
              <button 
                key={amt} 
                className={`premium-chip-btn ${betAmount === amt ? 'active' : ''}`}
                onClick={() => setBetAmount(amt)}
                disabled={dropping}
                style={{
                  background: betAmount === amt 
                    ? 'linear-gradient(135deg, #ffea00 0%, #ff8f00 100%)' 
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
            onClick={dropBall} 
            disabled={dropping}
            style={{
              background: 'linear-gradient(90deg, #ffea00 0%, #ff8f00 100%)',
              boxShadow: '0 4px 20px rgba(245, 194, 66, 0.4)'
            }}
          >
            {dropping ? '⚽ BALL ACTIVE...' : `DROP BALL : ₱${betAmount}`}
          </button>
        </div>
      </div>
    </div>
  )
}
