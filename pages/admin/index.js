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
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'rates' | 'users' | 'risk'

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Exchange rates state
  const [pkrRate, setPkrRate] = useState('1.00')
  const [usdRate, setUsdRate] = useState('280.00')
  const [payinPkrRate, setPayinPkrRate] = useState('1.00')
  const [payoutPkrRate, setPayoutPkrRate] = useState('1.00')
  const [directpayClientId, setDirectpayClientId] = useState('pwa_ci_k1qlq54hv4gw5pr0khux')
  const [directpayClientSecret, setDirectpayClientSecret] = useState('pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca')
  const [directpayEnabled, setDirectpayEnabled] = useState(true)

  // JazzCash Direct API state
  const [jazzcashMerchantId, setJazzcashMerchantId] = useState('74584985')
  const [jazzcashPassword, setJazzcashPassword] = useState('qo38057jbm')
  const [jazzcashIntegritySalt, setJazzcashIntegritySalt] = useState('z35f76uo0m')
  const [jazzcashEnabled, setJazzcashEnabled] = useState(true)
  const [jazzcashMode, setJazzcashMode] = useState('direct_api')

  // EasyPaisa Direct API state
  const [easypaisaStoreId, setEasypaisaStoreId] = useState('43')
  const [easypaisaHashKey, setEasypaisaHashKey] = useState('1234567890123456')
  const [easypaisaEnabled, setEasypaisaEnabled] = useState(true)
  const [easypaisaMode, setEasypaisaMode] = useState('direct_api')

  // Card Gateway state
  const [cardMode, setCardMode] = useState('direct_api')

  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesMsg, setRatesMsg] = useState(null)

  // Real-Time Risk & Engine state
  const [riskAnalytics, setRiskAnalytics] = useState(null)
  const [riskConfig, setRiskConfig] = useState({
    global_rtp: 92,
    max_win_cap: 5000,
    force_house_edge: true,
    restricted_users: []
  })
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskMsg, setRiskMsg] = useState(null)

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
        setPayinPkrRate((data.payin_pkr_rate || data.pkr_rate || 1.0).toString())
        setPayoutPkrRate((data.payout_pkr_rate || data.pkr_rate || 1.0).toString())
        if (data.directpay_client_id) setDirectpayClientId(data.directpay_client_id)
        if (data.directpay_client_secret) setDirectpayClientSecret(data.directpay_client_secret)
        if (data.directpay_enabled !== undefined) setDirectpayEnabled(data.directpay_enabled)

        if (data.jazzcash_merchant_id) setJazzcashMerchantId(data.jazzcash_merchant_id)
        if (data.jazzcash_password) setJazzcashPassword(data.jazzcash_password)
        if (data.jazzcash_integrity_salt) setJazzcashIntegritySalt(data.jazzcash_integrity_salt)
        if (data.jazzcash_enabled !== undefined) setJazzcashEnabled(data.jazzcash_enabled)
        if (data.jazzcash_mode) setJazzcashMode(data.jazzcash_mode)

        if (data.easypaisa_store_id) setEasypaisaStoreId(data.easypaisa_store_id)
        if (data.easypaisa_hash_key) setEasypaisaHashKey(data.easypaisa_hash_key)
        if (data.easypaisa_enabled !== undefined) setEasypaisaEnabled(data.easypaisa_enabled)
        if (data.easypaisa_mode) setEasypaisaMode(data.easypaisa_mode)

        if (data.card_mode) setCardMode(data.card_mode)
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    }
  }

  const fetchLiveAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/live-analytics')
      const data = await res.json()
      if (data.success) {
        setRiskAnalytics(data)
      }
    } catch (err) {
      console.error('Error fetching live analytics:', err)
    }
  }

  const fetchRiskConfig = async () => {
    try {
      const res = await fetch('/api/admin/risk-settings')
      const data = await res.json()
      if (data.success && data.config) {
        setRiskConfig(data.config)
      }
    } catch (err) {
      console.error('Error fetching risk config:', err)
    }
  }

  const fetchRiskData = async () => {
    await Promise.all([fetchLiveAnalytics(), fetchRiskConfig()])
  }

  useEffect(() => {
    if (authed) {
      fetchAdminData()
      fetchRates()
      fetchRiskConfig()
      fetchLiveAnalytics()

      // Poll ONLY live wager analytics every 5s (never overwrites the active slider/form state)
      const interval = setInterval(() => {
        fetchLiveAnalytics()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [authed])

  const handleSaveRiskConfig = async (e) => {
    if (e) e.preventDefault()
    setRiskLoading(true)
    setRiskMsg(null)
    try {
      const res = await fetch('/api/admin/risk-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          action: 'update_config',
          global_rtp: Number(riskConfig.global_rtp),
          max_win_cap: Number(riskConfig.max_win_cap),
          force_house_edge: Boolean(riskConfig.force_house_edge),
          config: {
            global_rtp: Number(riskConfig.global_rtp),
            max_win_cap: Number(riskConfig.max_win_cap),
            force_house_edge: Boolean(riskConfig.force_house_edge)
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        setRiskMsg({ type: 'success', text: `Risk Controls updated successfully! Global RTP set to ${riskConfig.global_rtp}%` })
        if (data.config) setRiskConfig(data.config)
      } else {
        setRiskMsg({ type: 'error', text: data.error })
      }
    } catch (err) {
      setRiskMsg({ type: 'error', text: `Failed to save risk config: ${err.message}` })
    }
    setRiskLoading(false)
  }

  const toggleUserRestriction = async (userId) => {
    try {
      const res = await fetch('/api/admin/risk-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          action: 'toggle_user_restriction',
          user_id: userId
        })
      })
      const data = await res.json()
      if (data.success) {
        if (data.config) setRiskConfig(data.config)
        fetchRiskData()
      } else {
        alert(data.error || 'Failed to toggle player restriction')
      }
    } catch (err) {
      alert(`Error toggling player restriction: ${err.message}`)
    }
  }

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
          usd_rate: Number(usdRate),
          payin_pkr_rate: Number(payinPkrRate),
          payout_pkr_rate: Number(payoutPkrRate),
          directpay_client_id: directpayClientId,
          directpay_client_secret: directpayClientSecret,
          directpay_enabled: directpayEnabled,
          jazzcash_merchant_id: jazzcashMerchantId,
          jazzcash_password: jazzcashPassword,
          jazzcash_integrity_salt: jazzcashIntegritySalt,
          jazzcash_enabled: jazzcashEnabled,
          jazzcash_mode: jazzcashMode,
          easypaisa_store_id: easypaisaStoreId,
          easypaisa_hash_key: easypaisaHashKey,
          easypaisa_enabled: easypaisaEnabled,
          easypaisa_mode: easypaisaMode,
          card_mode: cardMode
        })
      })
      const data = await res.json()
      if (data.success) {
        setRatesMsg({ type: 'success', text: 'All exchange rates, DirectPay, JazzCash & EasyPaisa settings updated successfully!' })
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>WinX Pro Admin Panel</h2>
        {msg && <div style={{ color: '#ff4444', marginBottom: '12px', fontSize: '14px' }}>{msg}</div>}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '16px' }}
            required
          />
          <button type="submit" className="btn primary" style={{ padding: '14px', fontSize: '16px', fontWeight: 'bold' }}>Login</button>
        </form>
      </div>
    </div>
  )

  const tabStyle = (active) => ({
    padding: '12px 20px',
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? '#000' : '#fff',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--accent)', margin: 0, fontSize: '24px' }}>🛡️ WinX Pro Management Console</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>Manage transactions, DirectPay gateway, exchange rates, and user balances</p>
          </div>
          <button 
            onClick={() => { setAuthed(false); setPassword('') }}
            style={{ background: '#331111', color: '#ff6666', border: '1px solid #ff444444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>

        {/* Global Notifications */}
        {msg && (
          <div style={{ padding: '12px 16px', background: '#00ff8822', border: '1px solid #00ff8844', color: '#00ff88', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{msg}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={tabStyle(activeTab === 'risk')} onClick={() => setActiveTab('risk')}>
            🎯 Real-Time Engine & Risk Governor
          </button>
          <button style={tabStyle(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>
            ⏳ Pending Transactions ({pending.length})
          </button>
          <button style={tabStyle(activeTab === 'rates')} onClick={() => setActiveTab('rates')}>
            💵 Rates & Payment Gateway
          </button>
          <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>
            👥 User Accounts & Balances ({users.length})
          </button>
        </div>

        {/* ==========================================
            TAB 1: PENDING TRANSACTIONS
            ========================================== */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Pending Approvals</h2>
              <button onClick={fetchAdminData} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading approvals...</div>
            ) : pending.length === 0 ? (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                ✅ All caught up! No pending deposit or withdrawal requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pending.map(tx => (
                  <div key={tx.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          textTransform: 'uppercase',
                          background: tx.type === 'deposit' ? '#00ff8822' : '#ff990022',
                          color: tx.type === 'deposit' ? '#00ff88' : '#ff9900',
                          border: `1px solid ${tx.type === 'deposit' ? '#00ff8844' : '#ff990044'}`
                        }}>
                          {tx.type}
                        </span>
                        <strong style={{ fontSize: '16px', color: 'var(--accent)' }}>Pi {parseFloat(tx.amount).toFixed(2)}</strong>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>via {tx.method}</span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#ccc', marginTop: '6px' }}>
                        <strong>User:</strong> {getEmail(tx.user_id)}
                      </div>

                      {tx.tx_id && (
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', fontFamily: 'monospace' }}>
                          <strong>TxID / Ref:</strong> {tx.tx_id}
                        </div>
                      )}

                      {tx.notes && (
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          <em>{tx.notes}</em>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAction(tx.id, 'approve')}
                        style={{ padding: '8px 16px', background: '#00cc66', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(tx.id, 'reject')}
                        style={{ padding: '8px 16px', background: '#331111', color: '#ff6666', border: '1px solid #ff444444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: RATES & PAYMENT GATEWAY
            ========================================== */}
        {activeTab === 'rates' && (
          <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
            <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>💵 Conversion Rates & DirectPay Gateway</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
              Configure Pay-In/Pay-Out currency conversion rates and connect your <strong>DirectPay API</strong> credentials (Easypaisa, JazzCash, Card PWA Landing Page).
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
              
              {/* Currency Rates */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: 'var(--accent)' }}>📈 Exchange Rates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      🌍 1 Fiat (PKR) =
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={pkrRate}
                      onChange={e => setPkrRate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px' }}
                      required
                    />
                    <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Pi Points per Fiat</small>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      🇺🇸 1 USD ($) =
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={usdRate}
                      onChange={e => setUsdRate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px' }}
                      required
                    />
                    <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Pi Points per USD</small>
                  </div>
                </div>
              </div>

              {/* JazzCash Direct REST API Settings */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid #d5000066' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ff5252', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔴 JazzCash MWallet REST API v1.1 (Direct API)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={jazzcashEnabled} 
                        onChange={e => setJazzcashEnabled(e.target.checked)} 
                      />
                      Enable JazzCash
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      Merchant ID:
                    </label>
                    <input
                      type="text"
                      value={jazzcashMerchantId}
                      onChange={e => setJazzcashMerchantId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      Password:
                    </label>
                    <input
                      type="text"
                      value={jazzcashPassword}
                      onChange={e => setJazzcashPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      Integrity Salt (Secret Key):
                    </label>
                    <input
                      type="text"
                      value={jazzcashIntegritySalt}
                      onChange={e => setJazzcashIntegritySalt(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#ccc' }}>Default Player Gateway Route for JazzCash:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setJazzcashMode('direct_api')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: jazzcashMode === 'direct_api' ? '#d50000' : '#222',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Direct API (REST)
                    </button>
                    <button
                      type="button"
                      onClick={() => setJazzcashMode('directpay')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: jazzcashMode === 'directpay' ? 'var(--accent)' : '#222',
                        color: jazzcashMode === 'directpay' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Direct Pay Gateway
                    </button>
                  </div>
                </div>
              </div>

              {/* EasyPaisa Direct API Settings */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid #00c85366' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#00e676', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🟢 EasyPaisa Easypay API (Direct API)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={easypaisaEnabled} 
                        onChange={e => setEasypaisaEnabled(e.target.checked)} 
                      />
                      Enable EasyPaisa
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      Store ID:
                    </label>
                    <input
                      type="text"
                      value={easypaisaStoreId}
                      onChange={e => setEasypaisaStoreId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      Hash Key / AES Secret:
                    </label>
                    <input
                      type="text"
                      value={easypaisaHashKey}
                      onChange={e => setEasypaisaHashKey(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#ccc' }}>Default Player Gateway Route for EasyPaisa:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEasypaisaMode('direct_api')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: easypaisaMode === 'direct_api' ? '#00c853' : '#222',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Direct API (Easypay)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEasypaisaMode('directpay')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: easypaisaMode === 'directpay' ? 'var(--accent)' : '#222',
                        color: easypaisaMode === 'directpay' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Direct Pay Gateway
                    </button>
                  </div>
                </div>
              </div>

              {/* DirectPay Gateway API Settings */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#00e676', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚡ DirectPay Landing Page API (Payin PWA)
                  </h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={directpayEnabled} 
                      onChange={e => setDirectpayEnabled(e.target.checked)} 
                    />
                    Enable Gateway
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      DirectPay Client ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. pwa_ci_test123"
                      value={directpayClientId}
                      onChange={e => setDirectpayClientId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>
                      DirectPay Client Secret (HMAC-SHA256 Key):
                    </label>
                    <input
                      type="text"
                      placeholder="Your secret key from DirectPay"
                      value={directpayClientSecret}
                      onChange={e => setDirectpayClientSecret(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Card Gateway Preference */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid #2979ff66' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#2979ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💳 Card Payment Route Preference
                    </h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '12px' }}>Select the default processor for Debit / Credit Card deposits</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setCardMode('direct_api')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: cardMode === 'direct_api' ? '#2979ff' : '#222',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Direct API (JazzCash / EasyPay CC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardMode('directpay')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: cardMode === 'directpay' ? 'var(--accent)' : '#222',
                        color: cardMode === 'directpay' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Direct Pay Gateway
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn primary" 
                disabled={ratesLoading} 
                style={{ width: '100%', padding: '16px', fontSize: '15px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', borderRadius: '8px', marginTop: '8px' }}
              >
                {ratesLoading ? '💾 Saving settings...' : '💾 Save Rates & All Gateway Credentials'}
              </button>

            </form>
          </div>
        )}

        {/* ==========================================
            TAB 3: USERS & BALANCES
            ========================================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Registered Accounts</h2>
              <input 
                type="text" 
                placeholder="Search user email or ID..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '13px', width: '240px' }}
              />
            </div>

            {/* Adjust Balance Modal */}
            {selectedUser && (
              <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '16px' }}>
                    ✏️ Adjust Balance: {selectedUser.email}
                  </h3>
                  <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}>✕ Close</button>
                </div>
                
                {adjustMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', background: adjustMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: adjustMsg.type === 'error' ? '#ff6666' : '#00ff88' }}>
                    {adjustMsg.text}
                  </div>
                )}

                <form onSubmit={handleAdjustBalance} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount to Add/Deduct (e.g. +500 or -200)"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Reason / Note (optional)"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    style={{ flex: 2, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px' }}
                  />
                  <button type="submit" disabled={adjustLoading} className="btn primary" style={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '14px' }}>
                    {adjustLoading ? 'Applying...' : 'Apply Balance Adjustment'}
                  </button>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>No matching users found.</div>
              ) : (
                filteredUsers.map(u => {
                  const bal = getBalance(u.id)
                  return (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{u.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>ID: {u.id}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Current Balance</div>
                          <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '15px' }}>
                            Pi {bal}
                          </div>
                        </div>

                        <button 
                          onClick={() => { setSelectedUser(u); setAdjustMsg(null); setAdjustAmount('') }}
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          ✏️ Adjust
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
            TAB 4: REAL-TIME ENGINE & RISK GOVERNOR
            ========================================== */}
        {activeTab === 'risk' && (
          <div>
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--accent)' }}>🎯 Real-Time Engine & Risk Governor</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>Monitor live bets, winners vs losers, house profitability, and enforce anti-win limits</p>
              </div>
              <button 
                onClick={fetchRiskData} 
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                🔄 Live Refresh
              </button>
            </div>

            {/* Notification */}
            {riskMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', background: riskMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: riskMsg.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${riskMsg.type === 'error' ? '#ff444444' : '#00ff8844'}` }}>
                {riskMsg.text}
              </div>
            )}

            {/* Real-Time KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              
              {/* Total Wagered */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Wagered</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginTop: '6px' }}>
                  Pi {riskAnalytics?.summary?.totalWagered?.toFixed(2) || '0.00'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  {riskAnalytics?.summary?.totalBets || 0} Total Bets Placed
                </div>
              </div>

              {/* Total Paid Out */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid Out</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#ff9900', marginTop: '6px' }}>
                  Pi {riskAnalytics?.summary?.totalPayout?.toFixed(2) || '0.00'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Current Realized RTP: {riskAnalytics?.summary?.realizedRTP || '0.0%'}
                </div>
              </div>

              {/* Net House Profit */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net House Profit</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: (riskAnalytics?.summary?.grossProfit || 0) >= 0 ? 'var(--accent)' : '#ff4444', marginTop: '6px' }}>
                  Pi {riskAnalytics?.summary?.grossProfit?.toFixed(2) || '0.00'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  House Margin: {riskAnalytics?.summary?.margin || '0.0%'}
                </div>
              </div>

              {/* Winners vs Losers */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Winners vs Losers</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <div style={{ color: '#00e676', fontWeight: 'bold', fontSize: '18px' }}>
                    🟢 {riskAnalytics?.summary?.winnersCount || 0} Wins
                  </div>
                  <div style={{ color: '#ff5252', fontWeight: 'bold', fontSize: '18px' }}>
                    🔴 {riskAnalytics?.summary?.losersCount || 0} Losses
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Win Rate: {riskAnalytics?.summary?.totalBets ? ((riskAnalytics.summary.winnersCount / riskAnalytics.summary.totalBets) * 100).toFixed(1) : 0}%
                </div>
              </div>

            </div>

            {/* Risk Control Settings Form */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚙️ Global Anti-Win & RTP Risk Controls
              </h3>

              <form onSubmit={handleSaveRiskConfig} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Global Target RTP */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#eee' }}>
                      Global Target RTP (Return to Player)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="50"
                        max="99"
                        value={riskConfig.global_rtp}
                        onChange={e => {
                          const val = Math.max(50, Math.min(99, Number(e.target.value) || 50));
                          setRiskConfig(prev => ({ ...prev, global_rtp: val }));
                        }}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: '#000',
                          color: 'var(--accent)',
                          fontWeight: '900',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent)' }}>%</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '4px' }}>
                        (House Edge: {100 - (riskConfig.global_rtp || 92)}%)
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="99"
                    step="1"
                    value={riskConfig.global_rtp || 92}
                    onChange={e => setRiskConfig(prev => ({ ...prev, global_rtp: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '8px' }}
                  />

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[80, 85, 90, 92, 95, 98].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRiskConfig(prev => ({ ...prev, global_rtp: pct }))}
                        style={{
                          background: riskConfig.global_rtp === pct ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                          color: riskConfig.global_rtp === pct ? '#000' : '#fff',
                          border: '1px solid ' + (riskConfig.global_rtp === pct ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {pct}% RTP
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    Recommended: 90% - 94% for healthy house margin while maintaining high player retention.
                  </div>
                </div>

                {/* Max Single Win Cap */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#eee', marginBottom: '6px' }}>
                    Max Single Win Cap (Pi)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={riskConfig.max_win_cap}
                    onChange={e => setRiskConfig(prev => ({ ...prev, max_win_cap: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Any single game payout exceeding this threshold is automatically capped to protect house reserves.
                  </div>
                </div>

                {/* Force House Edge Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <input
                    type="checkbox"
                    id="forceHouseEdge"
                    checked={riskConfig.force_house_edge}
                    onChange={e => setRiskConfig(prev => ({ ...prev, force_house_edge: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="forceHouseEdge" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    🛡️ Enforce Anti-Streak House Protection (Prevent runaway user winning streaks)
                  </label>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={riskLoading}
                  style={{ background: 'linear-gradient(135deg, #00e676 0%, #00897b 100%)', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,230,118,0.3)' }}
                >
                  {riskLoading ? '💾 Saving Risk Settings...' : '💾 Apply & Save Risk Controls'}
                </button>

              </form>
            </div>

            {/* Top Winning Players with Stop Win Toggles */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
                  🏆 High Winning Players (Anti-Win Governor)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Click &quot;Stop Wins&quot; to halt excessive winning streaks
                </span>
              </div>

              {(!riskAnalytics?.topWinners || riskAnalytics.topWinners.length === 0) ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                  No player win activity recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {riskAnalytics.topWinners.map((w, idx) => {
                    const isRestricted = riskConfig.restricted_users?.includes(w.user_id)
                    return (
                      <div 
                        key={w.user_id || idx}
                        style={{
                          background: isRestricted ? 'rgba(255,68,68,0.08)' : '#131926',
                          border: `1px solid ${isRestricted ? '#ff444466' : 'var(--border)'}`,
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{w.email}</span>
                            {isRestricted ? (
                              <span style={{ background: '#ff4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                                🛑 WINS STOPPED
                              </span>
                            ) : (
                              <span style={{ background: '#00e67622', color: '#00e676', border: '1px solid #00e67644', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                                🟢 ACTIVE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                            ID: {w.user_id}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Total Won</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00e676' }}>
                              Pi {w.totalWon?.toFixed(2) || '0.00'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Net Profit</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: w.netProfit > 0 ? '#ff9900' : '#fff' }}>
                              Pi {w.netProfit?.toFixed(2) || '0.00'}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleUserRestriction(w.user_id)}
                            style={{
                              background: isRestricted ? '#1b5e20' : '#b71c1c',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isRestricted ? '✅ Allow Wins' : '🛑 Stop Wins'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Live Bet Feed */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ Live Real-Time Bets Feed
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Auto-updating stream</span>
              </div>

              {(!riskAnalytics?.recentBets || riskAnalytics.recentBets.length === 0) ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--muted)' }}>
                  No recent bets placed in this session yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {riskAnalytics.recentBets.map(bet => {
                    const isWin = (bet.payout_amount || 0) > (bet.bet_amount || 0)
                    return (
                      <div 
                        key={bet.id}
                        style={{
                          background: '#131926',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>{isWin ? '🟢' : '⚪'}</span>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>
                              {bet.user_email}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              Game: {bet.game_id} | {new Date(bet.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: isWin ? '#00e676' : '#fff' }}>
                            Bet: Pi {bet.bet_amount?.toFixed(2)} → Payout: Pi {bet.payout_amount?.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: isWin ? '#00e676' : '#ff4444' }}>
                            {isWin ? `+Pi ${(bet.payout_amount - bet.bet_amount).toFixed(2)} Win` : `-Pi ${bet.bet_amount?.toFixed(2)} Loss`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
