import React, { useState, useEffect, useRef } from 'react'

const MOCK_PLAYERS = [
  { name: 'pak***01', bet: 100 },
  { name: 'ali***77', bet: 250 },
  { name: 'user***92', bet: 50 },
  { name: 'khy***88', bet: 500 },
  { name: 'pun***12', bet: 1000 },
  { name: 'bal***00', bet: 150 }
]

export default function CrashGame({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [betAmount, setBetAmount] = useState(10)
  const [multiplier, setMultiplier] = useState(1.0)
  const [stage, setStage] = useState('idle') // 'idle' | 'running' | 'crashed' | 'cashout'
  const [cashedOutMult, setCashedOutMult] = useState(null)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Simulated players status
  const [players, setPlayers] = useState([])

  const runningRef = useRef(false)
  const multiplierRef = useRef(1.0)
  const crashPointRef = useRef(1.0)

  // Particles for canvas
  const particlesRef = useRef([])
  const starsRef = useRef([])

  // Initialize stars
  useEffect(() => {
    const stars = []
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * 320,
        y: Math.random() * 260,
        speed: 1 + Math.random() * 2
      })
    }
    starsRef.current = stars

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawStatic(ctx)
  }, [])

  const drawStatic = (ctx) => {
    ctx.fillStyle = '#0f1118'
    ctx.fillRect(0, 0, 320, 260)
    // grid
    ctx.strokeStyle = '#232a3f'
    ctx.lineWidth = 1
    for (let i = 0; i < 320; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 260)
      ctx.stroke()
    }
    for (let i = 0; i < 260; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(320, i)
      ctx.stroke()
    }
    // Rocket idle
    ctx.fillStyle = '#f5c242'
    ctx.font = '36px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🚀', 50, 210)
  }

  // Active flight simulation loop
  useEffect(() => {
    if (stage !== 'running') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let animId
    const startTime = Date.now()

    const loop = () => {
      if (!runningRef.current) return

      const elapsed = (Date.now() - startTime) / 1000
      // Exponential growth curve: Mult = e^(0.08 * t)
      const currentMult = parseFloat(Math.exp(0.08 * elapsed).toFixed(2))
      setMultiplier(currentMult)
      multiplierRef.current = currentMult

      // Check crash
      if (currentMult >= crashPointRef.current) {
        triggerCrash()
        return
      }

      // Draw background
      ctx.fillStyle = '#0a0d14'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grids
      ctx.strokeStyle = '#1e2435'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke()
      }

      // Scroll stars downwards to simulate speed
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      starsRef.current.forEach(star => {
        star.y += star.speed * (1 + (currentMult - 1) * 0.1) // speed scales with mult
        if (star.y > canvas.height) star.y = 0
        ctx.fillRect(star.x, star.y, 1.5, 1.5)
      })

      // Calculate rocket coordinates along exponential curve
      // X from 50 to 260, Y from 210 to 60
      const progress = Math.min(elapsed / 15, 1.0) // cap at 15s visual curve
      const rX = 50 + progress * 210
      const rY = 210 - Math.pow(progress, 1.5) * 150

      // Add exhaust fire particles
      particlesRef.current.push({
        x: rX - 10,
        y: rY + 10,
        size: 3 + Math.random() * 5,
        alpha: 1,
        vx: -1 - Math.random() * 2,
        vy: 1 + Math.random() * 2
      })
      if (particlesRef.current.length > 25) particlesRef.current.shift()

      // Draw exhaust particles
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.05
        ctx.fillStyle = `rgba(255, 68, 0, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw rocket
      ctx.save()
      ctx.translate(rX, rY)
      ctx.rotate(Math.PI / 4) // Angled flight
      ctx.font = '38px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🚀', 0, 0)
      ctx.restore()

      // Draw overlay multiplier text on canvas
      ctx.fillStyle = '#fff'
      ctx.font = '900 32px Outfit'
      ctx.textAlign = 'center'
      ctx.fillText(`${currentMult.toFixed(2)}x`, canvas.width / 2, 80)

      // Randomly cash out mock players
      setPlayers(prev => {
        return prev.map(p => {
          if (!p.cashedOut && Math.random() < 0.005 + (currentMult * 0.001)) {
            return { ...p, cashedOut: true, cashOutMult: currentMult }
          }
          return p
        })
      })

      animId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(animId)
  }, [stage])

  const triggerLaunch = async () => {
    if (stage === 'running') return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setMultiplier(1.0)
    setCashedOutMult(null)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()
    if (!data.success) {
      setProcessing(false)
      return setMessage({ type: 'error', text: data.error })
    }
    fetchWallet()

    // Configure randomized crash point (house edge math: average crash is 2.5x, but can go up to 20x, or crash instantly at 1.01x)
    const rand = Math.random()
    let crashPoint = 1.01
    if (rand > 0.08) {
      // 92% chance crash is calculated exponentially
      crashPoint = parseFloat((1.01 + Math.pow(Math.random(), 2) * 8).toFixed(2))
    }
    crashPointRef.current = crashPoint

    // Reset mock players
    setPlayers(MOCK_PLAYERS.map(p => ({ ...p, cashedOut: false, cashOutMult: null })))

    setStage('running')
    runningRef.current = true
    setProcessing(false)
  }

  const triggerCashOut = async () => {
    if (stage !== 'running' || !runningRef.current) return
    
    // Stop user play status, lock multiplier
    const currentMult = multiplierRef.current
    setCashedOutMult(currentMult)
    setStage('cashout')

    // Credit payout
    const payRes = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        bet_amount: betAmount,
        multiplier: currentMult
      })
    })
    const payData = await payRes.json()
    if (payData.success) {
      setMessage({ type: 'success', text: `💰 Cashed Out! +₱${(betAmount * currentMult).toFixed(2)} (${currentMult}x)` })
    }
    fetchWallet()
  }

  const triggerCrash = () => {
    runningRef.current = false
    setStage('crashed')

    // Draw explosion on canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      
      // Clear and draw grids
      ctx.fillStyle = '#0a0d14'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw boom emoji at middle
      ctx.font = '64px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('💥', canvas.width / 2, canvas.height / 2)

      // Draw overlay text
      ctx.fillStyle = '#ff1744'
      ctx.font = '900 24px Outfit'
      ctx.textAlign = 'center'
      ctx.fillText(`CRASHED @ ${multiplierRef.current.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 + 50)
    }

    if (cashedOutMult === null) {
      setMessage({ type: 'error', text: `💥 Rocket crashed at ${multiplierRef.current.toFixed(2)}x! Lost bet.` })
    }
  }

  return (
    <div className="game-screen-wrapper">
      <div className="game-glass-panel" style={{ 
        maxWidth: '400px', 
        border: `1.5px solid ${stage === 'crashed' ? '#ff1744' : stage === 'cashout' ? '#00e676' : 'rgba(255, 68, 68, 0.3)'}` 
      }}>
        <h2 className="game-title-neon" style={{
          color: '#ff4444',
          textShadow: '0 0 15px rgba(255, 68, 68, 0.6), 0 2px 4px #000'
        }}>
          🚀 ROCKET CRASH
        </h2>

        {/* Physics Canvas Area */}
        <div style={{
          position: 'relative',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '10px',
          borderRadius: '20px',
          border: `2px solid ${stage === 'crashed' ? '#ff1744' : stage === 'cashout' ? '#00e676' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 8px 25px rgba(0,0,0,0.5)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={260} 
            style={{ borderRadius: '14px', display: 'block', width: '100%' }} 
          />
          
          {/* Floating multiplier state */}
          {stage !== 'running' && stage !== 'crashed' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontSize: '38px',
              fontWeight: '900',
              fontFamily: 'Outfit',
              textShadow: '0 4px 10px rgba(0,0,0,0.8)',
              zIndex: 10
            }}>
              {stage === 'cashout' ? `${cashedOutMult.toFixed(2)}x` : '1.00x'}
            </div>
          )}
        </div>

        {/* Message feedback */}
        {message && (
          <div style={{
            padding: '10px 16px',
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

        {/* Action controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '12px'
        }}>
          {stage !== 'running' ? (
            <>
              {/* Bet chips */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button 
                    key={amt} 
                    className={`premium-chip-btn ${betAmount === amt ? 'active' : ''}`}
                    onClick={() => setBetAmount(amt)}
                    disabled={processing}
                    style={{
                      background: betAmount === amt 
                        ? 'linear-gradient(135deg, #ff4444 0%, #cc1111 100%)' 
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
                onClick={triggerLaunch}
                disabled={processing}
                style={{
                  background: 'linear-gradient(90deg, #ff5252 0%, #ff1744 100%)',
                  boxShadow: '0 4px 20px rgba(255, 23, 68, 0.4)',
                  color: '#fff !important'
                }}
              >
                {processing ? 'CHARGING ENGINES...' : `BET ₱${betAmount} & LAUNCH`}
              </button>
            </>
          ) : (
            <button 
              className="game-btn-primary" 
              onClick={triggerCashOut}
              style={{
                background: 'linear-gradient(90deg, #00e676 0%, #00b0ff 100%)',
                boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)'
              }}
            >
              CASH OUT : ₱{(betAmount * multiplier).toFixed(2)}
            </button>
          )}
        </div>

        {/* Simulated Live Players panel */}
        {stage === 'running' && (
          <div style={{
            width: '100%',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Active Players in Flight
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '72px', overflowY: 'auto' }}>
              {players.map((p, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '11px',
                    background: p.cashedOut ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255,255,255,0.03)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${p.cashedOut ? 'rgba(0, 230, 118, 0.2)' : 'transparent'}`
                  }}
                >
                  <span style={{ color: p.cashedOut ? '#00e676' : '#fff' }}>{p.name}</span>
                  <span style={{ fontWeight: 'bold', color: p.cashedOut ? '#00e676' : '#ffea00' }}>
                    {p.cashedOut ? `${p.cashOutMult.toFixed(2)}x` : `₱${p.bet}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
