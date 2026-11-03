import React, { useState, useEffect, useRef } from 'react'

const QUICK_TABLES = [
  { id: 'teen20', label: '20-20 Teenpatti', icon: '🃏', bg: 'https://cdn.betnex.co/images/jiligaming/133.webp' },
  { id: 'joker20', label: 'Teenpatti Joker', icon: '🤡', bg: 'https://cdn.betnex.co/images/jiligaming/131.png' },
  { id: 'teen', label: '1-Day Teenpatti', icon: '👑', bg: 'https://cdn.betnex.co/images/jiligaming/126.webp' },
  { id: 'teen9', label: 'Teenpatti Test', icon: '🐯', bg: 'https://cdn.betnex.co/images/jdb/115.png' },
  { id: 'ab20', label: 'Andar Bahar 20', icon: '🎴', bg: 'https://cdn.betnex.co/images/jiligaming/128.png' },
  { id: 'abj', label: 'Andar Bahar 2', icon: '💎', bg: 'https://cdn.betnex.co/images/evolutionlive/42.webp' },
  { id: 'lucky7', label: 'Lucky 7 - A', icon: '7️⃣', bg: 'https://cdn.betnex.co/images/jiligaming/90.png' },
  { id: 'lucky7eu', label: 'Lucky 7 - B', icon: '🎰', bg: 'https://cdn.betnex.co/images/jiligaming/17.png' },
  { id: 'dt20', label: 'Dragon Tiger 20', icon: '🐉', bg: 'https://cdn.betnex.co/images/jiligaming/93.png' },
  { id: 'dtl20', label: 'Dragon Tiger Lion', icon: '🦁', bg: 'https://cdn.betnex.co/images/jiligaming/15.webp' },
  { id: 'card32', label: '32 Cards - A', icon: '🔢', bg: 'https://cdn.betnex.co/images/evolutionlive/17.png' },
  { id: 'amar', label: 'Amar Akbar Anthony', icon: '🎬', bg: 'https://cdn.betnex.co/images/evolutionlive/47.png' },
  { id: 'btable', label: 'Bollywood Table', icon: '🌟', bg: 'https://cdn.betnex.co/images/jiligaming/39.webp' },
  { id: 'worli', label: 'Worli Matka', icon: '🏺', bg: 'https://cdn.betnex.co/images/jiligaming/102.png' },
  { id: 'poker20', label: '20-20 Poker', icon: '♠️', bg: 'https://cdn.betnex.co/images/jiligaming/92.png' },
  { id: 'baccarat', label: 'Speed Baccarat', icon: '🏦', bg: 'https://cdn.betnex.co/images/jiligaming/174.png' },
  { id: 'cmatch20', label: 'Cricket 20-20', icon: '🏏', bg: 'https://cdn.betnex.co/images/jiligaming/196.webp' },
  { id: 'superover', label: 'Super Over PAKvIND', icon: '🏆', bg: 'https://cdn.betnex.co/images/jiligaming/76.png' }
]

const CHIPS = [20, 50, 100, 500, 1000, 5000]

const FULL_DECK = []
const SUIT_LIST = [
  { code: 'SS', symbol: '♠', red: false },
  { code: 'HH', symbol: '♥', red: true },
  { code: 'CC', symbol: '♣', red: false },
  { code: 'DD', symbol: '♦', red: true }
]
const RANK_LIST = [
  { label: 'A', val: 14, num: 1 },
  { label: '2', val: 2, num: 2 },
  { label: '3', val: 3, num: 3 },
  { label: '4', val: 4, num: 4 },
  { label: '5', val: 5, num: 5 },
  { label: '6', val: 6, num: 6 },
  { label: '7', val: 7, num: 7 },
  { label: '8', val: 8, num: 8 },
  { label: '9', val: 9, num: 9 },
  { label: '10', val: 10, num: 10 },
  { label: 'J', val: 11, num: 11 },
  { label: 'Q', val: 12, num: 12 },
  { label: 'K', val: 13, num: 13 }
]
for (const s of SUIT_LIST) {
  for (const r of RANK_LIST) {
    FULL_DECK.push({
      code: `${r.label}${s.code}`,
      rank: r.label,
      val: r.val,
      num: r.num,
      suit: s.symbol,
      red: s.red
    })
  }
}

