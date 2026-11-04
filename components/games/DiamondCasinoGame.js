import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

const QUICK_TABLES = [
  { id: 'teen20', label: '20-20 Teenpatti', icon: '🃏', bg: 'https://cdn.betnex.co/images/jiligaming/133.webp' },
  { id: 'joker20', label: 'Teenpatti Joker', icon: '🤡', bg: 'https://cdn.betnex.co/images/jiligaming/131.png' },
  { id: 'teen', label: '1-Day Teenpatti', icon: '👑', bg: 'https://cdn.betnex.co/images/jiligaming/126.webp' },
  { id: 'ab20', label: 'Andar Bahar 20', icon: '🎴', bg: 'https://cdn.betnex.co/images/jiligaming/128.png' },
  { id: 'lucky7', label: 'Lucky 7 - A', icon: '7️⃣', bg: 'https://cdn.betnex.co/images/jiligaming/90.png' },
  { id: 'dt20', label: 'Dragon Tiger 20', icon: '🐉', bg: 'https://cdn.betnex.co/images/jiligaming/93.png' },
  { id: 'card32', label: '32 Cards - A', icon: '🔢', bg: 'https://cdn.betnex.co/images/evolutionlive/17.png' },
  { id: 'amar', label: 'Amar Akbar Anthony', icon: '🎬', bg: 'https://cdn.betnex.co/images/evolutionlive/47.png' },
  { id: 'baccarat', label: 'Speed Baccarat', icon: '🏦', bg: 'https://cdn.betnex.co/images/jiligaming/174.png' }
]

const CHIPS = [20, 50, 100, 500, 1000, 5000]

const SUITS = [
  { symbol: '♠', red: false },
  { symbol: '♥', red: true },
  { symbol: '♣', red: false },
  { symbol: '♦', red: true }
]
const RANKS = [
  { label: 'A', val: 14, num: 1 },
  { label: 'K', val: 13, num: 13 },
  { label: 'Q', val: 12, num: 12 },
  { label: 'J', val: 11, num: 11 },
  { label: '10', val: 10, num: 10 },
  { label: '9', val: 9, num: 9 },
  { label: '8', val: 8, num: 8 },
  { label: '7', val: 7, num: 7 },
  { label: '6', val: 6, num: 6 },
  { label: '5', val: 5, num: 5 },
  { label: '4', val: 4, num: 4 },
  { label: '3', val: 3, num: 3 },
  { label: '2', val: 2, num: 2 }
]

function generateDeck() {
  const deck = []
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({
        rank: r.label,
        val: r.val,
        num: r.num,
        suit: s.symbol,
        red: s.red
      })
    }
  }
  return deck
}

function drawCards(count = 6) {
  const d = generateDeck()
  const out = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * d.length)
    out.push(d.splice(idx, 1)[0])
  }
  return out
}

function score3Cards(cards) {
  if (!cards || cards.length < 3) return { score: 0, desc: 'High Card', pairPlus: false }
  const sorted = [...cards].sort((a, b) => b.val - a.val)
  const [c1, c2, c3] = sorted
  const isFlush = c1.suit === c2.suit && c2.suit === c3.suit
  const isSeq =
    (c1.val - c2.val === 1 && c2.val - c3.val === 1) ||
    (c1.val === 14 && c2.val === 3 && c3.val === 2)
  const isTrail = c1.val === c2.val && c2.val === c3.val
  const isPair = c1.val === c2.val || c2.val === c3.val || c1.val === c3.val

  if (isTrail) return { score: 600 + c1.val, desc: `Trail (${c1.rank}-${c1.rank}-${c1.rank})`, pairPlus: true }
  if (isFlush && isSeq) return { score: 500 + c1.val, desc: 'Pure Sequence', pairPlus: true }
  if (isSeq) return { score: 400 + c1.val, desc: 'Sequence', pairPlus: true }
  if (isFlush) return { score: 300 + c1.val, desc: 'Color / Flush', pairPlus: true }
  if (isPair) {
    const pVal = c1.val === c2.val ? c1.val : c2.val
    const pRank = c1.val === c2.val ? c1.rank : c2.rank
    return { score: 200 + pVal, desc: `Pair of ${pRank}s`, pairPlus: true }
  }
  return { score: 100 + c1.val, desc: `${c1.rank} High`, pairPlus: false }
}

