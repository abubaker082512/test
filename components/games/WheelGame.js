import React, { useState, useRef, useEffect } from 'react'

const SEGMENTS = [
  { label: '0x', mult: 0.0, color: '#e53935' },
  { label: '1.2x', mult: 1.2, color: '#1e88e5' },
  { label: '1.5x', mult: 1.5, color: '#43a047' },
  { label: '0x', mult: 0.0, color: '#e53935' },
  { label: '2.0x', mult: 2.0, color: '#fb8c00' },
  { label: '1.2x', mult: 1.2, color: '#1e88e5' },
  { label: '3.0x', mult: 3.0, color: '#8e24aa' },
  { label: '0x', mult: 0.0, color: '#e53935' },
  { label: '1.5x', mult: 1.5, color: '#43a047' },
  { label: '5.0x', mult: 5.0, color: '#fdd835' },
  { label: '0x', mult: 0.0, color: '#e53935' },
  { label: '10.0x', mult: 10.0, color: '#00e676' }
]

export default function WheelGame({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [history, setHistory] = useState(['2.0x', '1.2x', '0x', '5.0x', '1.5x'])
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef(null)

  const numSegments = SEGMENTS.length
  const segmentAngle = (2 * Math.PI) / numSegments

  // Draw wheel on canvas
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = width / 2 - 12

    ctx.clearRect(0, 0, width, height)

    // Draw Outer Glow Ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.restore()

    // Draw segments
    for (let i = 0; i < numSegments; i++) {
      const angle = currentAngle + i * segmentAngle
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, angle, angle + segmentAngle)
      ctx.fillStyle = SEGMENTS[i].color
      ctx.fill()
      ctx.strokeStyle = '#0a0d16'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw label
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(angle + segmentAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px Inter, sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      ctx.fillText(SEGMENTS[i].label, radius - 16, 5)
      ctx.restore()
    }

    // Draw Center Peg
    ctx.beginPath()
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#0a0e18'
    ctx.fill()
    ctx.strokeStyle = 'var(--accent, #f5c242)'
    ctx.lineWidth = 4
    ctx.stroke()

    // Inner center dot
    ctx.beginPath()
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI)
    ctx.fillStyle = 'var(--accent, #f5c242)'
    ctx.fill()
  }

  useEffect(() => {
    drawWheel(rotation)
  }, [rotation])

  const handleBetChange = (amt) => {
    if (spinning) return
    setBetAmount(Math.max(1, amt))
  }

  const spinWheel = async () => {
    if (spinning || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setSpinning(true)
    setMessage(null)

    // 1. Deduct bet from Supabase wallet
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
      setSpinning(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    // 2. Select outcome based on weighted probability
    const targetIdx = Math.floor(Math.random() * numSegments)
    const winningSegment = SEGMENTS[targetIdx]

    // Calculate rotation to align the selected segment with top pointer (pointer at -PI/2)
    // Pointer is at 12 o'clock => angle 3*PI/2 (or -PI/2)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const targetAngle = 1.5 * Math.PI - (targetIdx * segmentAngle + segmentAngle / 2)
    const totalRotation = fullSpins * 2 * Math.PI + targetAngle

    let startRotation = rotation % (2 * Math.PI)
    let startTime = null
    const duration = 4000 // 4 seconds

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentRot = startRotation + (totalRotation - startRotation) * easeOut

      setRotation(currentRot)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Complete spin
        setSpinning(false)
        setProcessing(false)
        setHistory(prev => [winningSegment.label, ...prev.slice(0, 6)])

        if (winningSegment.mult > 0) {
          const payoutAmount = parseFloat((betAmount * winningSegment.mult).toFixed(2))
          fetch('/api/wallet/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, amount: payoutAmount })
          }).then(r => r.json()).then(pData => {
            if (pData.success) {
              fetchWallet()
              setMessage({
                type: 'success',
                text: `🎉 WINNER! Hit ${winningSegment.label} - Credited +₱${payoutAmount.toLocaleString()}!`
              })
            }
          })
        } else {
          setMessage({
            type: 'loss',
            text: `💀 Bust! Hit ${winningSegment.label}. Spin again!`
          })
        }
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <div className="game-screen-wrapper" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="game-glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="game-title-neon" style={{ margin: 0, fontSize: '22px' }}>🎡 LUCKY WHEEL</h2>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>MULTIPLIER EXTRAVAGANZA</span>
          </div>
          <div style={{ 
            background: 'rgba(245, 194, 66, 0.15)', 
            border: '1px solid rgba(245, 194, 66, 0.3)', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            color: '#f5c242', 
            fontWeight: 'bold' 
          }}>
            MAX 10.0x
          </div>
        </div>

        {/* History Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
          {history.map((h, i) => (
            <span 
              key={i} 
              style={{ 
                padding: '4px 8px', 
                borderRadius: '8px', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                background: h === '0x' ? 'rgba(229, 57, 53, 0.2)' : 'rgba(0, 230, 118, 0.2)', 
                color: h === '0x' ? '#ff5252' : '#00e676',
                border: `1px solid ${h === '0x' ? 'rgba(229, 57, 53, 0.4)' : 'rgba(0, 230, 118, 0.4)'}`
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Wheel Canvas Container */}
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 20px' }}>
          {/* Top Indicator Arrow */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '20px solid #f5c242',
            zIndex: 10,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))'
          }} />

          <canvas 
            ref={canvasRef} 
            width={280} 
            height={280} 
            style={{ borderRadius: '50%', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
          />
        </div>

        {/* Chip Selectors */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {[10, 50, 100, 500, 1000].map(amt => (
            <button 
              key={amt}
              className={`premium-chip-btn ${betAmount === amt ? 'selected' : ''}`}
              onClick={() => handleBetChange(amt)}
              disabled={spinning}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: betAmount === amt ? 'linear-gradient(135deg, #f5c242 0%, #e65100 100%)' : '#141a29',
                border: '2px dashed ' + (betAmount === amt ? '#fff' : 'rgba(255,255,255,0.2)'),
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: spinning ? 'not-allowed' : 'pointer'
              }}
            >
              {amt}
            </button>
          ))}
        </div>

        {/* Message Banner */}
        {message && (
          <div style={{ 
            padding: '10px 14px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            textAlign: 'center', 
            fontSize: '13px', 
            fontWeight: 'bold',
            background: message.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#00e676' : '#ff5252'}`,
            color: message.type === 'success' ? '#00e676' : '#ff5252'
          }}>
            {message.text}
          </div>
        )}

        {/* Spin Button */}
        <button 
          className="game-btn-primary" 
          disabled={spinning || processing}
          onClick={spinWheel}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '14px', 
            fontSize: '16px', 
            fontWeight: '900', 
            letterSpacing: '1px',
            background: spinning ? '#2a3447' : 'linear-gradient(135deg, #f5c242 0%, #ff9800 100%)',
            border: 'none',
            color: '#000',
            boxShadow: '0 4px 16px rgba(245, 194, 66, 0.4)',
            cursor: spinning ? 'not-allowed' : 'pointer'
          }}
        >
          {spinning ? 'SPINNING WHEEL...' : `SPIN WHEEL FOR ₱${betAmount}`}
        </button>

      </div>
    </div>
  )
}
