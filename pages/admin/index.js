import React, { useState, useEffect } from 'react'
import CurrencyFlag from '../../components/CurrencyFlag'

const ADMIN_PASSWORD = 'Admin@123'

const AVAILABLE_PERMISSIONS = [
  { id: 'view_payments', label: '⚡ View Auto Payments & Inquire API', icon: '💳' },
  { id: 'manage_deposits', label: '📥 Approve / Reject Manual Deposits', icon: '📥' },
  { id: 'manage_withdrawals', label: '📤 Process Withdrawal Payouts', icon: '📤' },
  { id: 'manage_balances', label: '✏️ Adjust User Balances & Bonuses', icon: '💰' },
  { id: 'manage_rates', label: '💵 Edit Exchange Rates & Gateway Keys', icon: '🔑' },
  { id: 'manage_risk', label: '🎯 Control RTP & Anti-Win Governor', icon: '🛡️' },
  { id: 'manage_team', label: '👑 Team Member & Role Management', icon: '👥' }
]

const PREDEFINED_ROLES = [
  {
    name: 'Super Admin',
    permissions: ['view_payments', 'manage_deposits', 'manage_withdrawals', 'manage_balances', 'manage_rates', 'manage_risk', 'manage_team']
  },
  {
    name: 'Payment & Payout Operator',
    permissions: ['view_payments', 'manage_deposits', 'manage_withdrawals']
  },
  {
    name: 'Risk & Game Controller',
    permissions: ['manage_risk', 'manage_balances']
  },
  {
    name: 'Customer Support Specialist',
    permissions: ['view_payments', 'manage_balances']
  },
  {
    name: 'Custom Task-Based Role',
    permissions: []
  }
]

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [users, setUsers] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // Tabs: 'autopayments' | 'manual_deposits' | 'withdrawals' | 'users' | 'team' | 'risk' | 'rates'
  const [activeTab, setActiveTab] = useState('autopayments')

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Transaction Category Sub-Filters
  const [autoTxFilter, setAutoTxFilter] = useState('all') // 'all' | 'completed' | 'failed' | 'pending'
  const [manualTxFilter, setManualTxFilter] = useState('all') // 'all' | 'pending' | 'completed' | 'failed'
  const [withdrawalTxFilter, setWithdrawalTxFilter] = useState('all') // 'all' | 'pending' | 'completed' | 'failed'

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
  const [jazzcashMode, setJazzcashMode] = useState('directpay')

  // EasyPaisa Direct API state
  const [easypaisaStoreId, setEasypaisaStoreId] = useState('43')
  const [easypaisaHashKey, setEasypaisaHashKey] = useState('1234567890123456')
  const [easypaisaEnabled, setEasypaisaEnabled] = useState(true)
  const [easypaisaMode, setEasypaisaMode] = useState('directpay')

  // Card Gateway state
  const [cardMode, setCardMode] = useState('directpay')

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
  const [selectedUser, setSelectedUser] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustMsg, setAdjustMsg] = useState(null)

  // DirectPay Inquiry state
  const [dpSearchId, setDpSearchId] = useState('')
  const [dpInquireData, setDpInquireData] = useState(null)
  const [dpInquireLoading, setDpInquireLoading] = useState(false)

  // Team & Role Management state
  const [teamList, setTeamList] = useState([])
  const [teamMsg, setTeamMsg] = useState(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [editingMember, setEditingMember] = useState(null) // null = new member mode
  const [memberName, setMemberName] = useState('')
  const [memberUsername, setMemberUsername] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPin, setMemberPin] = useState('')
  const [memberRole, setMemberRole] = useState('Payment Operator')
  const [memberPermissions, setMemberPermissions] = useState(['view_payments', 'manage_deposits', 'manage_withdrawals'])

  const handleDirectPayInquire = async (searchId = '') => {
    setDpInquireLoading(true)
    try {
      const targetId = searchId || dpSearchId
      const q = targetId ? `?txn_id=${encodeURIComponent(targetId)}` : '?all=true'
      const res = await fetch(`/api/payments/directpay/inquire${q}`)
      const data = await res.json()
      setDpInquireData(data)
    } catch (err) {
      alert('DirectPay inquiry error: ' + err.message)
    } finally {
      setDpInquireLoading(false)
    }
  }

  const login = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) setAuthed(true)
    else setMsg('Wrong password')
  }

  const fetchAdminData = async (showLoading = false) => {
    if (showLoading && allTransactions.length === 0) setLoading(true)
    try {
      const res = await fetch('/api/wallet/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD })
      })
      const data = await res.json()
      if (data.success) {
        setPending(data.pending || [])
        setAllTransactions(data.all_transactions || data.pending || [])
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
        setJazzcashMode(data.jazzcash_mode || 'directpay')

        if (data.easypaisa_store_id) setEasypaisaStoreId(data.easypaisa_store_id)
        if (data.easypaisa_hash_key) setEasypaisaHashKey(data.easypaisa_hash_key)
        if (data.easypaisa_enabled !== undefined) setEasypaisaEnabled(data.easypaisa_enabled)
        setEasypaisaMode(data.easypaisa_mode || 'directpay')

        setCardMode(data.card_mode || 'directpay')
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    }
  }

  const fetchLiveAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/live-analytics')
      const data = await res.json()
      if (data.success) setRiskAnalytics(data)
    } catch (err) {
      console.error('Error fetching live analytics:', err)
    }
  }

  const fetchRiskConfig = async () => {
    try {
      const res = await fetch('/api/admin/risk-settings')
      const data = await res.json()
      if (data.success && data.config) setRiskConfig(data.config)
    } catch (err) {
      console.error('Error fetching risk config:', err)
    }
  }

  const fetchTeamData = async () => {
    try {
      const res = await fetch('/api/admin/team')
      const data = await res.json()
      if (data.success) setTeamList(data.team || [])
    } catch (err) {
      console.error('Error fetching team data:', err)
    }
  }

  const fetchRiskData = async () => {
    await Promise.all([fetchLiveAnalytics(), fetchRiskConfig()])
  }

  useEffect(() => {
    if (authed) {
      fetchAdminData(true)
      fetchRates()
      fetchRiskConfig()
      fetchLiveAnalytics()
      fetchTeamData()

      // Silent background poll every 5s without screen blinking or loading indicator
      const interval = setInterval(() => {
        fetchLiveAnalytics()
        fetchAdminData(false)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [authed])

  // Team Form Handlers
  const handleSaveMember = async (e) => {
    e.preventDefault()
    setTeamLoading(true)
    setTeamMsg(null)
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          action: editingMember ? 'update' : 'add',
          member: {
            id: editingMember?.id,
            name: memberName,
            username: memberUsername,
            email: memberEmail,
            pin: memberPin,
            role: memberRole,
            permissions: memberPermissions
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        setTeamMsg({ type: 'success', text: data.message })
        setTeamList(data.team)
        resetMemberForm()
      } else {
        setTeamMsg({ type: 'error', text: data.error })
      }
    } catch (err) {
      setTeamMsg({ type: 'error', text: err.message })
    } finally {
      setTeamLoading(false)
    }
  }

  const resetMemberForm = () => {
    setEditingMember(null)
    setMemberName('')
    setMemberUsername('')
    setMemberEmail('')
    setMemberPin('')
    setMemberRole('Payment Operator')
    setMemberPermissions(['view_payments', 'manage_deposits', 'manage_withdrawals'])
  }

  const editMember = (m) => {
    setEditingMember(m)
    setMemberName(m.name || '')
    setMemberUsername(m.username || '')
    setMemberEmail(m.email || '')
    setMemberPin(m.pin || '')
    setMemberRole(m.role || 'Custom Task-Based Role')
    setMemberPermissions(m.permissions || [])
    setTeamMsg(null)
  }

  const deleteMember = async (m) => {
    if (!confirm(`Are you sure you want to remove team member '${m.name}'?`)) return
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          action: 'delete',
          member: { id: m.id }
        })
      })
      const data = await res.json()
      if (data.success) {
        setTeamList(data.team)
        setTeamMsg({ type: 'success', text: data.message })
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleMemberStatus = async (m) => {
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          action: 'toggle_status',
          member: { id: m.id }
        })
      })
      const data = await res.json()
      if (data.success) {
        setTeamList(data.team)
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRoleSelect = (roleName) => {
    setMemberRole(roleName)
    const found = PREDEFINED_ROLES.find(r => r.name === roleName)
    if (found && roleName !== 'Custom Task-Based Role') {
      setMemberPermissions(found.permissions)
    }
  }

  const togglePermission = (permId) => {
    setMemberPermissions(prev => {
      if (prev.includes(permId)) {
        return prev.filter(p => p !== permId)
      } else {
        return [...prev, permId]
      }
    })
    setMemberRole('Custom Task-Based Role')
  }

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
        fetchAdminData()
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
    if (!userId) return 'Unknown Account'
    if (userId.includes('@')) return userId
    const found = users.find(u => u.id === userId || u.email === userId)
    return found ? found.email : userId
  }

  // Lookup helper: user ID/email to balance
  const getBalance = (userId, email = '') => {
    let found = wallets.find(w => w.user_id === userId)
    if (!found && email) {
      found = wallets.find(w => w.email && w.email.toLowerCase() === email.toLowerCase())
    }
    if (!found && userId && userId.includes('@')) {
      found = wallets.find(w => w.email && w.email.toLowerCase() === userId.toLowerCase())
    }
    return found ? parseFloat(found.balance || 0).toFixed(2) : '0.00'
  }

  // Categories of Transactions:
  // 1. Auto Payments (DirectPay & Gateway)
  const autoPaymentsList = allTransactions.filter(t => 
    (t.method && t.method.toLowerCase().includes('directpay')) ||
    (t.tx_id && String(t.tx_id).toUpperCase().startsWith('TXN-')) ||
    t.metadata?.gateway === 'DirectPay'
  )

  // 2. Manual Deposits
  const manualDepositsList = allTransactions.filter(t => 
    t.type === 'deposit' && 
    !(t.method && t.method.toLowerCase().includes('directpay')) &&
    !(t.tx_id && String(t.tx_id).toUpperCase().startsWith('TXN-')) &&
    t.metadata?.gateway !== 'DirectPay'
  )

  // 3. Withdrawals
  const withdrawalsList = allTransactions.filter(t => t.type === 'withdrawal')

  // Filtered users list
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.id && u.id.includes(searchQuery))
  )

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>WinX Pro Admin Console</h2>
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
    padding: '10px 16px',
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? '#000' : '#fff',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '24px 16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: 'var(--accent)', margin: 0, fontSize: '24px' }}>🛡️ WinX Pro Management Console</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>Organized auto payments, manual deposits, withdrawals, users & team role management</p>
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

        {/* Primary Dashboard Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={tabStyle(activeTab === 'autopayments')} onClick={() => setActiveTab('autopayments')}>
            ⚡ Auto Payments ({autoPaymentsList.length})
          </button>
          <button style={tabStyle(activeTab === 'manual_deposits')} onClick={() => setActiveTab('manual_deposits')}>
            📥 Manual Deposits ({manualDepositsList.length})
          </button>
          <button style={tabStyle(activeTab === 'withdrawals')} onClick={() => setActiveTab('withdrawals')}>
            📤 Withdrawals ({withdrawalsList.length})
          </button>
          <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>
            👥 Accounts ({users.length})
          </button>
          <button style={tabStyle(activeTab === 'team')} onClick={() => setActiveTab('team')}>
            🔑 Team & Roles ({teamList.length})
          </button>
          <button style={tabStyle(activeTab === 'risk')} onClick={() => setActiveTab('risk')}>
            🎯 Real-Time Engine
          </button>
          <button style={tabStyle(activeTab === 'rates')} onClick={() => setActiveTab('rates')}>
            💵 Gateway Settings
          </button>
        </div>

        {/* ==========================================
            TAB 1: ⚡ AUTO PAYMENTS (DIRECTPAY & GATEWAYS)
            ========================================== */}
        {activeTab === 'autopayments' && (
          <div>
            {/* Auto Payments Summary Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total Auto Payment Volume</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CurrencyFlag size={18} />
                  {autoPaymentsList.filter(t => t.status === 'completed').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toFixed(2)}
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid #00ff8844', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: '#00ff88', fontSize: '11px', textTransform: 'uppercase' }}>Successful Payments</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#00ff88', marginTop: '4px' }}>
                  {autoPaymentsList.filter(t => t.status === 'completed').length} Completed
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid #ff000044', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: '#ff6666', fontSize: '11px', textTransform: 'uppercase' }}>Failed / Cancelled</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#ff6666', marginTop: '4px' }}>
                  {autoPaymentsList.filter(t => t.status === 'failed' || t.status === 'cancelled').length} Failed
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid #ff990044', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: '#ff9900', fontSize: '11px', textTransform: 'uppercase' }}>Pending Gateways</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#ff9900', marginTop: '4px' }}>
                  {autoPaymentsList.filter(t => t.status === 'pending').length} Pending
                </div>
              </div>
            </div>

            {/* Filter & Live Search Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAutoTxFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: autoTxFilter === 'all' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: autoTxFilter === 'all' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  All Auto Payments ({autoPaymentsList.length})
                </button>
                <button
                  onClick={() => setAutoTxFilter('completed')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: autoTxFilter === 'completed' ? '#00ff88' : 'var(--bg-tertiary)',
                    color: autoTxFilter === 'completed' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Success Tags ({autoPaymentsList.filter(t => t.status === 'completed').length})
                </button>
                <button
                  onClick={() => setAutoTxFilter('failed')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: autoTxFilter === 'failed' ? '#ff4444' : 'var(--bg-tertiary)',
                    color: autoTxFilter === 'failed' ? '#fff' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔴 Failed Tags ({autoPaymentsList.filter(t => t.status === 'failed' || t.status === 'cancelled').length})
                </button>
                <button
                  onClick={() => setAutoTxFilter('pending')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: autoTxFilter === 'pending' ? '#ff9900' : 'var(--bg-tertiary)',
                    color: autoTxFilter === 'pending' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ Pending ({autoPaymentsList.filter(t => t.status === 'pending').length})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fetchAdminData(false)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  🔄 Sync DirectPay Live
                </button>
              </div>
            </div>

            {/* List of Automated Payments */}
            {(() => {
              const displayList = autoPaymentsList.filter(t => {
                if (autoTxFilter === 'completed') return t.status === 'completed';
                if (autoTxFilter === 'failed') return t.status === 'failed' || t.status === 'cancelled';
                if (autoTxFilter === 'pending') return t.status === 'pending';
                return true;
              });

              if (displayList.length === 0) {
                return (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    No automated gateway payments match this filter.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayList.map(tx => {
                    const isCompleted = tx.status === 'completed';
                    const isPending = tx.status === 'pending';
                    const isFailed = tx.status === 'failed' || tx.status === 'cancelled';

                    return (
                      <div key={tx.id || tx.tx_id} style={{ background: 'var(--card)', border: `1px solid ${isCompleted ? '#00ff8855' : isPending ? '#ff990055' : '#ff000055'}`, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: '900', 
                              textTransform: 'uppercase',
                              background: isCompleted ? '#00ff8822' : isPending ? '#ff990022' : '#ff000022',
                              color: isCompleted ? '#00ff88' : isPending ? '#ff9900' : '#ff6666',
                              border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : '#ff000044'}`
                            }}>
                              {isCompleted ? '✓ SUCCESS' : isFailed ? '✕ FAILED' : '⏳ PENDING'}
                            </span>
                            <strong style={{ fontSize: '18px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CurrencyFlag size={16} />{parseFloat(tx.amount || 0).toFixed(2)}
                            </strong>
                            <span style={{ fontSize: '13px', color: '#00e5ff', fontWeight: 'bold' }}>via {tx.method}</span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#ccc', marginTop: '6px' }}>
                            <strong>Player Account:</strong> {tx.email || getEmail(tx.user_id)} <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'monospace' }}>({tx.user_id})</span>
                          </div>

                          {(() => {
                            const paymentPhone = tx.metadata?.account_number || tx.metadata?.msisdn || (tx.notes && tx.notes.match(/(?:Phone\/Account|Phone|Account):\s*(\d+)/i)?.[1]);
                            return paymentPhone ? (
                              <div style={{ fontSize: '13px', color: '#00ff88', marginTop: '2px' }}>
                                <strong>📱 Payment Account / Mobile:</strong> {paymentPhone}
                              </div>
                            ) : null;
                          })()}

                          {(tx.tx_id || tx.id) && (
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', fontFamily: 'monospace' }}>
                              <strong>Merchant TxID:</strong> {tx.tx_id || tx.id}
                            </div>
                          )}

                          {tx.metadata?.gateway_transaction_id && (
                            <div style={{ fontSize: '12px', color: '#ffb300', marginTop: '2px', fontFamily: 'monospace' }}>
                              <strong>⚡ DirectPay Gateway Ref:</strong> {tx.metadata.gateway_transaction_id}
                            </div>
                          )}

                          {tx.notes && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                              <em>📝 {tx.notes}</em>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#888' }}>📅 {new Date(tx.created_at).toLocaleString()}</span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`/api/payments/directpay/inquire?txn_id=${encodeURIComponent(tx.tx_id || tx.id)}`);
                                  const data = await res.json();
                                  alert(`DirectPay Transaction Details:\n\nMerchant TxID: ${data.client_transaction_id || tx.tx_id}\nGateway ID: ${data.gateway_transaction_id || 'N/A'}\nStatus: ${data.gateway_status || tx.status}\nAmount: PKR ${data.amountInPKR}\nAccount: ${data.account_number}`);
                                } catch (err) {
                                  alert('Failed to inquire DirectPay details: ' + err.message);
                                }
                              }}
                              style={{
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '1px solid var(--accent)',
                                color: 'var(--accent)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              🔍 Inquire DirectPay API
                            </button>
                          </div>
                        </div>

                        {isPending && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'approve')}
                              style={{ padding: '8px 16px', background: '#00cc66', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✓ Force Approve
                            </button>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'reject')}
                              style={{ padding: '8px 16px', background: '#331111', color: '#ff6666', border: '1px solid #ff444444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✕ Mark Failed
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==========================================
            TAB 2: 📥 MANUAL DEPOSITS
            ========================================== */}
        {activeTab === 'manual_deposits' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setManualTxFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: manualTxFilter === 'all' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: manualTxFilter === 'all' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  All Manual Deposits ({manualDepositsList.length})
                </button>
                <button
                  onClick={() => setManualTxFilter('pending')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: manualTxFilter === 'pending' ? '#ff9900' : 'var(--bg-tertiary)',
                    color: manualTxFilter === 'pending' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ Pending Approvals ({manualDepositsList.filter(t => t.status === 'pending').length})
                </button>
                <button
                  onClick={() => setManualTxFilter('completed')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: manualTxFilter === 'completed' ? '#00ff88' : 'var(--bg-tertiary)',
                    color: manualTxFilter === 'completed' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Approved ({manualDepositsList.filter(t => t.status === 'completed').length})
                </button>
              </div>

              <button onClick={() => fetchAdminData(false)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                🔄 Refresh
              </button>
            </div>

            {(() => {
              const displayList = manualDepositsList.filter(t => {
                if (manualTxFilter === 'pending') return t.status === 'pending';
                if (manualTxFilter === 'completed') return t.status === 'completed';
                if (manualTxFilter === 'failed') return t.status === 'failed';
                return true;
              });

              if (displayList.length === 0) {
                return (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    No manual deposit requests in this view.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayList.map(tx => {
                    const isCompleted = tx.status === 'completed';
                    const isPending = tx.status === 'pending';
                    return (
                      <div key={tx.id || tx.tx_id} style={{ background: 'var(--card)', border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : 'var(--border)'}`, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: isCompleted ? '#00ff8822' : isPending ? '#ff990022' : '#ff000022',
                              color: isCompleted ? '#00ff88' : isPending ? '#ff9900' : '#ff6666',
                              border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : '#ff000044'}`
                            }}>
                              {tx.status}
                            </span>
                            <strong style={{ fontSize: '16px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CurrencyFlag size={14} />{parseFloat(tx.amount || 0).toFixed(2)}
                            </strong>
                            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>via {tx.method}</span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#ccc', marginTop: '6px' }}>
                            <strong>Player Account:</strong> {tx.email || getEmail(tx.user_id)}
                          </div>

                          {tx.tx_id && (
                            <div style={{ fontSize: '12px', color: '#00e5ff', marginTop: '2px', fontFamily: 'monospace' }}>
                              <strong>TxID / Reference:</strong> {tx.tx_id}
                            </div>
                          )}

                          {tx.notes && (
                            <div style={{ fontSize: '12px', color: '#ffb300', marginTop: '2px' }}>
                              <em>📝 {tx.notes}</em>
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                            📅 {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>

                        {isPending && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'approve')}
                              style={{ padding: '8px 16px', background: '#00cc66', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'reject')}
                              style={{ padding: '8px 16px', background: '#331111', color: '#ff6666', border: '1px solid #ff444444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==========================================
            TAB 3: 📤 WITHDRAWALS
            ========================================== */}
        {activeTab === 'withdrawals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setWithdrawalTxFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: withdrawalTxFilter === 'all' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: withdrawalTxFilter === 'all' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  All Withdrawals ({withdrawalsList.length})
                </button>
                <button
                  onClick={() => setWithdrawalTxFilter('pending')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: withdrawalTxFilter === 'pending' ? '#ff9900' : 'var(--bg-tertiary)',
                    color: withdrawalTxFilter === 'pending' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ Pending Payouts ({withdrawalsList.filter(t => t.status === 'pending').length})
                </button>
                <button
                  onClick={() => setWithdrawalTxFilter('completed')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: withdrawalTxFilter === 'completed' ? '#00ff88' : 'var(--bg-tertiary)',
                    color: withdrawalTxFilter === 'completed' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Processed ({withdrawalsList.filter(t => t.status === 'completed').length})
                </button>
              </div>

              <button onClick={() => fetchAdminData(false)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                🔄 Refresh
              </button>
            </div>

            {(() => {
              const displayList = withdrawalsList.filter(t => {
                if (withdrawalTxFilter === 'pending') return t.status === 'pending';
                if (withdrawalTxFilter === 'completed') return t.status === 'completed';
                if (withdrawalTxFilter === 'failed') return t.status === 'failed';
                return true;
              });

              if (displayList.length === 0) {
                return (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    No withdrawal requests in this category.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayList.map(tx => {
                    const isCompleted = tx.status === 'completed';
                    const isPending = tx.status === 'pending';
                    const targetAccount = tx.metadata?.account_number || (tx.notes && tx.notes.match(/(?:account|phone)\s*(\d+)/i)?.[1]) || 'N/A';

                    return (
                      <div key={tx.id || tx.tx_id} style={{ background: 'var(--card)', border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : 'var(--border)'}`, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: '#ff990022',
                              color: '#ff9900',
                              border: '1px solid #ff990044'
                            }}>
                              WITHDRAWAL
                            </span>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: isCompleted ? '#00ff8822' : isPending ? '#ff990022' : '#ff000022',
                              color: isCompleted ? '#00ff88' : isPending ? '#ff9900' : '#ff6666',
                              border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : '#ff000044'}`
                            }}>
                              {tx.status}
                            </span>
                            <strong style={{ fontSize: '16px', color: '#ff9900', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CurrencyFlag size={14} />{parseFloat(tx.amount || 0).toFixed(2)}
                            </strong>
                            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>via {tx.method}</span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#ccc', marginTop: '6px' }}>
                            <strong>Player Account:</strong> {tx.email || getEmail(tx.user_id)}
                          </div>

                          <div style={{ fontSize: '13px', color: '#00e5ff', marginTop: '2px' }}>
                            <strong>🏦 Payout Mobile/Account Number:</strong> {targetAccount}
                          </div>

                          {tx.notes && (
                            <div style={{ fontSize: '12px', color: '#ffb300', marginTop: '2px' }}>
                              <em>📝 {tx.notes}</em>
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                            📅 {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>

                        {isPending && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'approve')}
                              style={{ padding: '8px 16px', background: '#00cc66', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✓ Approve Payout
                            </button>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'reject')}
                              style={{ padding: '8px 16px', background: '#331111', color: '#ff6666', border: '1px solid #ff444444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✕ Reject & Refund
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==========================================
            TAB 4: 🔑 TEAM ROLES & TASK-BASED ACCESS
            ========================================== */}
        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '20px' }}>🔑 Team & Task-Based Role Management</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                  Add team operators and delegate specific task-based permissions (Deposits, Payouts, Balances, Risk Control)
                </p>
              </div>
              <button 
                onClick={resetMemberForm}
                style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                ➕ Add New Team Member
              </button>
            </div>

            {teamMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', background: teamMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: teamMsg.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${teamMsg.type === 'error' ? '#ff444444' : '#00ff8844'}` }}>
                {teamMsg.text}
              </div>
            )}

            {/* Member Form Card */}
            <div style={{ background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px' }}>
                {editingMember ? `✏️ Edit Team Member: ${editingMember.name}` : '👤 Create New Task-Based Team Member'}
              </h3>

              <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Full Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Ali Hassan"
                      value={memberName}
                      onChange={e => setMemberName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Username:</label>
                    <input
                      type="text"
                      placeholder="e.g. ali_operator"
                      value={memberUsername}
                      onChange={e => setMemberUsername(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Email Address:</label>
                    <input
                      type="email"
                      placeholder="e.g. ali@winxpro.com"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Access PIN / Password:</label>
                    <input
                      type="text"
                      placeholder="Access PIN e.g. 123456"
                      value={memberPin}
                      onChange={e => setMemberPin(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                {/* Role Preset Selector */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Select Preset Role:</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PREDEFINED_ROLES.map(r => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => handleRoleSelect(r.name)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid ' + (memberRole === r.name ? 'var(--accent)' : 'var(--border)'),
                          background: memberRole === r.name ? 'var(--accent)' : 'var(--bg-tertiary)',
                          color: memberRole === r.name ? '#000' : '#fff',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Task Access Permissions Checkboxes */}
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
                    🎯 Task-Based Access Permissions:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {AVAILABLE_PERMISSIONS.map(p => {
                      const isChecked = memberPermissions.includes(p.id)
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isChecked ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${isChecked ? '#00ff8844' : 'var(--border)'}`,
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: isChecked ? '#00ff88' : '#ccc'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                          />
                          <span>{p.icon} {p.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {teamLoading ? 'Saving...' : editingMember ? '💾 Update Member Permissions' : '🚀 Add Team Member'}
                  </button>
                  {editingMember && (
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      style={{ background: 'var(--bg-tertiary)', color: '#fff', border: '1px solid var(--border)', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* Active Team Members List */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px' }}>
                📋 Active Team Members & Assigned Tasks ({teamList.length})
              </h3>

              {teamList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>No team members configured yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {teamList.map(m => {
                    const isSuspended = m.status === 'suspended'
                    return (
                      <div
                        key={m.id}
                        style={{
                          background: isSuspended ? 'rgba(255,68,68,0.08)' : 'var(--bg-tertiary)',
                          border: `1px solid ${isSuspended ? '#ff444444' : 'var(--border)'}`,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>{m.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 'bold', fontFamily: 'monospace' }}>@{m.username}</span>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(255,215,0,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                              {m.role}
                            </span>
                            {isSuspended ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: '#ff4444', color: '#fff' }}>
                                SUSPENDED
                              </span>
                            ) : (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}>
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                            {m.email && <span>Email: {m.email} | </span>}
                            <span>PIN / Key: <code style={{ color: '#00e5ff' }}>{m.pin}</code></span>
                          </div>

                          {/* Task Badges */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {(m.permissions || []).map(pId => {
                              const pObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId)
                              return (
                                <span key={pId} style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                                  {pObj ? `${pObj.icon} ${pObj.id}` : pId}
                                </span>
                              )
                            })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => editMember(m)}
                            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => toggleMemberStatus(m)}
                            style={{ background: isSuspended ? '#00cc66' : '#332211', color: isSuspended ? '#000' : '#ff9900', border: '1px solid #ff990044', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => deleteMember(m)}
                            style={{ background: '#331111', color: '#ff6666', border: '1px solid #ff444444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            TAB 5: 👥 USERS & ACCOUNTS
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
                  const bal = u.balance !== undefined && Number(u.balance) > 0 ? parseFloat(u.balance).toFixed(2) : getBalance(u.id, u.email)
                  return (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{u.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>ID: {u.id}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Current Balance</div>
                          <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CurrencyFlag size={14} />{bal}
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
            TAB 6: REAL-TIME ENGINE & RISK GOVERNOR
            ========================================== */}
        {activeTab === 'risk' && (
          <div>
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

            {riskMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', background: riskMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: riskMsg.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${riskMsg.type === 'error' ? '#ff444444' : '#00ff8844'}` }}>
                {riskMsg.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Total Wagered</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CurrencyFlag size={20} />{riskAnalytics?.summary?.totalWagered?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Total Paid Out</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#ff9900', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CurrencyFlag size={20} />{riskAnalytics?.summary?.totalPayout?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Net House Profit</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: (riskAnalytics?.summary?.grossProfit || 0) >= 0 ? 'var(--accent)' : '#ff4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CurrencyFlag size={20} />{riskAnalytics?.summary?.grossProfit?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontSize: '16px' }}>⚙️ Global Anti-Win & RTP Risk Controls</h3>
              <form onSubmit={handleSaveRiskConfig} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#eee', display: 'block', marginBottom: '8px' }}>
                    Global Target RTP (Return to Player): {riskConfig.global_rtp}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    step="1"
                    value={riskConfig.global_rtp || 92}
                    onChange={e => setRiskConfig(prev => ({ ...prev, global_rtp: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#eee', marginBottom: '6px' }}>Max Single Win Cap</label>
                  <input
                    type="number"
                    value={riskConfig.max_win_cap}
                    onChange={e => setRiskConfig(prev => ({ ...prev, max_win_cap: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '14px' }}
                  />
                </div>

                <button type="submit" disabled={riskLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                  {riskLoading ? 'Saving...' : '💾 Apply & Save Risk Controls'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: 💵 GATEWAY SETTINGS & RATES
            ========================================== */}
        {activeTab === 'rates' && (
          <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
            <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>💵 Conversion Rates & DirectPay Gateway Credentials</h2>

            {ratesMsg && (
              <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', background: ratesMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: ratesMsg.type === 'error' ? '#ff6666' : '#00ff88' }}>
                {ratesMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: 'var(--accent)' }}>⚡ DirectPay Landing Page API Credentials</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>DirectPay Client ID:</label>
                    <input
                      type="text"
                      value={directpayClientId}
                      onChange={e => setDirectpayClientId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '4px' }}>DirectPay Client Secret:</label>
                    <input
                      type="text"
                      value={directpayClientSecret}
                      onChange={e => setDirectpayClientSecret(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={ratesLoading} style={{ width: '100%', padding: '16px', fontSize: '15px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', borderRadius: '8px' }}>
                {ratesLoading ? 'Saving...' : '💾 Save Rates & Gateway Credentials'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