function drawUniqueCards(count = 6) {
  const copy = [...FULL_DECK]
  const out = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

function score3CardHand(cards) {
  if (!cards || cards.length < 3) return { score: 0, name: 'High Card', isPairPlus: false }
  const sorted = [...cards].sort((a, b) => b.val - a.val)
  const [c1, c2, c3] = sorted
  const isFlush = c1.suit === c2.suit && c2.suit === c3.suit
  const isSeq =
    (c1.val - c2.val === 1 && c2.val - c3.val === 1) ||
    (c1.val === 14 && c2.val === 3 && c3.val === 2)
  const isTrail = c1.val === c2.val && c2.val === c3.val
  const isPair = c1.val === c2.val || c2.val === c3.val || c1.val === c3.val

  if (isTrail) return { score: 600 + c1.val, name: `Trail (${c1.rank}-${c1.rank}-${c1.rank})`, isPairPlus: true }
  if (isFlush && isSeq) return { score: 500 + c1.val, name: 'Pure Sequence', isPairPlus: true }
  if (isSeq) return { score: 400 + c1.val, name: 'Sequence', isPairPlus: true }
  if (isFlush) return { score: 300 + c1.val, name: 'Color / Flush', isPairPlus: true }
  if (isPair) {
    const pairVal = c1.val === c2.val ? c1.val : c2.val
    return { score: 200 + pairVal + c1.val * 0.01, name: `Pair of ${c1.val === c2.val ? c1.rank : c2.rank}s`, isPairPlus: true }
  }
  return { score: 100 + c1.val + c2.val * 0.1 + c3.val * 0.01, name: `${c1.rank} High`, isPairPlus: false }
}

function PlayingCard3D({ card, revealed, highlight }) {
  return (
    <div
      style={{
        width: '44px',
        height: '62px',
        borderRadius: '8px',
        background: revealed && card
          ? 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #163a26 0%, #091a10 100%)',
        border: highlight
          ? '2px solid #ffd54f'
          : revealed && card
            ? '1.5px solid #cbd5e1'
            : '1.5px solid #6dff38',
        boxShadow: highlight
          ? '0 0 14px rgba(255, 213, 79, 0.75)'
          : '0 4px 10px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 5px',
        color: revealed && card ? (card.red ? '#dc2626' : '#0f172a') : '#6dff38',
        fontWeight: 900,
        transition: 'all 0.25s ease',
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
          <span style={{ fontSize: '7px', color: '#86ff47', letterSpacing: '0.5px' }}>WINX</span>
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
  const [stagedBets, setStagedBets] = useState([]) // [{ sid, nat, stake, odds, side }]
  const [lastStagedBets, setLastStagedBets] = useState([])
  const [dealing, setDealing] = useState(false)
  const [revealedCount, setRevealedCount] = useState(6)
  const [dealtCards, setDealtCards] = useState(() => drawUniqueCards(6))
  const [roundOutcome, setRoundOutcome] = useState(null)
  const [countdown, setCountdown] = useState(12)
  const [midCounter, setMidCounter] = useState(() => Math.floor(Date.now() / 1000))
  const [recentResults, setRecentResults] = useState([])
  const [rulesModal, setRulesModal] = useState(null)
  const [detailResultModal, setDetailResultModal] = useState(null)

  const stagedBetsRef = useRef(stagedBets)
  stagedBetsRef.current = stagedBets
  const dealingRef = useRef(dealing)
  dealingRef.current = dealing

  useEffect(() => {
    if (initialTableId) setTableId(initialTableId)
  }, [initialTableId])

  // Load table runners & initial results when tableId changes
  useEffect(() => {
    let mounted = true
    setStagedBets([])
    setRoundOutcome(null)
    setCountdown(12)

    fetch(`/api/diamond/getCasinoTableData?tableid=${encodeURIComponent(tableId)}`)
      .then(r => r.json())
      .then(json => {
        if (!mounted || !json?.data) return
        setTableMeta(json)
        setRecentResults(json.data.results || [])
        // Deal an initial visible showcase hand so the table looks alive immediately
        const initialCards = drawUniqueCards(6)
        setDealtCards(initialCards)
        setRevealedCount(6)
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [tableId])

  const runners = tableMeta?.data?.t2 || [
    { sid: '1', nat: 'Player A', short: 'A', b1: 1.98, l1: 2.02 },
    { sid: '2', nat: 'Player B', short: 'B', b1: 1.98, l1: 2.02 },
    { sid: '3', nat: 'Pair Plus A', short: 'PA', b1: 3.00, l1: 0 },
    { sid: '4', nat: 'Pair Plus B', short: 'PB', b1: 3.00, l1: 0 }
  ]

  const currentQuickTable = QUICK_TABLES.find(q => q.id === tableId) || QUICK_TABLES[0]
  const totalStagedStake = stagedBets.reduce((sum, b) => sum + b.stake, 0)
  const currentBalance = isDemoMode ? Number(demoBalance || 0) : Number(wallet?.balance ?? 150)

  // Add a chip bet on a runner (BACK or LAY)
  const handleStageBet = (runner, side = 'BACK') => {
    if (dealing) return
    const odds = side === 'BACK' ? Number(runner.b1) : Number(runner.l1)
    if (!odds || odds <= 0) return

    if (totalStagedStake + selectedChip > currentBalance) {
      setRoundOutcome({
        won: false,
        isError: true,
        text: `⚠️ Insufficient balance (Rs ${currentBalance.toFixed(2)}) to add Rs ${selectedChip} chip!`
      })
      return
    }

    setRoundOutcome(null)
    setStagedBets(prev => {
      const existingIdx = prev.findIndex(b => b.sid === runner.sid && b.side === side)
      if (existingIdx !== -1) {
        const copy = [...prev]
        copy[existingIdx] = {
          ...copy[existingIdx],
          stake: copy[existingIdx].stake + selectedChip
        }
        return copy
      }
      return [
        ...prev,
        {
          sid: runner.sid,
          nat: runner.nat,
          short: runner.short || runner.nat.charAt(0),
          stake: selectedChip,
          odds,
          side
        }
      ]
    })
  }

  // Evaluate winner for any of the 18 Diamond tables from the 6 dealt cards
  const evaluateTableOutcome = (cards) => {
    const handA = score3CardHand(cards.slice(0, 3))
    const handB = score3CardHand(cards.slice(3, 6))
    const primaryCard = cards[0]

    // Lucky 7 tables
    if (tableId === 'lucky7' || tableId === 'lucky7eu') {
      const winSids = []
      let mainWinner = runners[0]
      if (primaryCard.num < 7) {
        winSids.push('1')
        mainWinner = runners[0]
      } else if (primaryCard.num > 7) {
        winSids.push('2')
        mainWinner = runners[1]
      } else {
        winSids.push('3')
        mainWinner = runners[2] || runners[0]
      }
      if (primaryCard.num % 2 === 0) winSids.push('4')
      else winSids.push('5')
      if (primaryCard.red) winSids.push('6')
      else winSids.push('7')

      return {
        winSids,
        winnerName: `${mainWinner.nat} (${primaryCard.rank}${primaryCard.suit})`,
        shortLabel: mainWinner.short || (primaryCard.num < 7 ? 'L' : primaryCard.num > 7 ? 'H' : '7'),
        handDescA: `Card: ${primaryCard.rank}${primaryCard.suit}`,
        handDescB: primaryCard.num < 7 ? 'Low (A-6)' : primaryCard.num > 7 ? 'High (8-K)' : 'Exact 7!',
        winningSide: primaryCard.num <= 7 ? 'A' : 'B'
      }
    }

    // Dragon Tiger 20-20
    if (tableId === 'dt20') {
      const dCard = cards[0]
      const tCard = cards[3]
      const winSids = []
      let mainWinner = runners[0]
      if (dCard.num > tCard.num) {
        winSids.push('1')
        mainWinner = runners[0]
      } else if (tCard.num > dCard.num) {
        winSids.push('2')
        mainWinner = runners[1]
      } else {
        winSids.push('3')
        if (dCard.suit === tCard.suit) winSids.push('4')
        mainWinner = runners[2]
      }
      return {
        winSids,
        winnerName: `${mainWinner.nat} (${dCard.rank}${dCard.suit} vs ${tCard.rank}${tCard.suit})`,
        shortLabel: mainWinner.short || mainWinner.nat.charAt(0),
        handDescA: `Dragon: ${dCard.rank}${dCard.suit}`,
        handDescB: `Tiger: ${tCard.rank}${tCard.suit}`,
        winningSide: dCard.num >= tCard.num ? 'A' : 'B'
      }
    }

    // Default / Teenpatti / Andar Bahar / Poker / Baccarat / 32 Cards / Cricket / Bollywood
    const aWins = handA.score >= handB.score
    const mainWinner = aWins ? runners[0] : (runners[1] || runners[0])
    const winSids = [mainWinner.sid]
    if (handA.isPairPlus) winSids.push('3')
    if (handB.isPairPlus) winSids.push('4')

    return {
      winSids,
      winnerName: mainWinner.nat,
      shortLabel: mainWinner.short || (aWins ? 'A' : 'B'),
      handDescA: handA.name,
      handDescB: handB.name,
      winningSide: aWins ? 'A' : 'B'
    }
  }

  // Execute a full deal (either triggered by "DEAL HAND NOW" button or by the 12s live timer)
  const executeDealRound = async (customBets) => {
    if (dealingRef.current) return
    const betsToPlay = customBets !== undefined ? customBets : stagedBetsRef.current
    const totalBet = betsToPlay.reduce((s, b) => s + b.stake, 0)

    setDealing(true)
    setRevealedCount(0)
    setRoundOutcome(null)
    const nextMid = midCounter + 1
    setMidCounter(nextMid)

    // 1. If the player placed chips, debit their wallet first
    if (totalBet > 0) {
      setLastStagedBets(betsToPlay)
      if (isDemoMode) {
        if (demoBalance < totalBet) {
          setDealing(false)
          setRevealedCount(6)
          setRoundOutcome({ won: false, isError: true, text: '⚠️ Insufficient Demo Balance!' })
          return
        }
        spendDemoBalance(totalBet)
      } else {
        try {
          const res = await fetch('/api/wallet/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id || user?.uid || 'guest_player',
              email: user?.email || '',
              amount: totalBet,
              game: `Diamond ${tableMeta?.tableName || tableId}`
            })
          })
          const data = await res.json()
          if (!res.ok || !data.success) {
            setDealing(false)
            setRevealedCount(6)
            setRoundOutcome({ won: false, isError: true, text: `⚠️ ${data.error || 'Insufficient PKR balance!'}` })
            return
          }
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        } catch (e) {
          setDealing(false)
          setRevealedCount(6)
          setRoundOutcome({ won: false, isError: true, text: '⚠️ Network error submitting bet.' })
          return
        }
      }
    }

    // 2. Draw 6 fresh cards and animate card-by-card reveal
    const newCards = drawUniqueCards(6)
    setDealtCards(newCards)

    for (let step = 1; step <= 6; step++) {
      setTimeout(() => {
        setRevealedCount(step)
      }, step * 180)
    }

    // 3. Evaluate outcome after all 6 cards flip face-up
    setTimeout(async () => {
      const outcome = evaluateTableOutcome(newCards)

      setRecentResults(prev => [
        {
          mid: String(nextMid),
          winnerName: outcome.winnerName,
          shortLabel: outcome.shortLabel,
          cards: newCards.map(c => `${c.rank}${c.suit}`).join(' ')
        },
        ...prev.slice(0, 9)
      ])

      if (totalBet > 0) {
        let totalPayout = 0
        for (const b of betsToPlay) {
          const isRunnerWin = outcome.winSids.includes(String(b.sid))
          if (b.side === 'BACK' && isRunnerWin) {
            totalPayout += Number((b.stake * b.odds).toFixed(2))
          } else if (b.side === 'LAY' && !isRunnerWin) {
            totalPayout += Number((b.stake * 1.95).toFixed(2))
          }
        }

        if (totalPayout > 0) {
          if (isDemoMode) {
            addDemoBalance(totalPayout)
          } else {
            try {
              const netMult = Number((totalPayout / totalBet).toFixed(4))
              await fetch('/api/wallet/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: user?.id || user?.uid || 'guest_player',
                  email: user?.email || '',
                  bet_amount: totalBet,
                  win_amount: totalPayout,
                  multiplier: netMult,
                  game: `Diamond ${tableMeta?.tableName || tableId}`
                })
              })
              if (fetchWallet) fetchWallet()
              window.dispatchEvent(new Event('wallet-updated'))
            } catch (e) {}
          }
          setRoundOutcome({
            won: true,
            isError: false,
            winningSide: outcome.winningSide,
            handDescA: outcome.handDescA,
            handDescB: outcome.handDescB,
            text: `🎉 WON Rs ${totalPayout.toLocaleString('en-PK', { minimumFractionDigits: 2 })}! Winner: ${outcome.winnerName}`
          })
        } else {
          setRoundOutcome({
            won: false,
            isError: false,
            winningSide: outcome.winningSide,
            handDescA: outcome.handDescA,
            handDescB: outcome.handDescB,
            text: `🏆 Winner: ${outcome.winnerName} (${outcome.winningSide === 'A' ? outcome.handDescA : outcome.handDescB}) — Place chips for next hand!`
          })
        }
        setStagedBets([])
      } else {
        setRoundOutcome({
          won: false,
          isError: false,
          neutral: true,
          winningSide: outcome.winningSide,
          handDescA: outcome.handDescA,
          handDescB: outcome.handDescB,
          text: `🃏 Live Round #${nextMid}: ${outcome.winnerName} Wins (${outcome.winningSide === 'A' ? outcome.handDescA : outcome.handDescB})`
        })
      }

      setDealing(false)
      setCountdown(12)
    }, 1250)
  }

  // Continuous 1-second live countdown clock that auto-deals every 12 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      if (dealingRef.current) return
      setCountdown(prev => {
        if (prev <= 1) {
          executeDealRound()
          return 12
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [tableId, midCounter])

  const openRules = async () => {
    try {
      const res = await fetch(`/api/diamond/getCasinoRules?tableid=${encodeURIComponent(tableId)}`)
      const json = await res.json()
      setRulesModal(json)
    } catch (e) {}
  }

  const currentHandEval = evaluateTableOutcome(dealtCards)

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', color: '#fff', fontFamily: 'Outfit, sans-serif', paddingBottom: '24px' }}>
      {/* Horizontal Quick Table Switcher */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '8px 10px',
        background: '#0d1a12',
        borderBottom: '1px solid rgba(109, 255, 56, 0.2)',
        scrollbarWidth: 'none'
      }}>
        {QUICK_TABLES.map(qt => (
          <button
            key={qt.id}
            type="button"
            onClick={() => setTableId(qt.id)}
            style={{
              background: tableId === qt.id
                ? 'linear-gradient(180deg, #86ff47 0%, #52e534 100%)'
                : 'rgba(24, 46, 33, 0.9)',
              color: tableId === qt.id ? '#06150a' : '#d8f3dc',
              border: tableId === qt.id ? '1px solid #a6ff78' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '999px',
              padding: '5px 11px',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
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

      {/* Live Studio Broadcast & 3D Card Table Viewport */}
      <div style={{
        position: 'relative',
        margin: '8px 10px',
        borderRadius: '14px',
        overflow: 'hidden',
        minHeight: '236px',
        background: 'radial-gradient(circle at 50% 30%, #1d5436 0%, #0b2416 68%, #06120b 100%)',
        border: '1.5px solid rgba(109, 255, 56, 0.4)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px 12px'
      }}>
        {/* Subtle studio artwork watermark */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${currentQuickTable.bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.14,
          pointerEvents: 'none'
        }} />

        {/* Top Broadcast Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 900,
              padding: '2px 7px',
              borderRadius: '999px',
              boxShadow: '0 0 8px rgba(239,68,68,0.6)'
            }}>
              ● LIVE HD
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#ffd54f' }}>
              {tableMeta?.tableName || currentQuickTable.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
              MID: #{midCounter}
            </span>
            <button
              type="button"
              onClick={openRules}
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Rules ⓘ
            </button>
          </div>
        </div>

        {/* Center 3D Dealt Cards Felt Arena */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(6, 18, 11, 0.76)',
          border: '1px solid rgba(255, 213, 79, 0.35)',
          borderRadius: '12px',
          padding: '12px 8px',
          margin: '8px 0'
        }}>
          {/* Side A Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#6dff38', textTransform: 'uppercase' }}>
                {runners[0]?.nat || 'Player A'}
              </span>
              {revealedCount >= 6 && currentHandEval.winningSide === 'A' && (
                <span style={{ background: '#ffd54f', color: '#000', fontSize: '8.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                  WIN
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
              <PlayingCard3D card={dealtCards[0]} revealed={revealedCount >= 1} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'A'} />
              <PlayingCard3D card={dealtCards[1]} revealed={revealedCount >= 3} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'A'} />
              <PlayingCard3D card={dealtCards[2]} revealed={revealedCount >= 5} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'A'} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#cbd5e1' }}>
              {revealedCount >= 5 ? currentHandEval.handDescA : 'Dealing...'}
            </span>
          </div>

          {/* Center VS Badge */}
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(255, 213, 79, 0.16)',
            border: '1.5px solid #ffd54f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 900,
            color: '#ffd54f'
          }}>
            VS
          </div>

          {/* Side B Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#72bbef', textTransform: 'uppercase' }}>
                {runners[1]?.nat || 'Player B'}
              </span>
              {revealedCount >= 6 && currentHandEval.winningSide === 'B' && (
                <span style={{ background: '#ffd54f', color: '#000', fontSize: '8.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                  WIN
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
              <PlayingCard3D card={dealtCards[3]} revealed={revealedCount >= 2} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'B'} />
              <PlayingCard3D card={dealtCards[4]} revealed={revealedCount >= 4} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'B'} />
              <PlayingCard3D card={dealtCards[5]} revealed={revealedCount >= 6} highlight={revealedCount >= 6 && currentHandEval.winningSide === 'B'} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#cbd5e1' }}>
              {revealedCount >= 6 ? currentHandEval.handDescB : 'Dealing...'}
            </span>
          </div>
        </div>

        {/* Bottom Status & Live Auto-Deal Countdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 3 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: dealing ? '#ffd54f' : '#6dff38' }}>
            {dealing
              ? '🃏 DEALING LIVE HAND...'
              : totalStagedStake > 0
                ? `✅ Rs ${totalStagedStake} STAGED — TAP DEAL NOW OR WAIT ${countdown}s`
                : '🟢 TAP BACK / LAY BELOW TO PLACE YOUR BET'}
          </div>
          <div style={{
            background: countdown <= 3 ? '#dc2626' : '#0f291b',
            border: '1.5px solid #6dff38',
            borderRadius: '8px',
            padding: '3px 10px',
            fontSize: '13px',
            fontWeight: 900,
            color: '#ffffff',
            minWidth: '46px',
            textAlign: 'center'
          }}>
            {dealing ? '🃏' : `${countdown}s`}
          </div>
        </div>
      </div>

      {/* Round Result / Payout Notification Banner */}
      {roundOutcome && (
        <div style={{
          margin: '0 10px 8px',
          padding: '8px 12px',
          borderRadius: '10px',
          background: roundOutcome.isError
            ? 'rgba(239, 68, 68, 0.18)'
            : roundOutcome.won
              ? 'rgba(109, 255, 56, 0.2)'
              : 'rgba(255, 213, 79, 0.14)',
          border: roundOutcome.isError
            ? '1px solid #ef4444'
            : roundOutcome.won
              ? '1.5px solid #6dff38'
              : '1px solid rgba(255, 213, 79, 0.45)',
          color: roundOutcome.isError ? '#fca5a5' : roundOutcome.won ? '#6dff38' : '#ffd54f',
          fontSize: '12px',
          fontWeight: 800,
          textAlign: 'center'
        }}>
          {roundOutcome.text}
        </div>
      )}

      {/* Chip Selector + Instant Deal Action Bar */}
      <div style={{
        margin: '0 10px 8px',
        padding: '10px',
        background: '#122218',
        borderRadius: '12px',
        border: '1px solid rgba(109, 255, 56, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            SELECT CHIP:
          </span>
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
            {CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(chip)}
                style={{
                  background: selectedChip === chip
                    ? 'linear-gradient(180deg, #ffd54f 0%, #ff9800 100%)'
                    : '#1a3022',
                  color: selectedChip === chip ? '#000' : '#fff',
                  border: selectedChip === chip ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '999px',
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Rs {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Instant Deal / Clear / Repeat Control Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px' }}>
          <button
            type="button"
            disabled={dealing}
            onClick={() => executeDealRound()}
            style={{
              background: 'linear-gradient(180deg, #88ff4d 0%, #52e534 100%)',
              color: '#06150a',
              border: '1px solid #b2ff87',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: dealing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(82, 229, 52, 0.35)'
            }}
          >
            {dealing
              ? '🃏 DEALING CARDS...'
              : totalStagedStake > 0
                ? `⚡ DEAL CARDS NOW (Rs ${totalStagedStake})`
                : '⚡ DEAL CARDS NOW'}
          </button>

          {totalStagedStake > 0 && (
            <button
              type="button"
              disabled={dealing}
              onClick={() => setStagedBets([])}
              style={{
                background: 'rgba(239, 68, 68, 0.16)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}

          {totalStagedStake === 0 && lastStagedBets.length > 0 && (
            <button
              type="button"
              disabled={dealing}
              onClick={() => executeDealRound(lastStagedBets)}
              style={{
                background: 'rgba(255, 213, 79, 0.16)',
                color: '#ffd54f',
                border: '1px solid rgba(255, 213, 79, 0.45)',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔁 Rebet
            </button>
          )}
        </div>
      </div>

      {/* Diamond Exchange Back (Blue) / Lay (Pink) Market Odds Grid */}
      <div style={{
        margin: '0 10px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(109, 255, 56, 0.22)',
        background: '#111f16'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 84px 84px',
          background: '#183022',
          padding: '7px 10px',
          fontSize: '10.5px',
          fontWeight: 900,
          color: '#cbd5e1',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <span>TAP RUNNER TO BET (MIN: Rs 20)</span>
          <span style={{ textAlign: 'center', color: '#72bbef' }}>BACK (WIN)</span>
          <span style={{ textAlign: 'center', color: '#faa9ba' }}>LAY (AGAINST)</span>
        </div>

        {runners.map(runner => {
          const backBet = stagedBets.find(b => b.sid === runner.sid && b.side === 'BACK')
          const layBet = stagedBets.find(b => b.sid === runner.sid && b.side === 'LAY')

          return (
            <div
              key={runner.sid}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 84px 84px',
                alignItems: 'center',
                padding: '7px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  {runner.nat}
                </div>
                {(backBet || layBet) && (
                  <div style={{ fontSize: '10.5px', fontWeight: 900, color: '#6dff38', marginTop: '2px' }}>
                    {backBet ? `BACK Rs ${backBet.stake} → Win Rs ${(backBet.stake * backBet.odds).toFixed(0)}` : ''}
                    {layBet ? ` LAY Rs ${layBet.stake}` : ''}
                  </div>
                )}
              </div>

              {/* BACK Blue Box */}
              <button
                type="button"
                disabled={dealing || !runner.b1}
                onClick={() => handleStageBet(runner, 'BACK')}
                style={{
                  height: '40px',
                  marginRight: '4px',
                  borderRadius: '8px',
                  border: backBet ? '2px solid #ffd54f' : 'none',
                  background: dealing ? '#26382e' : '#72bbef',
                  color: dealing ? '#64748b' : '#061524',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: dealing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: backBet ? '0 0 10px rgba(255, 213, 79, 0.6)' : 'none'
                }}
              >
                <span>{runner.b1 ? Number(runner.b1).toFixed(2) : '-'}</span>
                <span style={{ fontSize: '8px', fontWeight: 800 }}>
                  {backBet ? `Rs ${backBet.stake}` : 'BACK'}
                </span>
              </button>

              {/* LAY Pink Box */}
              <button
                type="button"
                disabled={dealing || !runner.l1}
                onClick={() => handleStageBet(runner, 'LAY')}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: layBet ? '2px solid #ffd54f' : 'none',
                  background: dealing || !runner.l1 ? '#26382e' : '#faa9ba',
                  color: dealing || !runner.l1 ? '#64748b' : '#2b0710',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: dealing || !runner.l1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: layBet ? '0 0 10px rgba(255, 213, 79, 0.6)' : 'none'
                }}
              >
                <span>{runner.l1 ? Number(runner.l1).toFixed(2) : '-'}</span>
                <span style={{ fontSize: '8px', fontWeight: 800 }}>
                  {layBet ? `Rs ${layBet.stake}` : 'LAY'}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Last 10 Round Results Bead Road */}
      <div style={{
        margin: '10px 10px 0',
        padding: '10px 12px',
        background: '#111f16',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase' }}>
            📊 Last 10 Results ({tableMeta?.tableName || currentQuickTable.label})
          </span>
          <span style={{ fontSize: '10px', color: '#6dff38', fontWeight: 700 }}>
            Tap bubble for details
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {recentResults.map((resItem, idx) => (
            <button
              key={`${resItem.mid}-${idx}`}
              type="button"
              onClick={() => setDetailResultModal(resItem)}
              style={{
                minWidth: '28px',
                height: '28px',
                padding: '0 5px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: idx === 0
                  ? 'linear-gradient(135deg, #6dff38 0%, #1b8a12 100%)'
                  : resItem.shortLabel === 'A' || resItem.shortLabel === 'D' || resItem.shortLabel === 'L'
                    ? '#1e3a5f'
                    : '#3b1d2e',
                color: idx === 0 ? '#051409' : '#ffd54f',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={`MID #${resItem.mid}: ${resItem.winnerName}`}
            >
              {resItem.shortLabel || 'W'}
            </button>
          ))}
        </div>
      </div>

      {/* Round Details Result Modal */}
      {detailResultModal && (
        <div
          onClick={() => setDetailResultModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#13261b',
              border: '1.5px solid #6dff38',
              borderRadius: '14px',
              padding: '18px',
              width: '100%',
              maxWidth: '340px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38', marginBottom: '6px' }}>
              Diamond Casino Result Verified
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
              Round ID (MID): #{detailResultModal.mid}
            </div>
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(109, 255, 56, 0.12)',
              color: '#ffd54f',
              fontWeight: 900,
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              🏆 Winner: {detailResultModal.winnerName}
              {detailResultModal.cards && (
                <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>
                  Cards: {detailResultModal.cards}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDetailResultModal(null)}
              style={{
                background: '#6dff38',
                color: '#06150a',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 18px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {rulesModal && (
        <div
          onClick={() => setRulesModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#13261b',
              border: '1.5px solid #6dff38',
              borderRadius: '14px',
              padding: '18px',
              width: '100%',
              maxWidth: '360px'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#6dff38', marginBottom: '10px' }}>
              {rulesModal.tableName} — Official Rules
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#d8f3dc', lineHeight: 1.6, marginBottom: '14px' }}>
              {(rulesModal.rules || []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setRulesModal(null)}
              style={{
                width: '100%',
                background: '#6dff38',
                color: '#06150a',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