function PlayingCard({ card, revealed, highlight }) {
  return (
    <div
      style={{
        width: '46px',
        height: '66px',
        borderRadius: '8px',
        background: revealed && card
          ? 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #14532d 0%, #052e16 100%)',
        border: highlight
          ? '2.5px solid #fbbf24'
          : revealed && card
            ? '1.5px solid #cbd5e1'
            : '1.5px solid #22c55e',
        boxShadow: highlight
          ? '0 0 16px rgba(251, 191, 36, 0.8)'
          : '0 4px 10px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 5px',
        color: revealed && card ? (card.red ? '#dc2626' : '#0f172a') : '#4ade80',
        fontWeight: 900,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        transform: revealed ? 'scale(1)' : 'scale(0.96)',
        userSelect: 'none'
      }}
    >
      {revealed && card ? (
        <>
          <div style={{ alignSelf: 'flex-start', fontSize: '11px', lineHeight: 1 }}>{card.rank}</div>
          <div style={{ fontSize: '20px', lineHeight: 1 }}>{card.suit}</div>
          <div style={{ alignSelf: 'flex-end', fontSize: '10px', lineHeight: 1 }}>{card.rank}</div>
        </>
      ) : (
        <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '16px' }}>💎</span>
          <span style={{ fontSize: '7px', color: '#4ade80', letterSpacing: '0.04em' }}>WINX</span>
        </div>
      )}
    </div>
  )
}

