import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const QUICK_TABLES = [
  { id: 'teen20', label: '20-20 Teenpatti', icon: '🃏' },
  { id: 'joker20', label: 'Teenpatti Joker', icon: '🤡' },
  { id: 'teen', label: '1-Day Teenpatti', icon: '👑' },
  { id: 'teen9', label: 'Teenpatti Test', icon: '🐯' },
  { id: 'ab20', label: 'Andar Bahar 20', icon: '🎴' },
  { id: 'abj', label: 'Andar Bahar 2', icon: '💎' },
  { id: 'lucky7', label: 'Lucky 7 - A', icon: '7️⃣' },
  { id: 'lucky7eu', label: 'Lucky 7 - B', icon: '🎰' },
  { id: 'dt20', label: 'Dragon Tiger 20', icon: '🐉' },
  { id: 'dtl20', label: 'Dragon Tiger Lion', icon: '🦁' },
  { id: 'card32', label: '32 Cards - A', icon: '🔢' },
  { id: 'amar', label: 'Amar Akbar Anthony', icon: '🎬' },
  { id: 'btable', label: 'Bollywood Table', icon: '🌟' },
  { id: 'worli', label: 'Worli Matka', icon: '🏺' },
  { id: 'poker20', label: '20-20 Poker', icon: '♠️' },
  { id: 'baccarat', label: 'Speed Baccarat', icon: '🏦' },
  { id: 'cmatch20', label: 'Cricket 20-20', icon: '🏏' },
  { id: 'superover', label: 'Super Over PAKvIND', icon: '🏆' }
]

const CHIPS = [20, 50, 100, 500, 1000, 5000]

function parseCardCode(code) {
  if (!code || code === '1') return { hidden: true, rank: '?', suit: '♠', red: false }
  const suitCode = code.slice(-2)
  const rank = code.slice(0, -2) || 'A'
  const suitMap = {
    SS: { symbol: '♠', red: false },
    HH: { symbol: '♥', red: true },
    CC: { symbol: '♣', red: false },
    DD: { symbol: '♦', red: true }
  }
  const s = suitMap[suitCode] || { symbol: '♠', red: false }
  return { hidden: false, rank, suit: s.symbol, red: s.red }
}

