import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

// Authentic JILI Money Coming Symbols
const REEL_1_SYMBOLS = ['0', '1', '5', '10', 'blank']
const REEL_2_SYMBOLS = ['0', '00', '10', 'blank']
const REEL_3_SYMBOLS = ['0', '00', '100', 'blank']
const FEATURE_REEL_SYMBOLS = ['1x', '2x', '5x', '10x', 'RESPIN', 'WHEEL']

const BET_OPTIONS = [10, 20, 50, 100, 200, 500]

export default function MoneyComing({
  user,
  wallet,
  fetchWallet,
  isDemoMode,
  demoBalance,
  spendDemoBalance,
  addDemoBalance
}) {
  const [betAmount, setBetAmount] = useState(20)
  const [spinning, setSpinning] = useState(false)
  const [reel1, setReel1] = useState('10')
  const [reel2, setReel2] = useState('0')
  const [reel3, setReel3] = useState('0')
  const [featureReel, setFeatureReel] = useState('5x')
  const [statusMessage, setStatusMessage] = useState('TAP SPIN TO MULTIPLY CASH')
  const [roundWin, setRoundWin] = useState(0)
  const [bigWinOverlay, setBigWinOverlay] = useState(null)
  const [wheelModal, setWheelModal] = useState(null)
  const [turboMode, setTurboMode] = useState(false)
  const [autoSpin, setAutoSpin] = useState(false)

  const autoSpinRef = useRef(autoSpin)
  autoSpinRef.current = autoSpin
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  const playSound = useCallback((type) => {
    try {
      if (typeof window === 'undefined') return
      const ctx = casinoAudio.ctx || (window.AudioContext && new (window.AudioContext || window.webkitAudioContext)())
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'spin') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(350, now)
        osc.frequency.linearRampToValueAtTime(120, now + 0.12)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === 'reel-lock') {
        osc.type = 'square'
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === 'win') {
        const chord = [523.25, 659.25, 783.99, 1046.50]
        chord.forEach((f, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(f, now + i * 0.06)
          g.gain.setValueAtTime(0.14, now + i * 0.06)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25)
          o.start(now + i * 0.06)
          o.stop(now + i * 0.06 + 0.25)
        })
      } else if (type === 'bigwin') {
        casinoAudio.playBigWin()
      }
    } catch (e) {}
  }, [])

  const handleSpin = async () => {
    if (spinningRef.current) return

    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0)
    if (currentBal < betAmount) {
      setStatusMessage('⚠️ Insufficient Balance! Please Top-Up.')
      setAutoSpin(false)
      return
    }

    setSpinning(true)
    setRoundWin(0)
    setBigWinOverlay(null)
    setStatusMessage('SPINNING MONEY COMING...')
    playSound('spin')

    // Debit Bet
    if (isDemoMode) {
      spendDemoBalance(betAmount)
    } else {
      try {
        await fetch('/api/wallet/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || user?.uid || 'guest_player',
            email: user?.email || '',
            amount: betAmount,
            game: 'JILI Money Coming'
          })
        })
        if (fetchWallet) fetchWallet()
        window.dispatchEvent(new Event('wallet-updated'))
      } catch (e) {}
    }

    // Reel spin ticks
    const spinTicks = turboMode ? 4 : 8
    let ticks = 0
    const timer = setInterval(() => {
      ticks++
      setReel1(REEL_1_SYMBOLS[Math.floor(Math.random() * (REEL_1_SYMBOLS.length - 1))])
      setReel2(REEL_2_SYMBOLS[Math.floor(Math.random() * (REEL_2_SYMBOLS.length - 1))])
      setReel3(REEL_3_SYMBOLS[Math.floor(Math.random() * (REEL_3_SYMBOLS.length - 1))])
      setFeatureReel(FEATURE_REEL_SYMBOLS[Math.floor(Math.random() * FEATURE_REEL_SYMBOLS.length)])

      if (ticks >= spinTicks) {
        clearInterval(timer)
        finalizeSpin()
      }
    }, 55)
  }

  const finalizeSpin = () => {
    // Weighted selection for authentic JILI Money Coming
    const roll = Math.random()
    let r1 = 'blank'
    let r2 = 'blank'
    let r3 = 'blank'
    let fReel = '1x'

    if (roll < 0.28) {
      // 0 or blank on reel 1 (no win)
      r1 = Math.random() < 0.5 ? '0' : 'blank'
      r2 = Math.random() < 0.5 ? '0' : 'blank'
      r3 = Math.random() < 0.5 ? '0' : 'blank'
      fReel = '1x'
    } else if (roll < 0.65) {
      // Modest win e.g. 1 - 0 = 10x or 1 - 0 - 0 = 100x
      r1 = '1'
      r2 = Math.random() < 0.6 ? '0' : 'blank'
      r3 = r2 !== 'blank' && Math.random() < 0.4 ? '0' : 'blank'
      fReel = Math.random() < 0.3 ? '2x' : '1x'
    } else if (roll < 0.90) {
      // Good win: 5 - 0 or 10 - 0
      r1 = Math.random() < 0.5 ? '5' : '10'
      r2 = Math.random() < 0.7 ? '0' : '00'
      r3 = Math.random() < 0.4 ? '0' : 'blank'
      fReel = Math.random() < 0.5 ? '2x' : Math.random() < 0.8 ? '5x' : '10x'
    } else if (roll < 0.97) {
      // Big win or Respin
      r1 = '10'
      r2 = '00'
      r3 = Math.random() < 0.5 ? '0' : 'blank'
      fReel = Math.random() < 0.5 ? '5x' : '10x'
    } else {
      // Legendary Wheel of Fortune Trigger!
      r1 = '10'
      r2 = '00'
      r3 = '100'
      fReel = 'WHEEL'
    }

    setReel1(r1)
    setReel2(r2)
    setReel3(r3)
    setFeatureReel(fReel)
    playSound('reel-lock')

    // Calculate payout
    // Number formation: concatenate r1, r2, r3 if not blank
    let baseNumberStr = ''
    if (r1 !== 'blank') baseNumberStr += r1
    if (r1 !== 'blank' && r2 !== 'blank') baseNumberStr += r2
    if (r1 !== 'blank' && r2 !== 'blank' && r3 !== 'blank') baseNumberStr += r3

    const baseVal = baseNumberStr ? parseInt(baseNumberStr, 10) : 0
    let multiplier = 1

    if (fReel === '2x') multiplier = 2
    else if (fReel === '5x') multiplier = 5
    else if (fReel === '10x') multiplier = 10
    else if (fReel === 'RESPIN') multiplier = 1

    let totalWin = (baseVal > 0) ? (betAmount * (baseVal / 10) * multiplier) : 0

    if (fReel === 'WHEEL') {
      const wheelPrize = betAmount * 150
      totalWin += wheelPrize
      setWheelModal(wheelPrize)
      playSound('bigwin')
    }

    setSpinning(false)

    if (totalWin > 0) {
      setRoundWin(totalWin)
      playSound('win')
      setStatusMessage(`💰 MONEY COMING WIN! +Rs ${totalWin.toFixed(2)} (${fReel} Feature)`)

      if (isDemoMode) {
        addDemoBalance(totalWin)
      } else {
        fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || user?.uid || 'guest_player',
            email: user?.email || '',
            bet_amount: betAmount,
            win_amount: totalWin,
            multiplier: Number((totalWin / betAmount).toFixed(2)),
            game: 'JILI Money Coming'
          })
        }).then(() => {
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        }).catch(() => {})
      }

      if (totalWin >= betAmount * 5) {
        setBigWinOverlay(totalWin)
        playSound('bigwin')
      }
    } else {
      setStatusMessage('NO COMBO • SPIN AGAIN FOR THE 10,000x WHEEL')
    }

    // Auto spin continuation or Respin feature
    if (fReel === 'RESPIN' || autoSpinRef.current) {
      setTimeout(() => {
        handleSpin()
      }, turboMode ? 450 : 800)
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #062b1a 0%, #02120a 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 18px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Brand Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.22) 0%, rgba(2, 18, 10, 0.95) 100%)',
        border: '1.5px solid rgba(16, 185, 129, 0.5)',
        borderRadius: '12px',
        padding: '8px 12px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
          }}>
            💵
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399', letterSpacing: '0.04em' }}>
              MONEY COMING • JILI
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 600 }}>
              Direct Number Match • 4th Feature Reel 10,000x
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 900,
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)'
        }}>
          {featureReel}
        </div>
      </div>

      {/* Main 3 Number Reels + 4th Feature Reel Stage */}
      <div style={{
        background: 'linear-gradient(180deg, #051a10 0%, #010a05 100%)',
        border: '2px solid rgba(16, 185, 129, 0.55)',
        borderRadius: '16px',
        padding: '12px 8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr) 0.95fr',
        gap: '6px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.7)',
        position: 'relative',
        minHeight: '220px',
        alignItems: 'center'
      }}>
        {/* Reel 1 */}
        <div style={{
          height: '140px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #062b1a 0%, #02120a 100%)',
          border: '2px solid #34d399',
          boxShadow: '0 0 14px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#34d399', position: 'absolute', top: '6px' }}>REEL 1</div>
          <div style={{
            fontSize: reel1 === 'blank' ? '18px' : '36px',
            fontWeight: 900,
            color: reel1 === 'blank' ? '#64748b' : '#f8fafc',
            fontFamily: 'monospace, sans-serif',
            textShadow: reel1 === 'blank' ? 'none' : '0 0 14px #34d399'
          }}>
            {reel1 === 'blank' ? '—' : reel1}
          </div>
        </div>

        {/* Reel 2 */}
        <div style={{
          height: '140px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #062b1a 0%, #02120a 100%)',
          border: '2px solid #34d399',
          boxShadow: '0 0 14px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#34d399', position: 'absolute', top: '6px' }}>REEL 2</div>
          <div style={{
            fontSize: reel2 === 'blank' ? '18px' : '36px',
            fontWeight: 900,
            color: reel2 === 'blank' ? '#64748b' : '#f8fafc',
            fontFamily: 'monospace, sans-serif',
            textShadow: reel2 === 'blank' ? 'none' : '0 0 14px #34d399'
          }}>
            {reel2 === 'blank' ? '—' : reel2}
          </div>
        </div>

        {/* Reel 3 */}
        <div style={{
          height: '140px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #062b1a 0%, #02120a 100%)',
          border: '2px solid #34d399',
          boxShadow: '0 0 14px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#34d399', position: 'absolute', top: '6px' }}>REEL 3</div>
          <div style={{
            fontSize: reel3 === 'blank' ? '18px' : '32px',
            fontWeight: 900,
            color: reel3 === 'blank' ? '#64748b' : '#f8fafc',
            fontFamily: 'monospace, sans-serif',
            textShadow: reel3 === 'blank' ? 'none' : '0 0 14px #34d399'
          }}>
            {reel3 === 'blank' ? '—' : reel3}
          </div>
        </div>

        {/* 4th Feature Reel */}
        <div style={{
          height: '140px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #3b1d03 0%, #150901 100%)',
          border: '2px solid #fbbf24',
          boxShadow: '0 0 16px rgba(251, 191, 36, 0.6), inset 0 0 10px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '4px'
        }}>
          <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#fbbf24', position: 'absolute', top: '6px' }}>FEATURE</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#fbbf24',
            textAlign: 'center',
            textShadow: '0 0 12px rgba(251, 191, 36, 0.8)'
          }}>
            {featureReel === 'WHEEL' ? '🎡 WHEEL' : featureReel === 'RESPIN' ? '⚡ RESPIN' : featureReel}
          </div>
          <div style={{ fontSize: '7.5px', color: '#fed7aa', position: 'absolute', bottom: '6px' }}>4TH REEL</div>
        </div>

        {/* Big Win Pop-Up Overlay */}
        {bigWinOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 14, 8, 0.94)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>💵 💰 💵</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#34d399', letterSpacing: '0.06em' }}>
              MONEY COMING MEGA JACKPOT!
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', marginTop: '6px', fontFamily: 'monospace' }}>
              Rs {bigWinOverlay.toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => setBigWinOverlay(null)}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#000',
                border: 'none',
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              COLLECT CASH
            </button>
          </div>
        )}

        {/* Wheel of Fortune Trigger Modal */}
        {wheelModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(20, 10, 0, 0.95)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '46px', animation: 'spin 1.5s linear infinite' }}>🎡</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', marginTop: '8px' }}>
              LUCKY WHEEL OF FORTUNE!
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#fff', marginTop: '6px', fontFamily: 'monospace' }}>
              +Rs {wheelModal.toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => setWheelModal(null)}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                color: '#000',
                border: 'none',
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              TAKE JACKPOT
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Live Status Bar */}
      <div style={{
        marginTop: '8px',
        padding: '7px 12px',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        fontWeight: 800,
        color: roundWin > 0 ? '#34d399' : '#e2e8f0',
        textAlign: 'center',
        letterSpacing: '0.03em'
      }}>
        {statusMessage}
      </div>

      {/* Bet Amount Selector Chips */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
          BET CHIP:
        </div>
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
          {BET_OPTIONS.map(amt => (
            <button
              key={amt}
              type="button"
              disabled={spinning}
              onClick={() => setBetAmount(amt)}
              style={{
                background: betAmount === amt
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: betAmount === amt ? '#000' : '#e2e8f0',
                border: betAmount === amt ? '1px solid #6ee7b7' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Rs {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Spin Action */}
      <div style={{
        marginTop: '12px',
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Turbo Mode Toggle */}
        <button
          type="button"
          onClick={() => setTurboMode(!turboMode)}
          style={{
            background: turboMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: turboMode ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
            color: turboMode ? '#ef4444' : '#94a3b8',
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          ⚡ {turboMode ? 'TURBO ON' : 'TURBO'}
        </button>

        {/* Auto Spin Toggle */}
        <button
          type="button"
          onClick={() => {
            if (autoSpin) {
              setAutoSpin(false)
            } else {
              setAutoSpin(true)
              if (!spinning) handleSpin()
            }
          }}
          style={{
            background: autoSpin ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: autoSpin ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: autoSpin ? '#38bdf8' : '#94a3b8',
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          🔁 {autoSpin ? 'STOP' : 'AUTO'}
        </button>

        {/* Main Spin CTA Button */}
        <button
          type="button"
          disabled={spinning}
          onClick={handleSpin}
          style={{
            height: '46px',
            background: spinning
              ? 'rgba(100, 116, 139, 0.3)'
              : 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)',
            border: spinning ? '1px solid #475569' : '1px solid #6ee7b7',
            color: spinning ? '#64748b' : '#000',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            cursor: spinning ? 'not-allowed' : 'pointer',
            boxShadow: spinning ? 'none' : '0 4px 18px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>💵</span>
          <span>SPIN • Rs {betAmount}</span>
        </button>
      </div>
    </div>
  )
}
