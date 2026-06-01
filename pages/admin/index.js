import React, { useState, useEffect } from 'react'

const ADMIN_PASSWORD = 'Admin@123'

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // Tabs
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'rates'

  // Exchange rates state
  const [pkrRate, setPkrRate] = useState('1.00')
  const [usdRate, setUsdRate] = useState('280.00')
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesMsg, setRatesMsg] = useState(null)

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) setAuthed(true)
    else setMsg('Wrong password')
  }

  const fetchPending = async () => {
    setLoading(true)
    const res = await fetch('/api/wallet/pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD })
    })
    const data = await res.json()
    setPending(data.pending || [])
    setLoading(false)
  }

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        setPkrRate(data.pkr_rate.toString())
        setUsdRate(data.usd_rate.toString())
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    }
  }

  useEffect(() => {
    if (authed) {
      fetchPending()
      fetchRates()
    }
  }, [authed])

  const handleAction = async (tx_id, action) => {
    const res = await fetch('/api/wallet/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD, tx_id, action })
    })
    const data = await res.json()
    setMsg(data.message || data.error)
    fetchPending()
  }

  const handleSaveRates = async (e) => {
    e.preventDefault()
    setRatesLoading(true)
    setRatesMsg(null)
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          pkr_rate: Number(pkrRate),
          usd_rate: Number(usdRate)
        })
      })
      const data = await res.json()
      if (data.success) {
        setRatesMsg({ type: 'success', text: 'Exchange rates updated successfully!' })
      } else {
        setRatesMsg({ type: 'error', text: data.error })
      }
    } catch (err) {
      setRatesMsg({ type: 'error', text: `Failed to save: ${err.message}` })
    }
    setRatesLoading(false)
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111', border: '1px solid var(--accent)', borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>BetPK Admin Panel</h2>
        {msg && <div style={{ color: '#ff4444', marginBottom: '12px', fontSize: '14px' }}>{msg}</div>}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '16px' }}
            required
          />
          <button type="submit" className="btn primary" style={{ padding: '14px', fontSize: '16px' }}>Login</button>
        </form>
      </div>
    </div>
  )

  const tabStyle = (active) => ({
    padding: '12px 24px',
    background: active ? 'var(--accent)' : '#111',
    color: active ? '#000' : '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
          <h1 style={{ color: 'var(--accent)', margin: 0 }}>🛡️ BetPK Admin Panel</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'transactions' && (
              <button className="btn" onClick={fetchPending} disabled={loading}>
                {loading ? '⏳ Loading...' : '🔄 Refresh List'}
              </button>
            )}
            <button className="btn" style={{ borderColor: '#ff4444', color: '#ff4444' }} onClick={() => setAuthed(false)}>Logout</button>
          </div>
        </div>

        {/* Dynamic Action Notification */}
        {msg && (
          <div style={{ background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#00ff88', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✅ {msg}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: '#111', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
          <button style={tabStyle(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>
            ⏳ Pending Requests ({pending.length})
          </button>
          <button style={tabStyle(activeTab === 'rates')} onClick={() => setActiveTab('rates')}>
            💵 Currency Exchange Rates
          </button>
        </div>

        {/* TAB 1: PENDING TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div>
            <h2 style={{ color: '#ff9900', marginTop: 0, fontSize: '20px' }}>⏳ Deposit & Withdrawal Approvals</h2>
            
            {pending.length === 0 && !loading && (
              <div style={{ background: '#111', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#555', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                No pending transactions. All caught up!
              </div>
            )}

            {pending.map(tx => (
              <div key={tx.id} style={{
                background: '#111',
                border: `1px solid ${tx.type === 'deposit' ? '#00ff8833' : '#ff990033'}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: tx.type === 'deposit' ? '#00ff88' : '#ff9900', marginBottom: '4px' }}>
                    {tx.type === 'deposit' ? '💳 DEPOSIT' : '🏧 WITHDRAWAL'} — ₱{parseFloat(tx.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888' }}>User: {tx.user_id}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Method: <strong style={{ color: '#fff' }}>{tx.method?.toUpperCase() || 'N/A'}</strong></div>
                  {tx.tx_id && <div style={{ fontSize: '13px', color: '#aaa' }}>Transaction ID: <strong style={{ color: 'var(--accent)' }}>{tx.tx_id}</strong></div>}
                  {tx.notes && <div style={{ fontSize: '13px', color: '#777', marginTop: '4px' }}>{tx.notes}</div>}
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>📅 {new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleAction(tx.id, 'approve')}
                    style={{ padding: '12px 24px', borderRadius: '8px', background: '#00ff88', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleAction(tx.id, 'reject')}
                    style={{ padding: '12px 24px', borderRadius: '8px', background: '#ff4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: EXCHANGE RATES */}
        {activeTab === 'rates' && (
          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '24px' }}>
            <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>💵 Manage Currency Conversion Rates</h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Define how much in-game currency (₱) users receive when they deposit PKR (Rs) or USD ($). 
              These values are calculated instantly in dynamic previews during their deposit/withdrawal submission.
            </p>

            {ratesMsg && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                fontSize: '14px', 
                background: ratesMsg.type === 'error' ? '#ff000022' : '#00ff8822', 
                color: ratesMsg.type === 'error' ? '#ff6666' : '#00ff88',
                border: `1px solid ${ratesMsg.type === 'error' ? '#ff000044' : '#00ff8844'}`
              }}>
                {ratesMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                  🇵🇰 PKR (Rs) Conversion Rate:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', color: '#888' }}>1 PKR =</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={pkrRate}
                    onChange={e => setPkrRate(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '16px' }}
                    required
                  />
                  <span style={{ fontSize: '16px', color: 'var(--accent)', fontWeight: 'bold' }}>₱ (In-game)</span>
                </div>
                <small style={{ color: '#666' }}>Example: If set to 1.5, depositing 100 PKR gives the user 150 ₱.</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                  🇺🇸 USD ($) Conversion Rate:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', color: '#888' }}>1 USD =</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={usdRate}
                    onChange={e => setUsdRate(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '16px' }}
                    required
                  />
                  <span style={{ fontSize: '16px', color: 'var(--accent)', fontWeight: 'bold' }}>₱ (In-game)</span>
                </div>
                <small style={{ color: '#666' }}>Example: If set to 280, depositing $10 gives the user 2,800 ₱.</small>
              </div>

              <button 
                type="submit" 
                className="btn primary" 
                disabled={ratesLoading} 
                style={{ width: '100%', padding: '16px', fontSize: '16px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', borderRadius: '8px', marginTop: '12px' }}
              >
                {ratesLoading ? '💾 Saving rates...' : '💾 Save Conversion Rates'}
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  )
}