function PlayingCardMini({ code, label }) {
  const c = parseCardCode(code)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      {label && <span style={{ fontSize: '8.5px', color: '#cbd5e1', fontWeight: 800 }}>{label}</span>}
      <div
        style={{
          width: '34px',
          height: '46px',
          borderRadius: '6px',
          background: c.hidden
            ? 'linear-gradient(135deg, #1b4332 0%, #081c15 100%)'
            : '#ffffff',
          border: c.hidden ? '1.5px solid #6dff38' : '1.5px solid #cbd5e1',
          boxShadow: '0 3px 8px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.hidden ? '#6dff38' : c.red ? '#dc2626' : '#0f172a',
          fontWeight: 900,
          fontSize: '12px',
          lineHeight: 1.05,
          userSelect: 'none'
        }}
      >
        {c.hidden ? (
          <span style={{ fontSize: '14px' }}>💎</span>
        ) : (
          <>
            <span>{c.rank}</span>
            <span style={{ fontSize: '13px' }}>{c.suit}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function DiamondCasinoGame({ initialTableId = 'teen20' }) {
  const { user, isDemoMode, demoBalance, updateDemoBalance } = useAuth()
  const [tableId, setTableId] = useState(initialTableId)
  const [tableState, setTableState] = useState(null)
  const [streamUrl, setStreamUrl] = useState(null)
  const [selectedChip, setSelectedChip] = useState(50)
  const [activeBets, setActiveBets] = useState([]) // [{ mid, sid, nat, stake, odds, side }]
  const [settledBanner, setSettledBanner] = useState(null)
  const [rulesModal, setRulesModal] = useState(null)
  const [detailResultModal, setDetailResultModal] = useState(null)
  const [placingBet, setPlacingBet] = useState(false)
  const settledMidRef = useRef(null)

  useEffect(() => {
    if (initialTableId) setTableId(initialTableId)
  }, [initialTableId])

  // Fetch stream configuration when table changes
  useEffect(() => {
    let mounted = true
    setStreamUrl(null)
    fetch(`/api/diamond/getCasinoStream?tableid=${encodeURIComponent(tableId)}`)
      .then(r => r.json())
      .then(d => {
        if (mounted && d?.tvUrl) {
          setStreamUrl(d.tvUrl)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [tableId])

  // Poll real-time table data every 1 second
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/diamond/getCasinoTableData?tableid=${encodeURIComponent(tableId)}`)
        if (!res.ok) return
        const json = await res.json()
        if (mounted && json?.data) {
          setTableState(json)
        }
      } catch (e) {}
    }
    fetchData()
    const iv = setInterval(fetchData, 1000)
    return () => {
      mounted = false
      clearInterval(iv)
    }
  }, [tableId])

  const t1 = tableState?.data?.t1?.[0] || {
    mid: '---',
    lt: 15,
    status: 'OPEN',
    C1: '1', C2: '1', C3: '1', C4: '1', C5: '1', C6: '1'
  }
  const runners = tableState?.data?.t2 || []
  const recentResults = tableState?.data?.results || []

  // Automatically settle bets when status transitions to RESULT for the current mid
  useEffect(() => {
    if (!t1 || t1.status !== 'RESULT' || !t1.winnerSid) return
    if (settledMidRef.current === t1.mid) return
    settledMidRef.current = t1.mid

    const roundBets = activeBets.filter(b => b.mid === t1.mid)
    if (roundBets.length === 0) {
      setSettledBanner({
        won: false,
        neutral: true,
        text: `Round #${t1.mid} Winner: ${t1.winnerName}`
      })
      return
    }

    let totalPayout = 0
    for (const b of roundBets) {
      const runnerWon = String(b.sid) === String(t1.winnerSid)
      if (b.side === 'BACK' && runnerWon) {
        totalPayout += Number((b.stake * b.odds).toFixed(2))
      } else if (b.side === 'LAY' && !runnerWon) {
        totalPayout += Number((b.stake * 1.95).toFixed(2))
      }
    }

    if (totalPayout > 0) {
      if (isDemoMode || !user) {
        updateDemoBalance(demoBalance + totalPayout)
      } else {
        fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.uid,
            email: user.email,
            amount: totalPayout,
            game: `Diamond ${tableState?.tableName || tableId}`
          })
        }).then(() => {
          window.dispatchEvent(new Event('wallet-updated'))
        }).catch(() => {})
      }
      setSettledBanner({
        won: true,
        neutral: false,
        text: `🎉 WON Rs ${totalPayout.toLocaleString()} on ${t1.winnerName}!`
      })
    } else {
      setSettledBanner({
        won: false,
        neutral: false,
        text: `Round Winner: ${t1.winnerName} — Try again next round!`
      })
    }

    setTimeout(() => {
      setActiveBets(prev => prev.filter(b => b.mid !== t1.mid))
    }, 3800)
  }, [t1.status, t1.mid, t1.winnerSid])

  const placeRunnerBet = async (runner, side = 'BACK') => {
    if (placingBet || t1.status !== 'OPEN' || t1.lt <= 1) return
    const odds = side === 'BACK' ? Number(runner.b1) : Number(runner.l1)
    if (!odds || odds <= 0) return

    const stake = selectedChip
    setPlacingBet(true)

    try {
      if (isDemoMode || !user) {
        if (demoBalance < stake) {
          alert('Insufficient Demo Balance!')
          setPlacingBet(false)
          return
        }
        updateDemoBalance(demoBalance - stake)
      } else {
        const res = await fetch('/api/wallet/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.uid,
            email: user.email,
            amount: stake,
            game: `Diamond ${tableState?.tableName || tableId}`
          })
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          alert(data.error || 'Insufficient PKR Wallet balance!')
          setPlacingBet(false)
          return
        }
        window.dispatchEvent(new Event('wallet-updated'))
      }

      setActiveBets(prev => [
        ...prev,
        {
          mid: t1.mid,
          sid: runner.sid,
          nat: runner.nat,
          stake,
          odds,
          side
        }
      ])
    } catch (e) {
    } finally {
      setPlacingBet(false)
    }
  }

  const openRules = async () => {
    try {
      const res = await fetch(`/api/diamond/getCasinoRules?tableid=${encodeURIComponent(tableId)}`)
      const json = await res.json()
      setRulesModal(json)
    } catch (e) {}
  }

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
            onClick={() => {
              setTableId(qt.id)
              setSettledBanner(null)
            }}
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

      {/* Live Stream & Picture-in-Picture Card Viewport */}
      <div style={{
        position: 'relative',
        margin: '8px 10px',
        borderRadius: '14px',
        overflow: 'hidden',
        height: '225px',
        background: 'radial-gradient(circle at 50% 35%, #1d4d32 0%, #0b2115 65%, #06120b 100%)',
        border: '1.5px solid rgba(109, 255, 56, 0.35)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.65)'
      }}>
        {streamUrl ? (
          <iframe
            src={streamUrl}
            title={tableState?.tableName || 'Diamond Casino Stream'}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen"
          />
        ) : (
          /* Built-in Diamond Casino Live Studio Felt & Dealer Broadcast */
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '10px 12px'
          }}>
            {/* Top Broadcast Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  letterSpacing: '0.5px'
                }}>
                  ● LIVE STREAM
                </span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffd54f' }}>
                  {tableState?.tableName || '20-20 Teenpatti'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                  MID: #{t1.mid}
                </span>
                <button
                  type="button"
                  onClick={openRules}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
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

            {/* Center Live Cards Felt Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              background: 'rgba(7, 20, 12, 0.68)',
              border: '1px solid rgba(255, 213, 79, 0.28)',
              borderRadius: '12px',
              padding: '10px 8px',
              margin: 'auto 0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#6dff38', marginBottom: '5px', textTransform: 'uppercase' }}>
                  {runners[0]?.nat || 'Side A'}
                </div>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <PlayingCardMini code={t1.C1} />
                  <PlayingCardMini code={t1.C2} />
                  <PlayingCardMini code={t1.C3} />
                </div>
              </div>

              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 213, 79, 0.15)',
                border: '1px solid #ffd54f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 900,
                color: '#ffd54f'
              }}>
                VS
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#72bbef', marginBottom: '5px', textTransform: 'uppercase' }}>
                  {runners[1]?.nat || 'Side B'}
                </div>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <PlayingCardMini code={t1.C4} />
                  <PlayingCardMini code={t1.C5} />
                  <PlayingCardMini code={t1.C6} />
                </div>
              </div>
            </div>

            {/* Bottom Status & Countdown Flip Clock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: t1.status === 'OPEN' ? '#6dff38' : '#ffd54f' }}>
                {t1.status === 'OPEN'
                  ? '🟢 BETTING OPEN — PLACE YOUR CHIPS'
                  : `🏆 WINNER: ${t1.winnerName || 'REVEALING...'}`}
              </div>

              <div style={{
                background: t1.lt <= 3 ? '#dc2626' : '#0f291b',
                border: '1.5px solid #6dff38',
                borderRadius: '8px',
                padding: '3px 10px',
                fontSize: '14px',
                fontWeight: 900,
                color: '#ffffff',
                minWidth: '48px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}>
                {t1.status === 'OPEN' ? `${t1.lt}s` : '00s'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Round Settlement Banner */}
      {settledBanner && (
        <div style={{
          margin: '0 10px 8px',
          padding: '8px 12px',
          borderRadius: '10px',
          background: settledBanner.won
            ? 'rgba(109, 255, 56, 0.18)'
            : 'rgba(255, 213, 79, 0.14)',
          border: settledBanner.won
            ? '1px solid #6dff38'
            : '1px solid rgba(255, 213, 79, 0.45)',
          color: settledBanner.won ? '#6dff38' : '#ffd54f',
          fontSize: '12px',
          fontWeight: 800,
          textAlign: 'center'
        }}>
          {settledBanner.text}
        </div>
      )}

      {/* Chip Selector Dock */}
      <div style={{
        margin: '0 10px 8px',
        padding: '8px 10px',
        background: '#122218',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>
          CHIP STAKE:
        </span>
        <div style={{ display: 'flex', gap: '5px', flexWrap: ' nowrap', overflowX: 'auto' }}>
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
          gridTemplateColumns: '1fr 82px 82px',
          background: '#183022',
          padding: '7px 10px',
          fontSize: '10.5px',
          fontWeight: 900,
          color: '#cbd5e1',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <span>MARKET RUNNER (MIN: Rs {t1.min || 20})</span>
          <span style={{ textAlign: 'center', color: '#72bbef' }}>BACK</span>
          <span style={{ textAlign: 'center', color: '#faa9ba' }}>LAY</span>
        </div>

        {runners.map(runner => {
          const isSuspended = runner.gstatus === 'SUSPENDED' || t1.status !== 'OPEN'
          const runnerBets = activeBets.filter(b => b.mid === t1.mid && b.sid === runner.sid)
          const runnerStakeSum = runnerBets.reduce((acc, b) => acc + b.stake, 0)

          return (
            <div
              key={runner.sid}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 82px 82px',
                alignItems: 'center',
                padding: '6px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                  {runner.nat}
                </div>
                {runnerStakeSum > 0 && (
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#6dff38' }}>
                    Active Bet: Rs {runnerStakeSum}
                  </div>
                )}
              </div>

              {/* BACK Blue Box */}
              <button
                type="button"
                disabled={isSuspended || !runner.b1}
                onClick={() => placeRunnerBet(runner, 'BACK')}
                style={{
                  height: '38px',
                  marginRight: '4px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isSuspended ? '#26382e' : '#72bbef',
                  color: isSuspended ? '#64748b' : '#061524',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: isSuspended ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span>{runner.b1 ? Number(runner.b1).toFixed(2) : '-'}</span>
                <span style={{ fontSize: '8px', fontWeight: 700 }}>BACK</span>
              </button>

              {/* LAY Pink Box */}
              <button
                type="button"
                disabled={isSuspended || !runner.l1}
                onClick={() => placeRunnerBet(runner, 'LAY')}
                style={{
                  height: '38px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isSuspended || !runner.l1 ? '#26382e' : '#faa9ba',
                  color: isSuspended || !runner.l1 ? '#64748b' : '#2b0710',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: isSuspended || !runner.l1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span>{runner.l1 ? Number(runner.l1).toFixed(2) : '-'}</span>
                <span style={{ fontSize: '8px', fontWeight: 700 }}>LAY</span>
              </button>

              {isSuspended && (
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '5px',
                  bottom: '5px',
                  width: '164px',
                  background: 'rgba(10, 18, 13, 0.82)',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 213, 79, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffd54f',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.6px'
                }}>
                  🔒 SUSPENDED
                </div>
              )}
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
            📊 Last 10 Results ({tableState?.tableName || tableId})
          </span>
          <span style={{ fontSize: '10px', color: '#6dff38', fontWeight: 700 }}>
            Tap bubble for details
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {recentResults.map((resItem, idx) => (
            <button
              key={resItem.mid || idx}
              type="button"
              onClick={() => setDetailResultModal(resItem)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.25)',
                background: idx === 0
                  ? 'linear-gradient(135deg, #6dff38 0%, #1b8a12 100%)'
                  : '#1d3626',
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
