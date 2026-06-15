import React, { useState } from 'react'

export default function KenoGame({ user, wallet, fetchWallet }) {
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [drawnNumbers, setDrawnNumbers] = useState([])
  const [betAmount, setBetAmount] = useState(10)
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState(null)
  const [drawProgress, setDrawProgress] = useState(0) // tracks how many balls drawn (0 to 20)

  const toggleSelect = (num) => {
    if (playing) return
    setMessage(null)
    setDrawnNumbers([])
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num)
      } else {
        if (prev.length >= 10) {
          setMessage({ type: 'error', text: 'You can select a maximum of 10 numbers!' })
          return prev
        }
        return [...prev, num]
      }
    })
  }

  const clearSelection = () => {
    if (playing) return
    setSelectedNumbers([])
    setDrawnNumbers([])
    setMessage(null)
  }

  const getRandomSelection = () => {
    if (playing) return
    setMessage(null)
    setDrawnNumbers([])
    const randoms = []
    while (randoms.length < 10) {
      const num = Math.floor(Math.random() * 80) + 1
      if (!randoms.includes(num)) randoms.push(num)
    }
    setSelectedNumbers(randoms)
  }

  // Calculate payout multiplier based on numbers selected and hit count
  const getPayoutMultiplier = (selectedCount, hitCount) => {
    if (selectedCount === 0 || hitCount === 0) return 0.0

    // Payout scale matrix
    if (selectedCount === 1) {
      return hitCount === 1 ? 3.0 : 0.0
    }
    if (selectedCount === 2) {
      return hitCount === 1 ? 1.0 : hitCount === 2 ? 5.0 : 0.0
    }
    if (selectedCount === 3) {
      return hitCount === 2 ? 2.0 : hitCount === 3 ? 15.0 : 0.0
    }
    if (selectedCount === 4) {
      return hitCount === 2 ? 1.5 : hitCount === 3 ? 4.0 : hitCount === 4 ? 40.0 : 0.0
    }
    if (selectedCount === 5) {
      return hitCount === 2 ? 1.0 : hitCount === 3 ? 3.0 : hitCount === 4 ? 12.0 : hitCount === 5 ? 100.0 : 0.0
    }
    if (selectedCount >= 6 && selectedCount <= 8) {
      if (hitCount === 3) return 1.5
      if (hitCount === 4) return 5.0
      if (hitCount === 5) return 15.0
      if (hitCount === 6) return 80.0
      if (hitCount >= 7) return 300.0
      return 0.0
    }
    // 9 or 10 selected
    if (hitCount === 4) return 2.0
    if (hitCount === 5) return 6.0
    if (hitCount === 6) return 20.0
    if (hitCount === 7) return 100.0
    if (hitCount === 8) return 500.0
    if (hitCount === 9) return 1500.0
    if (hitCount === 10) return 5000.0
    return 0.0
  }

  const triggerDraw = async () => {
    if (playing) return
    if (selectedNumbers.length === 0) {
      return setMessage({ type: 'error', text: 'Select at least 1 number to play!' })
    }
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setPlaying(true)
    setMessage(null)
    setDrawnNumbers([])
    setDrawProgress(0)

    // Deduct bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setPlaying(false)
        return setMessage({ type: 'error', text: data.error })
      }
      fetchWallet()
    } catch (e) {
      setPlaying(false)
      return setMessage({ type: 'error', text: 'Server connection failed.' })
    }

    // Draw 20 numbers sequentially (tumbler simulation)
    const drawPool = Array.from({ length: 80 }, (_, i) => i + 1)
    const finalDrawn = []
    
    for (let drawCount = 1; drawCount <= 20; drawCount++) {
      await new Promise(r => setTimeout(r, 160)) // draw speed
      const randIdx = Math.floor(Math.random() * drawPool.length)
      const num = drawPool.splice(randIdx, 1)[0]
      finalDrawn.push(num)
      setDrawnNumbers([...finalDrawn])
      setDrawProgress(drawCount)
    }

    // Evaluate payouts
    const hits = selectedNumbers.filter(n => finalDrawn.includes(n))
    const hitCount = hits.length
    const mult = getPayoutMultiplier(selectedNumbers.length, hitCount)

    if (mult > 0) {
      const payout = betAmount * mult
      try {
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            bet_amount: betAmount,
            multiplier: mult
          })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({
            type: 'success',
            text: `🎉 WINNER! Matched ${hitCount} of ${selectedNumbers.length} numbers! Payout: +₱${payout.toFixed(2)} (${mult}x)`
          })
          window.dispatchEvent(new Event('wallet-updated'))
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      setMessage({
        type: 'lose',
        text: `😭 Matched ${hitCount} of ${selectedNumbers.length} numbers. Better luck next time!`
      })
    }
    setPlaying(false)
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
      background: 'linear-gradient(180deg, #10061e 0%, #03010b 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '950',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #aa00ff, #e040fb)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px',
        textShadow: '0 2px 15px rgba(224, 64, 251, 0.25)'
      }}>
        CASINO KENO
      </h2>

      {playing && (
        <div style={{
          fontSize: '15px',
          color: 'var(--accent)',
          fontWeight: 'bold',
          marginBottom: '12px',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(245,194,66,0.3)'
        }}>
          DRAWING BALLS: {drawProgress} / 20
        </div>
      )}

      {/* 80-Number Board Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: '4px',
        background: '#0d0716',
        padding: '10px',
        borderRadius: '16px',
        border: '1px solid rgba(224, 64, 251, 0.25)',
        width: '100%',
        maxWidth: '360px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
      }}>
        {Array.from({ length: 80 }, (_, i) => i + 1).map(num => {
          const isSelected = selectedNumbers.includes(num)
          const isDrawn = drawnNumbers.includes(num)
          const isHit = isSelected && isDrawn

          return (
            <div
              key={num}
              onClick={() => toggleSelect(num)}
              style={{
                aspectRatio: '1/1',
                borderRadius: '4px',
                background: isHit ? '#00e676' : isDrawn ? '#ff1744' : isSelected ? 'var(--accent)' : '#191124',
                color: isHit || isDrawn ? '#fff' : isSelected ? '#000' : '#8c8099',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '900',
                cursor: playing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                border: isSelected ? '1px solid #fff' : '1px solid rgba(255,255,255,0.02)',
                boxShadow: isHit ? '0 0 10px #00e676' : isDrawn ? '0 0 10px #ff1744' : 'none'
              }}
            >
              {num}
            </div>
          )
        })}
      </div>

      {/* Selection tracking details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '360px',
        marginTop: '12px',
        fontSize: '12px',
        color: 'var(--muted)',
        fontWeight: 'bold'
      }}>
        <span>Numbers: {selectedNumbers.length} / 10 selected</span>
        {drawnNumbers.length > 0 && (
          <span style={{ color: '#00ff88' }}>
            Hits: {selectedNumbers.filter(n => drawnNumbers.includes(n)).length}
          </span>
        )}
      </div>

      {/* Message reports */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '14px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : message.type === 'lose' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : message.type === 'lose' ? '#aaa' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : message.type === 'lose' ? '#333' : '#00e67633'}`,
          maxWidth: '360px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '360px',
        marginTop: '14px'
      }}>
        {/* Quick select / Clear buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            onClick={getRandomSelection}
            disabled={playing}
            style={{ flex: 1, padding: '10px', fontSize: '11px', background: '#000', border: '1px solid #333' }}
          >
            🎲 AUTO PICK
          </button>
          
          <button
            className="btn"
            onClick={clearSelection}
            disabled={playing || selectedNumbers.length === 0}
            style={{ flex: 1, padding: '10px', fontSize: '11px', background: '#000', border: '1px solid #333' }}
          >
            🗑️ CLEAR ALL
          </button>
        </div>

        {/* Chip Size selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt} 
              className="btn" 
              onClick={() => setBetAmount(amt)}
              disabled={playing}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '11px',
                background: betAmount === amt ? 'var(--accent)' : '#000',
                color: betAmount === amt ? '#000' : '#fff',
                borderColor: betAmount === amt ? 'var(--accent)' : '#333'
              }}
            >
              ₱{amt}
            </button>
          ))}
        </div>

        {/* Play draw button */}
        <button
          className="btn primary"
          onClick={triggerDraw}
          disabled={playing || selectedNumbers.length === 0}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, var(--accent) 0%, #e040fb 100%)',
            color: '#000',
            boxShadow: '0 4px 15px rgba(224, 64, 251, 0.2)'
          }}
        >
          {playing ? 'DRAWING...' : `DRAW 20 BALLS — ₱${betAmount}`}
        </button>
      </div>
    </div>
  )
}
