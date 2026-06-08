import React, { useState, useEffect, useRef } from 'react'

export default function CockfightGame({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [betAmount, setBetAmount] = useState(10)
  const [betChoice, setBetChoice] = useState('Meron') // 'Meron' (Red) | 'Wala' (Blue)
  const [stage, setStage] = useState('idle') // 'idle' | 'fighting' | 'ended'
  const [meronHP, setMeronHP] = useState(100)
  const [walaHP, setWalaHP] = useState(100)
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Fight animation values
  const meronPosRef = useRef({ x: 50, y: 150 })
  const walaPosRef = useRef({ x: 230, y: 150 })
  const slashRef = useRef(null) // coords for hits: { x, y }
  const dustRef = useRef([]) // list of particles

  const addLog = (text) => {
    setLogs(prev => [text, ...prev].slice(0, 10))
  }

  // Combat loop animations
  useEffect(() => {
    if (stage !== 'fighting') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    let frame = 0
    const loop = () => {
      frame++
      
      // Update dust particles
      dustRef.current = dustRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.04
        return p.alpha > 0
      })

      // Roosters move back and forth
      // Meron bounces towards center, Wala bounces towards center
      const cycle = Math.sin(frame / 6) * 15
      meronPosRef.current.x = 50 + Math.max(0, cycle)
      walaPosRef.current.x = 230 - Math.max(0, cycle)

      // Collision hit check
      if (frame % 30 === 0) {
        // hit occurred
        const hitX = (meronPosRef.current.x + walaPosRef.current.x) / 2 + 10
        slashRef.current = { x: hitX, y: 140 + Math.random() * 20 }
        
        // Spawn dust cloud particles
        for (let i = 0; i < 8; i++) {
          dustRef.current.push({
            x: hitX,
            y: 150,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            alpha: 1.0,
            size: 3 + Math.random() * 6
          })
        }

        // Clear slash after 150ms
        setTimeout(() => {
          slashRef.current = null
        }, 150)
      }

      // Draw background dirt ring
      ctx.fillStyle = '#221a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = '#41301b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2 + 20, 90, 0, Math.PI*2)
      ctx.stroke()

      // Draw dust particles
      dustRef.current.forEach(p => {
        ctx.fillStyle = `rgba(180, 150, 110, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw Meron (Red Rooster represented visually)
      ctx.fillStyle = '#ff1744'
      ctx.font = '48px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🐓', meronPosRef.current.x, meronPosRef.current.y)

      // Draw Wala (Blue Rooster represented visually)
      ctx.save()
      ctx.translate(walaPosRef.current.x, walaPosRef.current.y)
      ctx.scale(-1, 1) // Face left
      ctx.fillStyle = '#29b6f6'
      ctx.font = '48px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🐓', 0, 0)
      ctx.restore()

      // Draw slash hit line
      if (slashRef.current) {
        ctx.strokeStyle = '#ffff00'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(slashRef.current.x - 15, slashRef.current.y - 15)
        ctx.lineTo(slashRef.current.x + 15, slashRef.current.y + 15)
        ctx.stroke()
        
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(slashRef.current.x + 15, slashRef.current.y - 15)
        ctx.lineTo(slashRef.current.x - 15, slashRef.current.y + 15)
        ctx.stroke()
      }

      animId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(animId)
  }, [stage])

  const startFight = async () => {
    if (stage === 'fighting') return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setMeronHP(100)
    setWalaHP(100)
    setLogs([])

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

    setStage('fighting')
    addLog(`📢 Fight Started! Stake ₱${betAmount} placed on ${betChoice}.`)

    // Fight simulation commentary script
    const actionPhrases = [
      'Meron executes an upward jump claw strike!',
      'Wala duck-evades and counters with a beak peck!',
      'Fierce clash! Feathers are flying everywhere in the ring!',
      'Meron strikes Wala hard on the shoulder!',
      'Wala leaps high and slashes down on Meron!'
    ]

    let currentMeronHP = 100
    let currentWalaHP = 100
    let combatTimer = 0

    const executeCombatRound = () => {
      if (currentMeronHP <= 0 || currentWalaHP <= 0) {
        resolveCombat(currentMeronHP, currentWalaHP)
        return
      }

      setTimeout(() => {
        const dmgMeron = Math.floor(Math.random() * 20) + 5
        const dmgWala = Math.floor(Math.random() * 20) + 5
        
        // Random pick who hits who
        if (Math.random() < 0.5) {
          currentWalaHP = Math.max(0, currentWalaHP - dmgWala)
          setWalaHP(currentWalaHP)
          addLog(`⚔️ ${actionPhrases[Math.floor(Math.random() * actionPhrases.length)]} (-${dmgWala} HP)`)
        } else {
          currentMeronHP = Math.max(0, currentMeronHP - dmgMeron)
          setMeronHP(currentMeronHP)
          addLog(`⚔️ ${actionPhrases[Math.floor(Math.random() * actionPhrases.length)]} (-${dmgMeron} HP)`)
        }

        executeCombatRound()
      }, 1000)
    }

    executeCombatRound()
    setProcessing(false)
  }

  const resolveCombat = async (finalMeronHP, finalWalaHP) => {
    setStage('ended')
    const winner = finalMeronHP > 0 ? 'Meron' : 'Wala'
    addLog(`🏁 Combat Finished! Winner is: ${winner.toUpperCase()}!`)

    const isWin = betChoice === winner
    if (isWin) {
      // Payout 2x (minus small commission 1.95x net)
      const multiplier = 1.95
      const payRes = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
      })
      const payData = await payRes.json()
      if (payData.success) {
        setMessage({ type: 'success', text: `🎉 WINNER! ${winner} won the fight! +₱${(betAmount * multiplier).toFixed(2)}` })
      }
    } else {
      setMessage({ type: 'error', text: `😭 Lost! ${winner} won the fight. Bet lost.` })
    }
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
      background: 'linear-gradient(180deg, #1b0e05 0%, #080301 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #ff3c00, #ffbb00)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px'
      }}>
        DS88 COCKFIGHT
      </h2>

      {/* Fight Arena HP Status Bars */}
      {stage !== 'idle' && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          maxWidth: '320px', 
          marginBottom: '10px',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          {/* Meron HP */}
          <div style={{ flex: 1, marginRight: '10px' }}>
            <div style={{ color: '#ff1744', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>🟥 MERON</span>
              <span>{meronHP}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${meronHP}%`, height: '100%', background: '#ff1744', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Wala HP */}
          <div style={{ flex: 1, marginLeft: '10px' }}>
            <div style={{ color: '#29b6f6', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>🟦 WALA</span>
              <span>{walaHP}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${walaHP}%`, height: '100%', background: '#29b6f6', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Arena */}
      <div style={{
        position: 'relative',
        background: '#1d170f',
        padding: '6px',
        borderRadius: '20px',
        border: '2px solid #543f29',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        width: '100%',
        maxWidth: '320px'
      }}>
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={210} 
          style={{ borderRadius: '14px', display: 'block' }} 
        />
        {stage === 'idle' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            PLACE BET TO ENTER RING
          </div>
        )}
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
          maxWidth: '320px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Betting panel controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '320px',
        marginTop: '12px',
        background: 'rgba(0,0,0,0.5)',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        {/* Meron vs Wala toggle */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            disabled={stage === 'fighting'}
            onClick={() => setBetChoice('Meron')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#ff1744',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: betChoice === 'Meron' ? '3px solid #fff' : 'none',
              opacity: betChoice === 'Meron' ? 1 : 0.6
            }}
          >
            🟥 MERON (1.95)
          </button>
          <button 
            disabled={stage === 'fighting'}
            onClick={() => setBetChoice('Wala')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#29b6f6',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: betChoice === 'Wala' ? '3px solid #fff' : 'none',
              opacity: betChoice === 'Wala' ? 1 : 0.6
            }}
          >
            🟦 WALA (1.95)
          </button>
        </div>

        {/* Bet Chips */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt} 
              className="btn" 
              onClick={() => setBetAmount(amt)}
              disabled={stage === 'fighting'}
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
          onClick={startFight}
          disabled={stage === 'fighting' || processing}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {stage === 'fighting' ? 'COMBAT UNDERWAY...' : `MATCH FIGHT — ₱${betAmount}`}
        </button>
      </div>

      {/* Combat logs */}
      {logs.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '320px',
          marginTop: '12px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
            Live Fight commentary
          </div>
          <div style={{ height: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ fontSize: '10px', color: '#ccc', fontFamily: 'monospace' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