export default function DiamondCasinoGame({
  initialTableId = 'teen20',
  user,
  wallet,
  fetchWallet,
  isDemoMode,
  demoBalance,
  spendDemoBalance,
  addDemoBalance
}) {
  const [tableId, setTableId] = useState(initialTableId)
  const [tableMeta, setTableMeta] = useState(null)
  const [selectedChip, setSelectedChip] = useState(50)
  const [stagedBets, setStagedBets] = useState([])
  const [lastBets, setLastBets] = useState([])
  const [countdown, setCountdown] = useState(10)
  const [roundState, setRoundState] = useState('BETTING') // 'BETTING' | 'DEALING' | 'RESULT'
  const [mid, setMid] = useState(() => Math.floor(Date.now() / 1000))
  const [dealtCards, setDealtCards] = useState(() => drawCards(6))
  const [revealedCount, setRevealedCount] = useState(6)
  const [roundOutcome, setRoundOutcome] = useState(null)
  const [recentWinners, setRecentWinners] = useState(['A', 'B', 'A', 'A', 'B', 'A', 'B', 'B', 'A', 'A'])
  const [rulesModal, setRulesModal] = useState(false)

  const currentBalance = isDemoMode ? Number(demoBalance || 0) : Number(wallet?.balance ?? 150)
  const totalStagedStake = stagedBets.reduce((sum, b) => sum + b.stake, 0)
  const activeTable = QUICK_TABLES.find(t => t.id === tableId) || QUICK_TABLES[0]

  // Safe voice dealer announcer
  const speakDealer = useCallback((text) => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate = 1.05
      utt.pitch = 1.1
      utt.volume = 0.8
      window.speechSynthesis.speak(utt)
    } catch (e) {}
  }, [])

  // Poll live table data from RapidAPI
  useEffect(() => {
    let mounted = true
    fetch(`/api/diamond/getCasinoTableData?tableid=${encodeURIComponent(tableId)}`)
      .then(r => r.json())
      .then(json => {
        if (!mounted || !json?.data) return
        setTableMeta(json)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [tableId])

  // Runners definition (live odds from API if available, else standard)
  const runners = tableMeta?.data?.t2 || [
    { sid: '1', nat: 'Player A', b1: 1.98, l1: 2.02 },
    { sid: '2', nat: 'Player B', b1: 1.98, l1: 2.02 },
    { sid: '3', nat: 'Pair Plus A', b1: 3.00, l1: 0 },
    { sid: '4', nat: 'Pair Plus B', b1: 3.00, l1: 0 }
  ]

  // Add chip stake to a runner
  const handlePlaceChip = (runner, side = 'BACK') => {
    if (roundState !== 'BETTING') return
    const odds = side === 'BACK' ? Number(runner.b1) : Number(runner.l1)
    if (!odds || odds <= 0) return

    if (totalStagedStake + selectedChip > currentBalance) {
      setRoundOutcome({
        isError: true,
        text: `⚠️ Insufficient Balance (Rs ${currentBalance.toFixed(2)}) for Rs ${selectedChip} Chip!`
      })
      return
    }

    setRoundOutcome(null)
    setStagedBets(prev => {
      const idx = prev.findIndex(b => b.sid === runner.sid && b.side === side)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], stake: copy[idx].stake + selectedChip }
        return copy
      }
      return [...prev, { sid: runner.sid, nat: runner.nat, stake: selectedChip, odds, side }]
    })

    try {
      casinoAudio.playReelTick()
    } catch (e) {}
  }

  // Evaluate 6 dealt cards
  const evaluateHands = (cards) => {
    const handA = score3Cards(cards.slice(0, 3))
    const handB = score3Cards(cards.slice(3, 6))
    const aWins = handA.score >= handB.score
    const winnerNat = aWins ? 'Player A' : 'Player B'
    const winSids = [aWins ? '1' : '2']
    if (handA.pairPlus) winSids.push('3')
    if (handB.pairPlus) winSids.push('4')

    return {
      aWins,
      winnerNat,
      winningSide: aWins ? 'A' : 'B',
      handDescA: handA.desc,
      handDescB: handB.desc,
      winSids
    }
  }

  // Continuous Game Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Transition state
          if (roundState === 'BETTING') {
            triggerDealRound()
            return 3 // 3s dealing animation
          } else if (roundState === 'DEALING') {
            triggerResolveRound()
            return 4 // 4s result showcase
          } else {
            // Back to BETTING
            triggerNewRound()
            return 12 // 12s betting window
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [roundState, stagedBets])

  // Trigger Deal Round: Lock bets, debit wallet, flip cards
  const triggerDealRound = async () => {
    setRoundState('DEALING')
    speakDealer('Bets are closed.')

    // Debit staged bets
    const totalStake = stagedBets.reduce((s, b) => s + b.stake, 0)
    if (totalStake > 0) {
      setLastBets(stagedBets)
      if (isDemoMode) {
        spendDemoBalance(totalStake)
      } else {
        try {
          await fetch('/api/wallet/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id || user?.uid || 'guest_player',
              email: user?.email || '',
              amount: totalStake,
              game: `Diamond ${activeTable.label}`
            })
          })
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        } catch (e) {}
      }
    }

    // Draw new cards and animate flips
    const freshCards = drawCards(6)
    setDealtCards(freshCards)
    setRevealedCount(0)

    for (let i = 1; i <= 6; i++) {
      setTimeout(() => {
        setRevealedCount(i)
      }, i * 200)
    }
  }

  // Resolve Round: Payout winnings, speak winner, update history
  const triggerResolveRound = async () => {
    setRoundState('RESULT')
    const evalRes = evaluateHands(dealtCards)
    speakDealer(`${evalRes.winnerNat} Wins!`)

    setRecentWinners(prev => [evalRes.winningSide, ...prev.slice(0, 9)])

    const totalStake = stagedBets.reduce((s, b) => s + b.stake, 0)
    if (totalStake > 0) {
      let totalPayout = 0
      for (const b of stagedBets) {
        const isHit = evalRes.winSids.includes(String(b.sid))
        if (b.side === 'BACK' && isHit) {
          totalPayout += Number((b.stake * b.odds).toFixed(2))
        } else if (b.side === 'LAY' && !isHit) {
          totalPayout += Number((b.stake * 1.95).toFixed(2))
        }
      }

      if (totalPayout > 0) {
        if (isDemoMode) {
          addDemoBalance(totalPayout)
        } else {
          try {
            await fetch('/api/wallet/payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user?.id || user?.uid || 'guest_player',
                email: user?.email || '',
                bet_amount: totalStake,
                win_amount: totalPayout,
                multiplier: Number((totalPayout / totalStake).toFixed(2)),
                game: `Diamond ${activeTable.label}`
              })
            })
            if (fetchWallet) fetchWallet()
            window.dispatchEvent(new Event('wallet-updated'))
          } catch (e) {}
        }
        setRoundOutcome({
          won: true,
          text: `🎉 WON Rs ${totalPayout.toLocaleString('en-PK', { minimumFractionDigits: 2 })}! ${evalRes.winnerNat} Wins!`
        })
        try {
          casinoAudio.playBigWin()
        } catch (e) {}
      } else {
        setRoundOutcome({
          won: false,
          text: `🏆 ${evalRes.winnerNat} Wins! Better luck next hand.`
        })
      }
    } else {
      setRoundOutcome({
        won: false,
        neutral: true,
        text: `Live Round #${mid}: ${evalRes.winnerNat} Wins (${evalRes.winningSide === 'A' ? evalRes.handDescA : evalRes.handDescB})`
      })
    }
  }

  // Trigger New Round: Reset bets, new MID, announce bets open
  const triggerNewRound = () => {
    setRoundState('BETTING')
    setStagedBets([])
    setRoundOutcome(null)
    setMid(prev => prev + 1)
    setRevealedCount(6) // show previous hand while betting
    speakDealer('Bets open, place your chips.')
  }

  const currentEval = evaluateHands(dealtCards)

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #062414 0%, #021208 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 24px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Horizontal Quick Table Selector */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '6px',
        scrollbarWidth: 'none'
      }}>
        {QUICK_TABLES.map(qt => (
          <button
            key={qt.id}
            type="button"
            onClick={() => setTableId(qt.id)}
            style={{
              background: tableId === qt.id
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.06)',
              color: tableId === qt.id ? '#000' : '#e2e8f0',
              border: tableId === qt.id ? '1px solid #6ee7b7' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '5px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{qt.icon}</span>
            <span>{qt.label}</span>
          </button>
        ))}
      </div>

      {/* 3D TV Studio Dealer Broadcast Stage */}
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #09331d 0%, #03170d 100%)',
        border: '2px solid rgba(16, 185, 129, 0.45)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 0 20px rgba(0,0,0,0.8)',
        padding: '10px 12px',
        position: 'relative'
      }}>
        {/* Top Broadcast Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 900,
              padding: '2px 7px',
              borderRadius: '999px',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}>
              ● LIVE TV STUDIO
            </span>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#fef08a' }}>
              {activeTable.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
              MID: #{mid}
            </span>
            <button
              type="button"
              onClick={() => setRulesModal(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Rules ⓘ
            </button>
          </div>
        </div>

        {/* Felt Card Arena */}
        <div style={{
          background: 'rgba(4, 20, 11, 0.85)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          padding: '12px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '6px'
        }}>
          {/* Player A Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#4ade80' }}>
                PLAYER A
              </span>
              {roundState === 'RESULT' && currentEval.winningSide === 'A' && (
                <span style={{ background: '#fbbf24', color: '#000', fontSize: '8px', fontWeight: 900, padding: '1px 4px', borderRadius: '4px' }}>
                  WIN
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <PlayingCard card={dealtCards[0]} revealed={revealedCount >= 1} highlight={roundState === 'RESULT' && currentEval.winningSide === 'A'} />
              <PlayingCard card={dealtCards[1]} revealed={revealedCount >= 3} highlight={roundState === 'RESULT' && currentEval.winningSide === 'A'} />
              <PlayingCard card={dealtCards[2]} revealed={revealedCount >= 5} highlight={roundState === 'RESULT' && currentEval.winningSide === 'A'} />
            </div>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
              {revealedCount >= 5 ? currentEval.handDescA : 'Dealing...'}
            </div>
          </div>

          {/* Center VS Badge */}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1.5px solid #fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 900,
            color: '#fbbf24'
          }}>
            VS
          </div>

          {/* Player B Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>
                PLAYER B
              </span>
              {roundState === 'RESULT' && currentEval.winningSide === 'B' && (
                <span style={{ background: '#fbbf24', color: '#000', fontSize: '8px', fontWeight: 900, padding: '1px 4px', borderRadius: '4px' }}>
                  WIN
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <PlayingCard card={dealtCards[3]} revealed={revealedCount >= 2} highlight={roundState === 'RESULT' && currentEval.winningSide === 'B'} />
              <PlayingCard card={dealtCards[4]} revealed={revealedCount >= 4} highlight={roundState === 'RESULT' && currentEval.winningSide === 'B'} />
              <PlayingCard card={dealtCards[5]} revealed={revealedCount >= 6} highlight={roundState === 'RESULT' && currentEval.winningSide === 'B'} />
            </div>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
              {revealedCount >= 6 ? currentEval.handDescB : 'Dealing...'}
            </div>
          </div>
        </div>

        {/* Live Dealer Status & Countdown */}
        <div style={{
          marginTop: '8px',
          background: roundState === 'BETTING'
            ? 'rgba(16, 185, 129, 0.15)'
            : roundState === 'DEALING'
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(56, 189, 248, 0.15)',
          border: `1px solid ${roundState === 'BETTING' ? '#10b981' : roundState === 'DEALING' ? '#f59e0b' : '#38bdf8'}`,
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>
            {roundState === 'BETTING' && '🟢 BETTING OPEN — PLACE YOUR CHIPS'}
            {roundState === 'DEALING' && '🟡 DEALER DEALING CARDS...'}
            {roundState === 'RESULT' && '🔵 ROUND RESULT SHOWCASE'}
          </div>
          <div style={{
            background: '#ef4444',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 900,
            fontFamily: 'monospace'
          }}>
            {countdown}s
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {roundOutcome && (
        <div style={{
          marginTop: '8px',
          padding: '7px 12px',
          borderRadius: '8px',
          background: roundOutcome.isError
            ? 'rgba(239, 68, 68, 0.2)'
            : roundOutcome.won
              ? 'rgba(16, 185, 129, 0.25)'
              : 'rgba(15, 23, 42, 0.75)',
          border: `1px solid ${roundOutcome.isError ? '#ef4444' : roundOutcome.won ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
          fontSize: '11px',
          fontWeight: 800,
          color: roundOutcome.won ? '#34d399' : '#fff',
          textAlign: 'center'
        }}>
          {roundOutcome.text}
        </div>
      )}

      {/* Chip Stake Selector */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
          CHIP STAKE:
        </div>
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
          {CHIPS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedChip(c)}
              style={{
                background: selectedChip === c
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: selectedChip === c ? '#000' : '#e2e8f0',
                border: selectedChip === c ? '1px solid #fef08a' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Rs {c}
            </button>
          ))}
        </div>
      </div>

      {/* Live Market Runners (Back & Lay Odds Table) */}
      <div style={{
        marginTop: '10px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: '#0a1810'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontSize: '10px',
          fontWeight: 900,
          color: '#94a3b8'
        }}>
          <div>MARKET RUNNER (MIN: Rs 20)</div>
          <div style={{ textAlign: 'center', color: '#38bdf8' }}>BACK</div>
          <div style={{ textAlign: 'center', color: '#f43f5e' }}>LAY</div>
        </div>

        {runners.map(r => {
          const stagedBack = stagedBets.find(b => b.sid === r.sid && b.side === 'BACK')
          const stagedLay = stagedBets.find(b => b.sid === r.sid && b.side === 'LAY')

          return (
            <div
              key={r.sid}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                padding: '6px 10px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              <div>
                <div style={{ color: '#f8fafc' }}>{r.nat}</div>
                {(stagedBack || stagedLay) && (
                  <div style={{ fontSize: '9px', color: '#34d399' }}>
                    Bet: Rs {(stagedBack?.stake || 0) + (stagedLay?.stake || 0)}
                  </div>
                )}
              </div>

              {/* Back Button (Blue) */}
              <button
                type="button"
                disabled={roundState !== 'BETTING' || !r.b1}
                onClick={() => handlePlaceChip(r, 'BACK')}
                style={{
                  background: stagedBack ? '#0284c7' : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 4px',
                  margin: '0 4px',
                  cursor: roundState === 'BETTING' ? 'pointer' : 'not-allowed',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '12px'
                }}
              >
                <div>{r.b1 || '—'}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>BACK</div>
              </button>

              {/* Lay Button (Pink) */}
              <button
                type="button"
                disabled={roundState !== 'BETTING' || !r.l1}
                onClick={() => handlePlaceChip(r, 'LAY')}
                style={{
                  background: stagedLay ? '#e11d48' : 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 4px',
                  margin: '0 4px',
                  cursor: roundState === 'BETTING' ? 'pointer' : 'not-allowed',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '12px'
                }}
              >
                <div>{r.l1 || '—'}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>LAY</div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Last 10 Results Bar */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>
          LAST 10 RESULTS:
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {recentWinners.map((w, idx) => (
            <span
              key={idx}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: w === 'A' ? '#10b981' : '#38bdf8',
                color: '#000',
                fontSize: '9px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Rules Modal */}
      {rulesModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#0d2416',
            border: '1px solid #10b981',
            borderRadius: '16px',
            padding: '18px',
            maxWidth: '380px',
            color: '#fff'
          }}>
            <h3 style={{ margin: '0 0 10px', color: '#fef08a' }}>{activeTable.label} Rules</h3>
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#cbd5e1' }}>
              • Highest hand wins: Trail (Trio) &gt; Pure Sequence &gt; Sequence &gt; Color (Flush) &gt; Pair &gt; High Card.<br />
              • Place BACK to bet on a player to win.<br />
              • Place LAY to bet against that player.<br />
              • Pair Plus bets pay 3.00x if that player holds a Pair or better.
            </p>
            <button
              type="button"
              onClick={() => setRulesModal(false)}
              style={{
                marginTop: '12px',
                width: '100%',
                background: '#10b981',
                color: '#000',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
