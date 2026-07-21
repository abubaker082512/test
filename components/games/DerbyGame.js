import React, { useState, useEffect, useRef } from 'react'

const HORSES_CONFIG = [
  { id: 1, name: 'Red Blazer', color: '#ff1744', emoji: '🐎', odds: 2.10 },
  { id: 2, name: 'Golden Comet', color: '#ffea00', emoji: '🐎', odds: 3.40 },
  { id: 3, name: 'Blue Storm', color: '#29b6f6', emoji: '🐎', odds: 4.80 },
  { id: 4, name: 'Purple Dusk', color: '#ab47bc', emoji: '🐎', odds: 7.50 }
]

export default function DerbyGame({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [betAmount, setBetAmount] = useState(10)
  const [selectedHorse, setSelectedHorse] = useState(1) // horse id
  const [racing, setRacing] = useState(false)
  const [winner, setWinner] = useState(null) // horse config
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [history, setHistory] = useState([2, 1, 3, 2, 4, 1, 2])

  // Track coordinates of horses on the track
  const horsePositions = useRef([
    { id: 1, x: 20, speed: 0 },
    { id: 2, x: 20, speed: 0 },
    { id: 3, x: 20, speed: 0 },
    { id: 4, x: 20, speed: 0 }
  ])

  // Dust trail particles
  const particles = useRef([])

  useEffect(() => {
    // Initial draw of static racetrack
    drawTrack()
  }, [])

  const drawTrack = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Draw background green turf grass with lanes
    ctx.fillStyle = '#1b5e20'
    ctx.fillRect(0, 0, width, height)

    // Lanes divider lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Finish line (chequered black & white flag)
    const finishLineX = width - 40
    ctx.fillStyle = '#fff'
    ctx.fillRect(finishLineX, 0, 10, height)
    ctx.fillStyle = '#000'
    for (let y = 0; y < height; y += 10) {
      if ((y / 10) % 2 === 0) {
        ctx.fillRect(finishLineX, y, 10, 5)
        ctx.fillRect(finishLineX + 5, y + 5, 5, 5)
      } else {
        ctx.fillRect(finishLineX + 5, y, 5, 5)
        ctx.fillRect(finishLineX, y + 5, 10, 5)
      }
    }

    // Draw horses in starting position
    horsePositions.current.forEach((h, idx) => {
      const config = HORSES_CONFIG[idx]
      const y = (height / 4) * idx + (height / 8)

      // Draw dust particles
      particles.current.forEach(p => {
        ctx.fillStyle = `rgba(245, 222, 179, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw lane numbers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.font = '900 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${config.id}`, 30, y + 12)

      // Draw horse emoji and colored circle saddle
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.arc(h.x - 10, y + 5, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#000'
      ctx.font = 'bold 9px sans-serif'
      ctx.fillText(`#${config.id}`, h.x - 10, y + 8)

      ctx.font = '28px sans-serif'
      ctx.fillText(config.emoji, h.x + 10, y + 10)
    })
  }

  const startRace = async () => {
    if (racing || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setRacing(true)
    setMessage(null)
    setWinner(null)
    
    // Reset positions
    horsePositions.current = [
      { id: 1, x: 20 },
      { id: 2, x: 20 },
      { id: 3, x: 20 },
      { id: 4, x: 20 }
    ]
    particles.current = []

    // 1. Submit bet to server
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setRacing(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet placement failed.' })
      }
      fetchWallet()
    } catch (e) {
      setRacing(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    // 2. Start game animation loop
    const canvas = canvasRef.current
    const finishLineX = canvas.width - 45
    let animId
    
    const run = () => {
      // Update dust particles
      particles.current.forEach(p => {
        p.x -= 2
        p.alpha -= 0.05
      })
      particles.current = particles.current.filter(p => p.alpha > 0)

      // Move horses with random walking speeds
      let raceFinished = false
      let winningHorseId = null

      horsePositions.current.forEach((h, idx) => {
        const speed = 0.5 + Math.random() * 2.8
        h.x += speed

        // Spawn dust particles (10% chance)
        if (Math.random() < 0.15) {
          const y = (canvas.height / 4) * idx + (canvas.height / 8)
          particles.current.push({
            x: h.x - 15,
            y: y + 10,
            size: 2 + Math.random() * 4,
            alpha: 0.8
          })
        }

        if (h.x >= finishLineX) {
          raceFinished = true
          if (!winningHorseId) {
            winningHorseId = h.id
          }
        }
      })

      drawTrack()

      if (raceFinished) {
        cancelAnimationFrame(animId)
        settleRace(winningHorseId)
      } else {
        animId = requestAnimationFrame(run)
      }
    }

    animId = requestAnimationFrame(run)
  }

  const settleRace = async (winningId) => {
    const winConfig = HORSES_CONFIG.find(h => h.id === winningId)
    setWinner(winConfig)
    setHistory(prev => [winningId, ...prev].slice(0, 12))

    const didWin = selectedHorse === winningId

    if (didWin) {
      const payoutMultiplier = winConfig.odds
      try {
        const res = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            bet_amount: betAmount,
            multiplier: payoutMultiplier
          })
        })
        const data = await res.json()
        if (data.success) {
          setMessage({
            type: 'success',
            text: `🎉 WINNER! Horse #${winningId} (${winConfig.name}) won the race! Payout: ₱${(betAmount * payoutMultiplier).toFixed(2)}`
          })
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Payout credit error.' })
      }
    } else {
      setMessage({
        type: 'error',
        text: `💥 Loss! Horse #${winningId} (${winConfig.name}) won the race. Try another track!`
      })
    }

    setRacing(false)
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
      background: 'linear-gradient(180deg, #1b3a1e 0%, #08170b 100%)', // Derby Arena Grass
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Winner Podium Dialog */}
      {winner && (
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #ffd700 0%, #ff8f00 100%)',
          border: '3px solid #fff',
          borderRadius: '16px',
          padding: '14px 28px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          zIndex: 10,
          animation: 'scaleUp 0.3s'
        }}>
          <h3 style={{ margin: 0, color: '#000', fontSize: '18px', fontWeight: '900' }}>🏆 WINNER PODIUM</h3>
          <p style={{ margin: '4px 0 0', color: '#000', fontSize: '14px', fontWeight: 'bold' }}>
            {winner.name} (Horse #{winner.id})
          </p>
        </div>
      )}

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '2px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffea00',
          letterSpacing: '1.5px',
          textShadow: '0 2px 10px #000',
          margin: '0 0 14px'
        }}>🏇 VIRTUAL DERBY RACING</h2>

        {/* History Beads */}
        <div style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          background: '#041106',
          padding: '6px 12px',
          borderRadius: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          fontSize: '11px',
          color: '#aaa',
          alignItems: 'center'
        }}>
          Recent:
          {history.map((h, i) => (
            <span key={i} style={{
              background: HORSES_CONFIG.find(hc => hc.id === h)?.color || '#555',
              color: '#000',
              fontWeight: '900',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Turf Track Canvas */}
        <canvas
          ref={canvasRef}
          width={460}
          height={200}
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '2px solid #5d4037',
            marginBottom: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        />

        {/* Odds & Horse selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
          {HORSES_CONFIG.map(horse => {
            const isSelected = selectedHorse === horse.id
            return (
              <button
                key={horse.id}
                disabled={racing}
                onClick={() => setSelectedHorse(horse.id)}
                style={{
                  background: isSelected ? horse.color : '#0c1a0e',
                  border: isSelected ? '2px solid #fff' : `1.5px solid ${horse.color}`,
                  borderRadius: '10px',
                  padding: '10px 4px',
                  cursor: 'pointer',
                  color: isSelected ? '#000' : '#fff',
                  boxShadow: isSelected ? `0 0 12px ${horse.color}` : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>#{horse.id} {horse.name.split(' ')[0]}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '4px' }}>{horse.odds.toFixed(2)}x</div>
              </button>
            )
          })}
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
              disabled={racing}
              onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0e2412', color: '#ffea00', border: '1px solid #ffea00', fontWeight: 'bold', cursor: 'pointer' }}
            >
              -
            </button>
            <div style={{
              flex: 1,
              background: '#041006',
              border: '1px solid #ffea00',
              borderRadius: '8px',
              color: '#fff',
              lineHeight: '34px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              ₱{betAmount}
            </div>
            <button
              disabled={racing}
              onClick={() => setBetAmount(betAmount + 10)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0e2412', color: '#ffea00', border: '1px solid #ffea00', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          <button
            onClick={startRace}
            disabled={racing || processing}
            style={{
              flex: 1.2,
              background: 'linear-gradient(90deg, #ffea00 0%, #00e676 100%)',
              color: '#000',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '950',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(255, 234, 0, 0.4)'
            }}
          >
            {racing ? 'RACING...' : 'START RACE'}
          </button>
        </div>
      </div>
    </div>
  )
}
