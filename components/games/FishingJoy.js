import React, { useState, useEffect, useRef } from 'react'

export default function FishingJoy({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [ammo, setAmmo] = useState(0)
  const [sessionWin, setSessionWin] = useState(0)
  const [betAmount, setBetAmount] = useState(10) // ₱10 to buy 20 ammo shots
  const [multiplier, setMultiplier] = useState(1) // Weapon multiplier: 1x, 2x, 5x, 10x
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Turret angle state
  const [turretAngle, setTurretAngle] = useState(0)

  // Canvas context refs for gameloop
  const fishRef = useRef([])
  const netsRef = useRef([])
  const coinsRef = useRef([])

  useEffect(() => {
    // Generate initial fish group
    const initialFish = []
    const fishEmojis = ['🐠', '🐡', '🐙', '🐟', '🦀', '🦈']
    const fishSpeeds = [1.2, 0.9, 0.7, 1.4, 0.5, 0.3] // shark is slow but high value

    for (let i = 0; i < 8; i++) {
      initialFish.push(createRandomFish(fishEmojis, fishSpeeds))
    }
    fishRef.current = initialFish

    // Gameloop to animate fish, bullets, and floating coins
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animId
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw underwater ocean background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#001a35')
      gradient.addColorStop(0.5, '#00355f')
      gradient.addColorStop(1, '#004a87')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw bubbles background particles
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc((Math.sin(Date.now() / 1000 + i) * 100) + 150, (canvas.height - (Date.now() / 15 + i * 80) % canvas.height), 6 + i, 0, Math.PI*2)
        ctx.fill()
      }

      // Draw Fish
      const now = Date.now()
      fishRef.current.forEach((fish, index) => {
        // Update physics
        fish.x += fish.vx
        fish.y += Math.sin(now / 400 + fish.phase) * 0.8 // sine sway path
        
        // Wrap/Respawn
        if (fish.vx > 0 && fish.x > canvas.width + 40) {
          fishRef.current[index] = createRandomFish(fishEmojis, fishSpeeds, -40)
        } else if (fish.vx < 0 && fish.x < -40) {
          fishRef.current[index] = createRandomFish(fishEmojis, fishSpeeds, canvas.width + 40)
        }

        // Draw fish emoji text
        ctx.save()
        ctx.translate(fish.x, fish.y)
        if (fish.vx < 0) {
          ctx.scale(-1, 1) // Flip emoji if swimming left
        }
        ctx.font = `${fish.size}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(fish.emoji, 0, 0)
        ctx.restore()
      })

      // Draw Nets/Projectiles
      netsRef.current = netsRef.current.filter(net => {
        net.radius += 3 // expand net radius
        net.alpha -= 0.05 // fade out

        // Draw expanding bubble net
        ctx.strokeStyle = `rgba(0, 229, 255, ${net.alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(net.x, net.y, net.radius, 0, Math.PI * 2)
        ctx.stroke()

        return net.alpha > 0
      })

      // Draw Floating Coins
      coinsRef.current = coinsRef.current.filter(coin => {
        // Move towards bottom center turret
        const dx = (canvas.width / 2) - coin.x
        const dy = (canvas.height - 20) - coin.y
        const dist = Math.hypot(dx, dy)

        if (dist < 15) {
          // add to win balance
          setSessionWin(prev => prev + coin.val)
          return false
        }

        coin.x += (dx / dist) * 6
        coin.y += (dy / dist) * 6

        // Draw glowing gold coin
        ctx.fillStyle = '#f5c242'
        ctx.shadowBlur = 8
        ctx.shadowColor = '#f5c242'
        ctx.beginPath()
        ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0 // reset

        // Draw text value
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 9px Outfit'
        ctx.textAlign = 'center'
        ctx.fillText(`+₱${coin.val}`, coin.x, coin.y - 12)

        return true
      })

      // Draw Player Turret Cannon
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height - 10)
      ctx.rotate(turretAngle)

      // Draw base
      ctx.fillStyle = '#1c2331'
      ctx.beginPath()
      ctx.arc(0, 0, 26, Math.PI, 0)
      ctx.fill()

      // Draw gun barrel
      ctx.fillStyle = '#f5c242'
      ctx.fillRect(-7, -40, 14, 30)
      ctx.strokeStyle = '#fff'
      ctx.strokeRect(-7, -40, 14, 30)

      ctx.restore()

      animId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(animId)
  }, [turretAngle, litPegs => {}])

  const createRandomFish = (emojis, speeds, customX) => {
    const rIdx = Math.floor(Math.random() * emojis.length)
    const direction = Math.random() < 0.5 ? 1 : -1
    const size = rIdx === 5 ? 42 : rIdx === 2 ? 30 : 24 // shark is big
    const val = rIdx === 5 ? 20 : rIdx === 2 ? 10 : 3 // shark pays 20x

    return {
      emoji: emojis[rIdx],
      vx: speeds[rIdx] * direction,
      x: customX !== undefined ? customX : (direction > 0 ? -40 : 340),
      y: 40 + Math.random() * 220,
      phase: Math.random() * 100,
      size,
      val
    }
  }

  const handleShoot = (e) => {
    if (ammo <= 0 || processing) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate angle from gun (bottom center) to click position
    const dx = x - (canvas.width / 2)
    const dy = y - (canvas.height - 10)
    const angle = Math.atan2(dx, -dy)
    setTurretAngle(angle)

    // Firing costs ammo
    setAmmo(a => a - 1)

    // Trigger visual Net explosion at target
    netsRef.current.push({ x, y, radius: 10, alpha: 1.0 })

    // Check hit collisions with fish (within 28px radius)
    fishRef.current.forEach((fish, index) => {
      const dist = Math.hypot(x - fish.x, y - fish.y)
      if (dist < 28) {
        // caught! Hit probability check (40%)
        if (Math.random() < 0.40) {
          const winVal = fish.val * multiplier
          
          // Spawn coin visual swimming to wallet
          coinsRef.current.push({ x: fish.x, y: fish.y, val: winVal })
          
          // Respawn caught fish
          const fishEmojis = ['🐠', '🐡', '🐙', '🐟', '🦀', '🦈']
          const fishSpeeds = [1.2, 0.9, 0.7, 1.4, 0.5, 0.3]
          fishRef.current[index] = createRandomFish(fishEmojis, fishSpeeds)
        }
      }
    })
  }

  const buyAmmo = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }
    setProcessing(true)
    setMessage(null)

    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (data.success) {
      setAmmo(20) // Buy 20 shots
      setSessionWin(0)
      setMessage({ type: 'success', text: '🔋 Weapon charged! Click the sea to fire bubble nets!' })
    } else {
      setMessage({ type: 'error', text: data.error })
    }
    setProcessing(false)
    fetchWallet()
  }

  const collectWinnings = async () => {
    if (sessionWin <= 0 || processing) return
    setProcessing(true)

    const multiplierResult = parseFloat((sessionWin / betAmount).toFixed(4))

    const res = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        bet_amount: betAmount,
        multiplier: multiplierResult
      })
    })
    const data = await res.json()

    if (data.success) {
      setMessage({ type: 'success', text: `🎉 Coins gathered! +₱${sessionWin.toFixed(2)} added to wallet.` })
      setSessionWin(0)
      setAmmo(0)
    }
    setProcessing(false)
    fetchWallet()
  }

  // Auto-collect winnings when out of ammo
  useEffect(() => {
    if (ammo === 0 && sessionWin > 0 && !processing) {
      collectWinnings()
    }
  }, [ammo])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #02122b 0%, #00050d 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00d2ff, #0076ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '10px'
      }}>
        FISHING JOY
      </h2>

      <div style={{ display: 'flex', gap: '20px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
        <span>🔋 Ammo: {ammo} Nets</span>
        <span>💵 Coins: ₱{sessionWin.toFixed(2)}</span>
      </div>

      {message && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          marginBottom: '8px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
          maxWidth: '300px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Physics Canvas Area */}
      <div style={{
        position: 'relative',
        background: '#021a35',
        padding: '8px',
        borderRadius: '20px',
        border: '2px solid #00d2ff',
        boxShadow: '0 8px 30px rgba(0,210,255,0.2)',
        cursor: ammo > 0 ? 'crosshair' : 'not-allowed'
      }}>
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={340} 
          style={{ borderRadius: '14px', display: 'block' }} 
          onClick={handleShoot}
        />
        
        {ammo === 0 && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.65)', 
            borderRadius: '20px',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            fontSize: '16px', 
            fontWeight: 'bold',
            gap: '8px'
          }}>
            <span>🔋 WEAPON EMPTY</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Purchase ammo pack to fish</span>
          </div>
        )}
      </div>

      {/* Controls panel */}
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
        {/* Stake weapon multiplier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold' }}>GUN POWER</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 5, 10].map(mult => (
              <button 
                key={mult}
                onClick={() => setMultiplier(mult)}
                disabled={ammo > 0}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: multiplier === mult ? 'var(--accent)' : '#000',
                  color: multiplier === mult ? '#000' : '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {ammo === 0 ? (
          <button 
            className="btn primary" 
            onClick={buyAmmo} 
            style={{ padding: '14px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }} 
            disabled={processing}
          >
            {processing ? 'CHARGING...' : `BUY 20 AMMO — ₱${betAmount}`}
          </button>
        ) : (
          <button 
            className="btn" 
            onClick={collectWinnings} 
            style={{ padding: '14px', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 'bold' }} 
            disabled={processing || sessionWin <= 0}
          >
            {processing ? 'COLLECTING...' : `📥 Cash Out ₱${sessionWin.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}
