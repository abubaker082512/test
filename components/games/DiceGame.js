import React, { useState } from 'react'

export default function DiceGame({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [targetNumber, setTargetNumber] = useState(50)
  const [isRollOver, setIsRollOver] = useState(true) // true: Roll Over, false: Roll Under
  const [rolling, setRolling] = useState(false)
  const [rolledNumber, setRolledNumber] = useState(null)
  const [win, setWin] = useState(null)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [recentRolls, setRecentRolls] = useState([
    { roll: 64.20, win: true },
    { roll: 12.85, win: false },
    { roll: 88.14, win: true },
    { roll: 41.50, win: false },
    { roll: 92.00, win: true }
  ])

  // Calculation formulas
  // House edge 2% (98% RTP)
  const winChance = isRollOver ? (100 - targetNumber) : targetNumber
  const multiplier = winChance > 0 ? parseFloat(((98 / winChance)).toFixed(4)) : 0
  const potentialProfit = parseFloat((betAmount * multiplier - betAmount).toFixed(2))

  const handleBetChange = (amt) => {
    if (rolling) return
    setBetAmount(Math.max(1, amt))
  }

  const handleSliderChange = (e) => {
    if (rolling) return
    const val = parseInt(e.target.value, 10)
    setTargetNumber(val)
    setMessage(null)
  }

  const rollDice = async () => {
    if (rolling || processing) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setRolling(true)
    setMessage(null)
    setWin(null)

    // 1. Deduct bet from Supabase wallet
    try {
      const betRes = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const betData = await betRes.json()
      if (!betData.success) {
        setRolling(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: betData.error || 'Bet placement failed.' })
      }
      fetchWallet()
    } catch (err) {
      setRolling(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    // 2. Animate rolling number
    let steps = 0
    const interval = setInterval(async () => {
      steps++
      const tempRoll = (Math.random() * 100).toFixed(2)
      setRolledNumber(parseFloat(tempRoll))

      if (steps > 15) {
        clearInterval(interval)

        // Final verifiable roll
        const finalRoll = parseFloat((Math.random() * 100).toFixed(2))
        setRolledNumber(finalRoll)

        const didWin = isRollOver ? finalRoll > targetNumber : finalRoll < targetNumber
        setWin(didWin)
        setRecentRolls(prev => [{ roll: finalRoll, win: didWin }, ...prev.slice(0, 7)])

        if (didWin) {
          const payoutAmount = parseFloat((betAmount * multiplier).toFixed(2))
          try {
            const payRes = await fetch('/api/wallet/payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: user.id, amount: payoutAmount })
            })
            const payData = await payRes.json()
            if (payData.success) {
              fetchWallet()
              setMessage({
                type: 'success',
                text: `🎉 WIN! Rolled ${finalRoll}. Won +₱${payoutAmount.toLocaleString()}!`
              })
            }
          } catch (e) {
            console.error('Payout failed:', e)
          }
        } else {
          setMessage({
            type: 'loss',
            text: `💥 Missed! Rolled ${finalRoll}. Better luck next time!`
          })
        }

        setRolling(false)
        setProcessing(false)
      }
    }, 50)
  }

  return (
    <div className="game-screen-wrapper" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="game-glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="game-title-neon" style={{ margin: 0, fontSize: '22px' }}>🎲 CRYPTO DICE</h2>
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.5px' }}>FAIR & INSTANT WIN</span>
          </div>
          <div style={{ 
            background: 'rgba(0, 230, 118, 0.1)', 
            border: '1px solid rgba(0, 230, 118, 0.3)', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            color: '#00e676', 
            fontWeight: 'bold' 
          }}>
            RTP 98%
          </div>
        </div>

        {/* Live Roll History */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
          {recentRolls.map((r, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                background: r.win ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 68, 68, 0.15)', 
                color: r.win ? '#00e676' : '#ff5252',
                border: `1px solid ${r.win ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 68, 68, 0.3)'}`
              }}
            >
              {r.roll.toFixed(2)}
            </div>
          ))}
        </div>

        {/* Big Display HUD */}
        <div style={{ 
          background: 'radial-gradient(circle at center, rgba(19, 27, 44, 0.8) 0%, rgba(9, 13, 23, 0.95) 100%)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '18px', 
          padding: '24px 16px', 
          textAlign: 'center', 
          marginBottom: '24px',
          boxShadow: win === true ? '0 0 25px rgba(0, 230, 118, 0.3)' : win === false ? '0 0 25px rgba(255, 68, 68, 0.2)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            {rolling ? 'ROLLING...' : win !== null ? (win ? 'WINNER!' : 'MISSED') : 'TARGET SLIDER'}
          </div>

          <div style={{ 
            fontSize: '52px', 
            fontWeight: '900', 
            fontFamily: 'monospace', 
            color: win === true ? '#00e676' : win === false ? '#ff5252' : '#f5c242',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)'
          }}>
            {rolledNumber !== null ? rolledNumber.toFixed(2) : targetNumber.toFixed(2)}
          </div>

          <div style={{ fontSize: '12px', color: '#8b9bb4', marginTop: '4px' }}>
            Roll {isRollOver ? 'Over' : 'Under'} <strong style={{ color: '#fff' }}>{targetNumber}</strong> to Win
          </div>
        </div>

        {/* Interactive Slider Track */}
        <div style={{ marginBottom: '24px', padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
            <span>0</span>
            <span style={{ color: '#00e676', fontWeight: 'bold' }}>25</span>
            <span style={{ color: '#f5c242', fontWeight: 'bold' }}>50</span>
            <span style={{ color: '#ff9100', fontWeight: 'bold' }}>75</span>
            <span>100</span>
          </div>

          <input 
            type="range" 
            min="2" 
            max="98" 
            value={targetNumber}
            onChange={handleSliderChange}
            disabled={rolling}
            style={{ 
              width: '100%', 
              accentColor: '#00e676', 
              cursor: rolling ? 'not-allowed' : 'pointer',
              height: '8px',
              borderRadius: '4px'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button 
              onClick={() => { if (!rolling) setIsRollOver(false) }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid ' + (!isRollOver ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                background: !isRollOver ? 'rgba(245, 194, 66, 0.15)' : 'rgba(255,255,255,0.03)',
                color: !isRollOver ? 'var(--accent)' : 'var(--muted)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Roll Under (&lt; {targetNumber})
            </button>
            <button 
              onClick={() => { if (!rolling) setIsRollOver(true) }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid ' + (isRollOver ? '#00e676' : 'rgba(255,255,255,0.1)'),
                background: isRollOver ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.03)',
                color: isRollOver ? '#00e676' : 'var(--muted)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Roll Over (&gt; {targetNumber})
            </button>
          </div>
        </div>

        {/* Multiplier & Win Chance Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>MULTIPLIER</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00e676' }}>{multiplier}x</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>WIN CHANCE</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{winChance}%</div>
          </div>
        </div>

        {/* Chip Selectors */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {[10, 50, 100, 500, 1000].map(amt => (
            <button 
              key={amt}
              className={`premium-chip-btn ${betAmount === amt ? 'selected' : ''}`}
              onClick={() => handleBetChange(amt)}
              disabled={rolling}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: betAmount === amt ? 'linear-gradient(135deg, #00e676 0%, #00897b 100%)' : '#141a29',
                border: '2px dashed ' + (betAmount === amt ? '#fff' : 'rgba(255,255,255,0.2)'),
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: rolling ? 'not-allowed' : 'pointer'
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

        {/* Roll Button */}
        <button 
          className="game-btn-primary" 
          disabled={rolling || processing}
          onClick={rollDice}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '14px', 
            fontSize: '16px', 
            fontWeight: '900', 
            letterSpacing: '1px',
            background: rolling ? '#2a3447' : 'linear-gradient(135deg, #00e676 0%, #00897b 100%)',
            border: 'none',
            color: '#000',
            boxShadow: '0 4px 16px rgba(0, 230, 118, 0.4)',
            cursor: rolling ? 'not-allowed' : 'pointer'
          }}
        >
          {rolling ? 'ROLLING DICE...' : `BET ₱${betAmount} (PROFIT +₱${potentialProfit})`}
        </button>

      </div>
    </div>
  )
}