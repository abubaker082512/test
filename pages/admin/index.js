import React, { useState, useEffect } from 'react'

const ADMIN_PASSWORD = 'Admin@123'

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [users, setUsers] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // Tabs
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'rates' | 'users'

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Exchange rates state
  const [pkrRate, setPkrRate] = useState('1.00')
  const [usdRate, setUsdRate] = useState('280.00')
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesMsg, setRatesMsg] = useState(null)

  // Adjust balance state
  const [selectedUser, setSelectedUser] = useState(null) // { id, email }
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustMsg, setAdjustMsg] = useState(null)

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) setAuthed(true)
    else setMsg('Wrong password')
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD })
      })
      const data = await res.json()
      if (data.success) {
        setPending(data.pending || [])
        setUsers(data.users || [])
        setWallets(data.wallets || [])
      } else {
        setMsg(data.error)
      }
    } catch (err) {
      setMsg('Failed to load admin dashboard data.')
    } finally {
      setLoading(false)
    }
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
      fetchAdminData()
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
    fetchAdminData()
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

  const handleAdjustBalance = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setAdjustLoading(true)
    setAdjustMsg(null)

    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          user_id: selectedUser.id,
          amount: Number(adjustAmount),
          note: adjustNote
        })
      })
      const data = await res.json()
      if (data.success) {
        setAdjustMsg({ type: 'success', text: data.message })
        setAdjustAmount('')
        setAdjustNote('')
        fetchAdminData() // Refresh balances
      } else {
        setAdjustMsg({ type: 'error', text: data.error })
      }
    } catch (err) {
      setAdjustMsg({ type: 'error', text: err.message })
    } finally {
      setAdjustLoading(false)
    }
  }

  // Lookup helper: user ID to email
  const getEmail = (userId) => {
    const found = users.find(u => u.id === userId)
    return found ? found.email : 'Unknown Account'
  }

  // Lookup helper: user ID to balance
  const getBalance = (userId) => {
    const found = wallets.find(w => w.user_id === userId)
    return found ? parseFloat(found.balance).toFixed(2) : '0.00'
  }

  // Filtered users list
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  )

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
    padding: '12px 20px',
    background: active ? 'var(--accent)' : '#111',
    color: active ? '#000' : '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#08090c', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
          <h1 style={{ color: 'var(--accent)', margin: 0, fontSize: '24px', fontWeight: '900' }}>🛡️ BetPK Admin Panel</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={fetchAdminData} disabled={loading}>
              {loading ? '⏳ Loading...' : '🔄 Refresh Data'}
            </button>
            <button className="btn" style={{ borderColor: '#ff4444', color: '#ff4444', background: 'none' }} onClick={() => setAuthed(false)}>Logout</button>
          </div>
        </div>

        {/* Global Notifications */}
        {msg && (
          <div style={{ background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#00ff88', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✅ {msg}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#111', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
          <button style={tabStyle(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>
            ⏳ Pending Requests ({pending.length})
          </button>
          <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>
            👥 User Accounts ({users.length})
          </button>
          <button style={tabStyle(activeTab === 'rates')} onClick={() => setActiveTab('rates')}>
            💵 Exchange Rates
          </button>
        </div>

        {/* ==========================================
            TAB 1: PENDING TRANSACTIONS (DEPOSITS/WITHDRAWALS)
            ========================================== */}
        {activeTab === 'transactions' && (
          <div>
            <h2 style={{ color: '#ff9900', marginTop: 0, fontSize: '18px' }}>⏳ Pending Deposits & Withdrawals</h2>
            
            {pending.length === 0 && !loading && (
              <div style={{ background: '#111', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#555', border: '1px solid #1c1c1c' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                No pending requests. All caught up!
              </div>
            )}

            {pending.map(tx => {
              const userEmail = getEmail(tx.user_id)
              return (
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
                  gap: '16px'
                }}>
                  <div style={{ flex: '1', minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', color: tx.type === 'deposit' ? '#00ff88' : '#ff9900' }}>
                        {tx.type === 'deposit' ? '💳 DEPOSIT' : '🏧 WITHDRAWAL'}
                      </span>
                      <span style={{ background: '#222', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', color: '#aaa' }}>
                        ₱{parseFloat(tx.amount).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '4px' }}>
                      Player: <strong style={{ color: '#fff' }}>{userEmail}</strong>
                    </div>

                    {tx.method && (
                      <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '4px' }}>
                        Method: <strong style={{ color: 'var(--accent)' }}>{tx.method.toUpperCase()}</strong>
                      </div>
                    )}

                    {tx.tx_id && (
                      <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '4px' }}>
                        Transaction ID: <span style={{ color: '#fff', background: '#000', padding: '2px 6px', borderRadius: '4px', border: '1px solid #333', fontFamily: 'monospace' }}>{tx.tx_id}</span>
                      </div>
                    )}

                    {/* Copier badge details for quick admin payouts */}
                    {tx.type === 'withdraw' && tx.notes && (
                      <div style={{ marginTop: '10px', background: 'rgba(255, 153, 0, 0.05)', border: '1px dashed rgba(255, 153, 0, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '4px' }}>📥 Payout Dispatch Info:</div>
                        <div style={{ color: '#fff', fontStyle: 'normal', whiteSpace: 'pre-wrap' }}>{tx.notes}</div>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                          👉 Open your Easypaisa/JazzCash/Binance app, send the matching net payout amount, then click <strong>Approve</strong> below.
                        </div>
                      </div>
                    )}

                    {tx.type === 'deposit' && tx.notes && (
                      <div style={{ marginTop: '10px', background: 'rgba(0, 255, 136, 0.05)', border: '1px dashed rgba(0, 255, 136, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#bbb' }}>
                        {tx.notes}
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: '#555', marginTop: '10px' }}>📅 Requested {new Date(tx.created_at).toLocaleString()}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleAction(tx.id, 'approve')}
                      style={{ padding: '12px 20px', borderRadius: '8px', background: '#00ff88', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, 'reject')}
                      style={{ padding: '12px 20px', borderRadius: '8px', background: '#ff4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ==========================================
            TAB 2: USER ACCOUNTS (MANUAL BALANCE ADJUST)
            ========================================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '18px' }}>👥 User Wallets & Management</h2>
              <input
                type="text"
                placeholder="🔍 Search email or user ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '13px', width: '220px' }}
              />
            </div>

            {/* Manual Balance Adjuster Form (Draw overlay if user selected) */}
            {selectedUser && (
              <div style={{ background: '#111', border: '1px solid var(--accent)', borderRadius: '12px', padding: '20px', marginBottom: '24px', position: 'relative' }}>
                <button onClick={() => { setSelectedUser(null); setAdjustMsg(null); }} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer' }}>✕ Close</button>
                
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff' }}>
                  💰 Adjust Wallet Balance for <span style={{ color: 'var(--accent)' }}>{selectedUser.email}</span>
                </h3>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px' }}>
                  Current Balance: <strong style={{ color: '#fff' }}>₱{getBalance(selectedUser.id)}</strong>
                </div>

                {adjustMsg && (
                  <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', background: adjustMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: adjustMsg.type === 'error' ? '#ff6666' : '#00ff88' }}>
                    {adjustMsg.type === 'success' ? '✅ ' : '⚠️ '}{adjustMsg.text}
                  </div>
                )}

                <form onSubmit={handleAdjustBalance} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount (e.g. 100 or -50)"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '14px', flex: 1, minWidth: '160px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. Winner payout, manual credit)"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '14px', flex: 2, minWidth: '220px' }}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn primary" 
                    disabled={adjustLoading}
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                  >
                    {adjustLoading ? 'Adjusting...' : '💾 Submit Adjustment'}
                  </button>
                </form>
                <small style={{ color: '#555', display: 'block', marginTop: '8px' }}>
                  * Use a **positive** number to add balance (credits wallet). Use a **negative** sign (e.g. -500) to deduct balance (debits wallet).
                </small>
              </div>
            )}

            {/* Users grid listing */}
            <div style={{ background: '#111', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', background: '#181b26', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 'bold', color: '#888' }}>
                <span style={{ flex: 2 }}>USER ACCOUNT</span>
                <span style={{ flex: 1, textAlign: 'right' }}>BALANCE</span>
                <span style={{ flex: 1, textAlign: 'right' }}>ACTIONS</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#555' }}>No matching accounts found.</div>
              ) : (
                filteredUsers.map(u => {
                  const bal = getBalance(u.id)
                  return (
                    <div key={u.id} style={{ display: 'flex', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', alignItems: 'center' }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.email}</div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>ID: {u.id}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px' }}>
                        ₱{bal}
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <button 
                          onClick={() => { setSelectedUser(u); setAdjustMsg(null); }}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ⚙️ Adjust Balance
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: EXCHANGE RATES
            ========================================== */}
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
