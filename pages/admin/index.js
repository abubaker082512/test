import Head from 'next/head'
import React, { useState, useEffect, useRef } from 'react'
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)
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
  const [betFilter, setBetFilter] = useState('all')
  const [betSearch, setBetSearch] = useState('')

  // 24/7 Live Support Chat states (persisted & retained)
  const [chatThreads, setChatThreads] = useState([])
  const [selectedChatUser, setSelectedChatUser] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [adminReplyText, setAdminReplyText] = useState('')
  const [adminReplyImage, setAdminReplyImage] = useState(null)
  const [adminReplyLoading, setAdminReplyLoading] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const adminChatEndRef = useRef(null)

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

  // SoftAggregator 11,200+ Games API state
  const [sgTestGameId, setSgTestGameId] = useState('xddb07a7a584679c') // Gates of Olympus
  const [sgLaunchResult, setSgLaunchResult] = useState(null)
  const [sgTesting, setSgTesting] = useState(false)
  const [sgCallbackCheck, setSgCallbackCheck] = useState(null)

  // Card Gateway state
  const [cardMode, setCardMode] = useState('directpay')

  // Manual P2P Receiving Accounts & Limits state
  const [manualDepositEnabled, setManualDepositEnabled] = useState(true)
  const [minDeposit, setMinDeposit] = useState('200')
  const [maxDeposit, setMaxDeposit] = useState('100000')
  const [minWithdraw, setMinWithdraw] = useState('500')
  const [maxWithdraw, setMaxWithdraw] = useState('50000')
  const [manualJazzcashTitle, setManualJazzcashTitle] = useState('')
  const [manualJazzcashNo, setManualJazzcashNo] = useState('')
  const [manualJazzcash2Title, setManualJazzcash2Title] = useState('')
  const [manualJazzcash2No, setManualJazzcash2No] = useState('')
  const [manualEasypaisaTitle, setManualEasypaisaTitle] = useState('')
  const [manualEasypaisaNo, setManualEasypaisaNo] = useState('')
  const [manualEasypaisa2Title, setManualEasypaisa2Title] = useState('')
  const [manualEasypaisa2No, setManualEasypaisa2No] = useState('')
  const [manualCryptoNetwork, setManualCryptoNetwork] = useState('USDT (TRC20)')
  const [manualCryptoAddress, setManualCryptoAddress] = useState('')
  const [depositInstructions, setDepositInstructions] = useState('')
  const [copiedTid, setCopiedTid] = useState(null)

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

  const login = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setMsg(null)
    try {
      // Try the new API login
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || 'admin', password })
      })
      const data = await res.json()
      if (data.success) {
        setAuthed(true)
        setCurrentAdmin(data.admin)
      } else {
        // Legacy fallback
        if (password === ADMIN_PASSWORD) {
          setAuthed(true)
          setCurrentAdmin({ username: 'admin', role: 'super_admin' })
        } else {
          setMsg(data.error || 'Invalid credentials')
        }
      }
    } catch (err) {
      // Network error - fallback to hardcoded
      if (password === ADMIN_PASSWORD) {
        setAuthed(true)
        setCurrentAdmin({ username: 'admin', role: 'super_admin' })
      } else {
        setMsg('Login failed. Check credentials.')
      }
    } finally {
      setLoginLoading(false)
    }
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

        if (data.manual_deposit_enabled !== undefined) setManualDepositEnabled(data.manual_deposit_enabled)
        if (data.min_deposit !== undefined) setMinDeposit(data.min_deposit.toString())
        if (data.max_deposit !== undefined) setMaxDeposit(data.max_deposit.toString())
        if (data.min_withdraw !== undefined) setMinWithdraw(data.min_withdraw.toString())
        if (data.max_withdraw !== undefined) setMaxWithdraw(data.max_withdraw.toString())
        if (data.manual_jazzcash_title) setManualJazzcashTitle(data.manual_jazzcash_title)
        if (data.manual_jazzcash_no) setManualJazzcashNo(data.manual_jazzcash_no)
        if (data.manual_jazzcash2_title) setManualJazzcash2Title(data.manual_jazzcash2_title)
        if (data.manual_jazzcash2_no) setManualJazzcash2No(data.manual_jazzcash2_no)
        if (data.manual_easypaisa_title) setManualEasypaisaTitle(data.manual_easypaisa_title)
        if (data.manual_easypaisa_no) setManualEasypaisaNo(data.manual_easypaisa_no)
        if (data.manual_easypaisa2_title) setManualEasypaisa2Title(data.manual_easypaisa2_title)
        if (data.manual_easypaisa2_no) setManualEasypaisa2No(data.manual_easypaisa2_no)
        if (data.manual_crypto_network) setManualCryptoNetwork(data.manual_crypto_network)
        if (data.manual_crypto_address) setManualCryptoAddress(data.manual_crypto_address)
        if (data.deposit_instructions) setDepositInstructions(data.deposit_instructions)
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

  const fetchChatThreads = async () => {
    try {
      const res = await fetch('/api/admin/support/threads')
      const data = await res.json()
      if (data.success && Array.isArray(data.threads)) {
        if (data.threads.length > 0) {
          setChatThreads(data.threads)
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('winx_admin_cached_threads', JSON.stringify(data.threads)) } catch (e) {}
          }
          setSelectedChatUser(prev => {
            if (prev && data.threads.some(t => t.user_key === prev)) {
              return prev
            }
            return data.threads[0].user_key
          })
        } else {
          if (typeof window !== 'undefined') {
            try {
              const cached = JSON.parse(localStorage.getItem('winx_admin_cached_threads') || '[]')
              if (cached && cached.length > 0) {
                setChatThreads(cached)
                setSelectedChatUser(prev => (prev && cached.some(t => t.user_key === prev) ? prev : cached[0].user_key))
                fetch('/api/admin/support/threads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sync_threads: cached })
                }).catch(() => {})
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  const fetchActiveThreadMessages = async (userKey) => {
    if (!userKey) return
    let localMsgs = []
    if (typeof window !== 'undefined') {
      try {
        localMsgs = JSON.parse(localStorage.getItem('winx_admin_msg_' + userKey) || '[]')
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/admin/support/threads?user_key=' + encodeURIComponent(userKey))
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        const serverMsgs = data.messages
        const map = new Map()
        localMsgs.forEach(m => { if (m && m.id) map.set(m.id, m) })
        serverMsgs.forEach(m => { if (m && m.id) map.set(m.id, m) })
        const merged = Array.from(map.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

        setChatMessages(merged)
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('winx_admin_msg_' + userKey, JSON.stringify(merged)) } catch (e) {}
        }

        if (merged.length > serverMsgs.length) {
          fetch('/api/support/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync',
              user_key: userKey,
              messages: merged
            })
          }).catch(() => {})
        }
      }
    } catch (e) {
      if (localMsgs.length > 0) setChatMessages(localMsgs)
    }
  }

  const handleSendAdminReply = async (e, textOverride = null) => {
    if (e) e.preventDefault()
    const textToSend = textOverride !== null ? textOverride : adminReplyText
    if (!selectedChatUser || (!textToSend.trim() && !adminReplyImage)) return

    setAdminReplyLoading(true)
    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: selectedChatUser,
          admin_name: 'WinX Pro Support Specialist',
          text: textToSend.trim(),
          image: adminReplyImage
        })
      })
      const data = await res.json()
      if (data.success) {
        setAdminReplyText('')
        setAdminReplyImage(null)
        if (data.messages) setChatMessages(data.messages)
        fetchChatThreads()
      }
    } catch (err) {
      alert('Failed to send reply: ' + err.message)
    } finally {
      setAdminReplyLoading(false)
    }
  }

  const fetchRiskData = async () => {
    await Promise.all([fetchLiveAnalytics(), fetchRiskConfig()])
  }

  // Poll all support chat threads regularly so admin sees incoming chats instantly
  useEffect(() => {
    if (authed) {
      fetchChatThreads()
      const poll = setInterval(fetchChatThreads, 3000)
      return () => clearInterval(poll)
    }
  }, [authed])

  // Poll active thread messages
  useEffect(() => {
    if (authed && selectedChatUser) {
      fetchActiveThreadMessages(selectedChatUser)
      const poll = setInterval(() => fetchActiveThreadMessages(selectedChatUser), 2000)
      return () => clearInterval(poll)
    }
  }, [authed, selectedChatUser])

  // Auto scroll chat to latest message for admin
  useEffect(() => {
    if (chatMessages.length > 0) {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // Refresh immediately when clicking the support tab
  useEffect(() => {
    if (authed && activeTab === 'support') {
      fetchChatThreads()
      if (selectedChatUser) fetchActiveThreadMessages(selectedChatUser)
    }
  }, [authed, activeTab])

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
          card_mode: cardMode,
          manual_deposit_enabled: manualDepositEnabled,
          min_deposit: Number(minDeposit),
          max_deposit: Number(maxDeposit),
          min_withdraw: Number(minWithdraw),
          max_withdraw: Number(maxWithdraw),
          manual_jazzcash_title: manualJazzcashTitle,
          manual_jazzcash_no: manualJazzcashNo,
          manual_jazzcash2_title: manualJazzcash2Title,
          manual_jazzcash2_no: manualJazzcash2No,
          manual_easypaisa_title: manualEasypaisaTitle,
          manual_easypaisa_no: manualEasypaisaNo,
          manual_easypaisa2_title: manualEasypaisa2Title,
          manual_easypaisa2_no: manualEasypaisa2No,
          manual_crypto_network: manualCryptoNetwork,
          manual_crypto_address: manualCryptoAddress,
          deposit_instructions: depositInstructions
        })
      })
      const data = await res.json()
      if (data.success) {
        setRatesMsg({ type: 'success', text: 'All manual receiving accounts, limits, and gateway settings updated successfully!' })
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
    <div className="admin-full-screen" style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128272;</div>
        <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>WinX Pro Admin Console</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>Enter your admin credentials to continue</p>
        {msg && <div style={{ color: '#ff4444', marginBottom: '12px', fontSize: '14px', background: '#ff444422', padding: '10px', borderRadius: '8px' }}>{msg}</div>}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '16px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', fontSize: '16px' }}
            required
          />
          <button type="submit" disabled={loginLoading} className="btn primary" style={{ padding: '14px', fontSize: '16px', fontWeight: 'bold', opacity: loginLoading ? 0.7 : 1 }}>
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '16px', padding: '12px', background: '#00ff8811', borderRadius: '8px', fontSize: '12px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--accent)' }}>Default Credentials</strong><br/>
          Username: <strong>admin</strong> | Password: <strong>Admin@WinX2024</strong>
        </div>
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

  const betsList = allTransactions.filter(t => t.type === 'bet' || t.type === 'win' || t.type === 'payout' || t.type === 'loss')
  const totalBetVolume = betsList.filter(t => t.type === 'bet').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const totalWinVolume = betsList.filter(t => t.type === 'win' || t.type === 'payout').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const netGGR = totalBetVolume - totalWinVolume

  const filteredBets = betsList.filter(t => {
    if (betFilter === 'bet' && t.type !== 'bet') return false
    if ((betFilter === 'win' || betFilter === 'payout') && t.type !== 'win' && t.type !== 'payout') return false
    if (betSearch) {
      const q = betSearch.toLowerCase()
      const matchEmail = (t.email || '').toLowerCase().includes(q)
      const matchUser = (t.user_id || '').toLowerCase().includes(q)
      const matchMethod = (t.method || '').toLowerCase().includes(q)
      const matchNotes = (t.notes || '').toLowerCase().includes(q)
      if (!matchEmail && !matchUser && !matchMethod && !matchNotes) return false
    }
    return true
  })

  return (
    <div className="admin-full-screen" style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', padding: '20px 24px', boxSizing: 'border-box', width: '100%' }}>
      <Head>
        <title>WinX Pro Admin Console</title>
        <style>{`
          html, body {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #05070a !important;
            overflow-x: hidden !important;
          }
          #__next {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .admin-full-screen {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        `}</style>
      </Head>
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        
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
            💳 Payment Accounts & Limits
          </button>
          <button style={tabStyle(activeTab === 'softaggregator')} onClick={() => setActiveTab('softaggregator')}>
            🎰 SoftAggregator (11,200+ Games)
          </button>
          <button style={tabStyle(activeTab === 'bets')} onClick={() => setActiveTab('bets')}>
            🎲 Bet History ({betsList.length})
          </button>
          <button
            style={{
              ...tabStyle(activeTab === 'support'),
              background: activeTab === 'support' ? '#00ff88' : 'rgba(0, 255, 136, 0.12)',
              color: activeTab === 'support' ? '#000' : '#00ff88',
              border: '1.5px solid #00ff88',
              fontWeight: 900
            }}
            onClick={() => setActiveTab('support')}
          >
            💬 24/7 Live Support ({chatThreads.length}) {chatThreads.reduce((acc, t) => acc + (t.unread_admin || 0), 0) > 0 && (
              <span style={{
                background: '#ff0055',
                color: '#fff',
                borderRadius: '999px',
                padding: '2px 7px',
                fontSize: '10px',
                fontWeight: 900,
                marginLeft: '6px'
              }}>
                {chatThreads.reduce((acc, t) => acc + (t.unread_admin || 0), 0)} New
              </span>
            )}
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
                    const tid = tx.reference_id || tx.tid || (tx.tx_id && !tx.tx_id.startsWith('dep_') && !tx.tx_id.startsWith('tx_') ? tx.tx_id : null) || (tx.notes && tx.notes.includes('TID:') ? tx.notes.split('TID:')[1].split('|')[0].trim() : null) || tx.tx_id;
                    const senderNum = tx.sender_number || (tx.notes && tx.notes.includes('Sender:') ? tx.notes.split('Sender:')[1].split('|')[0].trim() : null);
                    const bonusAmt = tx.bonus || (tx.notes && tx.notes.includes('Bonus:') ? tx.notes.split('Bonus:')[1].trim() : null);

                    return (
                      <div key={tx.id || tx.tx_id} style={{ background: 'var(--card)', border: `1px solid ${isCompleted ? '#00ff8844' : isPending ? '#ff990044' : 'var(--border)'}`, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                            <strong style={{ fontSize: '18px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CurrencyFlag size={14} />{parseFloat(tx.amount || 0).toFixed(2)}
                            </strong>
                            <span style={{ fontSize: '13px', color: '#aaa', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                              {tx.target_channel || tx.method || 'Manual P2P'}
                            </span>
                            {bonusAmt && Number(bonusAmt) > 0 && (
                              <span style={{ fontSize: '11px', color: '#ffb300', background: 'rgba(255,179,0,0.15)', border: '1px solid rgba(255,179,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                🎁 +Rs {bonusAmt} Bonus
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '13px', color: '#ccc', marginTop: '8px' }}>
                            <strong>Player:</strong> {tx.email || getEmail(tx.user_id)} {tx.phone ? `(${tx.phone})` : ''}
                          </div>

                          {senderNum && (
                            <div style={{ fontSize: '13px', color: '#fff', marginTop: '4px' }}>
                              <strong>Sender Number / Account:</strong> <span style={{ color: '#00e5ff', fontFamily: 'monospace', fontWeight: 'bold' }}>{senderNum}</span>
                            </div>
                          )}

                          {tid && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '12px', color: '#00ff88', fontFamily: 'monospace', background: 'rgba(0,255,136,0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.2)' }}>
                                <strong>TID / Trx ID:</strong> {tid}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(tid);
                                  setCopiedTid(tx.id || tx.tx_id);
                                  setTimeout(() => setCopiedTid(null), 2000);
                                }}
                                style={{
                                  background: copiedTid === (tx.id || tx.tx_id) ? '#00ff88' : 'rgba(255,255,255,0.12)',
                                  color: copiedTid === (tx.id || tx.tx_id) ? '#000' : '#fff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedTid === (tx.id || tx.tx_id) ? '✅ Copied!' : '📋 Copy TID'}
                              </button>
                            </div>
                          )}

                          {tx.notes && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                              <em>📝 {tx.notes}</em>
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                            📅 {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>

                        {isPending && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'approve')}
                              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #00ff88, #00aa55)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,255,136,0.25)' }}
                            >
                              ✓ Approve & Credit
                            </button>
                            <button
                              onClick={() => handleAction(tx.id || tx.tx_id, 'reject')}
                              style={{ padding: '10px 18px', background: '#331111', color: '#ff6666', border: '1px solid #ff444444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
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
            TAB 7: 💳 PAYMENT ACCOUNTS & LIMITS
            ========================================== */}
        {activeTab === 'rates' && (
          <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--accent)', margin: '0 0 6px', fontSize: '20px' }}>💳 Manual Payment Accounts & Limits</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                Manage your active JazzCash, EasyPaisa, and USDT accounts for manual P2P deposits. All player transfers go directly to your configured numbers.
              </p>
            </div>

            {ratesMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', background: ratesMsg.type === 'error' ? '#ff000022' : '#00ff8822', color: ratesMsg.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${ratesMsg.type === 'error' ? '#ff444444' : '#00ff8844'}` }}>
                {ratesMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. Transaction Limits & System Status */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚙️ System Status & Limits
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                      Minimum Deposit (PKR):
                    </label>
                    <input
                      type="number"
                      value={minDeposit}
                      onChange={e => setMinDeposit(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#00ff88', fontSize: '15px', fontWeight: 'bold' }}
                      min="100"
                      required
                    />
                    <small style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>Default recommended: Rs 200</small>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                      Maximum Deposit (PKR):
                    </label>
                    <input
                      type="number"
                      value={maxDeposit}
                      onChange={e => setMaxDeposit(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '15px' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                      Minimum Withdrawal (PKR):
                    </label>
                    <input
                      type="number"
                      value={minWithdraw}
                      onChange={e => setMinWithdraw(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#ffb300', fontSize: '15px', fontWeight: 'bold' }}
                      min="100"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                      Maximum Withdrawal (PKR):
                    </label>
                    <input
                      type="number"
                      value={maxWithdraw}
                      onChange={e => setMaxWithdraw(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '15px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. JazzCash Receiving Accounts */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(235, 28, 45, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: '#EB1C2D', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>JAZZCASH</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>JazzCash Receiving Accounts</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Account 1 */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff88', marginBottom: '10px' }}>Primary Account (JazzCash 1)</div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Account Title / Name:</label>
                      <input
                        type="text"
                        value={manualJazzcashTitle}
                        onChange={e => setManualJazzcashTitle(e.target.value)}
                        placeholder="e.g. Muhammad Ahmad"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Mobile / Account Number:</label>
                      <input
                        type="text"
                        value={manualJazzcashNo}
                        onChange={e => setManualJazzcashNo(e.target.value)}
                        placeholder="e.g. 03001234567"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#00e5ff', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>

                  {/* Account 2 */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>Secondary Account (JazzCash 2)</div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Account Title / Name:</label>
                      <input
                        type="text"
                        value={manualJazzcash2Title}
                        onChange={e => setManualJazzcash2Title(e.target.value)}
                        placeholder="e.g. Second Receiver Title"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Mobile / Account Number:</label>
                      <input
                        type="text"
                        value={manualJazzcash2No}
                        onChange={e => setManualJazzcash2No(e.target.value)}
                        placeholder="e.g. 03011234567"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#00e5ff', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. EasyPaisa Receiving Accounts */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 168, 89, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: '#00A859', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>EASYPAISA</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>EasyPaisa Receiving Accounts</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Account 1 */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff88', marginBottom: '10px' }}>Primary Account (EasyPaisa 1)</div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Account Title / Name:</label>
                      <input
                        type="text"
                        value={manualEasypaisaTitle}
                        onChange={e => setManualEasypaisaTitle(e.target.value)}
                        placeholder="e.g. Muhammad Ahmad"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Mobile / Account Number:</label>
                      <input
                        type="text"
                        value={manualEasypaisaNo}
                        onChange={e => setManualEasypaisaNo(e.target.value)}
                        placeholder="e.g. 03451234567"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#00e5ff', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>

                  {/* Account 2 */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>Secondary Account (EasyPaisa 2)</div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Account Title / Name:</label>
                      <input
                        type="text"
                        value={manualEasypaisa2Title}
                        onChange={e => setManualEasypaisa2Title(e.target.value)}
                        placeholder="e.g. Second Receiver Title"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Mobile / Account Number:</label>
                      <input
                        type="text"
                        value={manualEasypaisa2No}
                        onChange={e => setManualEasypaisa2No(e.target.value)}
                        placeholder="e.g. 03461234567"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#111', color: '#00e5ff', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Crypto USDT (TRC-20) */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(38, 161, 123, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: '#26A17B', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>USDT TRC20</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Crypto Receiving Address</h3>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    USDT TRC-20 Wallet Address:
                  </label>
                  <input
                    type="text"
                    value={manualCryptoAddress}
                    onChange={e => setManualCryptoAddress(e.target.value)}
                    placeholder="e.g. TYDzsxdczQD1R9W1zZpYr... (TRC-20)"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#00ff88', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* 5. Deposit Instructions Notice */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: 'var(--accent)' }}>📢 Deposit Instructions Notice</h3>
                <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '12px' }}>
                  This message is displayed directly on the user deposit screen to instruct players.
                </p>
                <textarea
                  value={depositInstructions}
                  onChange={e => setDepositInstructions(e.target.value)}
                  placeholder="e.g. Please transfer exact amount to our active JazzCash/EasyPaisa number. After payment, enter your 11-digit Sender Number and Transaction ID (TID) from the SMS to verify instantly."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '13px', lineHeight: '1.5', resize: 'vertical' }}
                />
              </div>

              {/* 6. Fallback DirectPay Landing Page API Credentials */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#888' }}>⚡ DirectPay Landing Page API (Optional Fallback)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>DirectPay Client ID:</label>
                    <input
                      type="text"
                      value={directpayClientId}
                      onChange={e => setDirectpayClientId(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>DirectPay Client Secret:</label>
                    <input
                      type="text"
                      value={directpayClientSecret}
                      onChange={e => setDirectpayClientSecret(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={ratesLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #00ff88, #00bb66)',
                  color: '#000',
                  fontWeight: '900',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,255,136,0.3)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {ratesLoading ? 'Saving Settings...' : '💾 Save All Payment Accounts & Rules'}
              </button>
            </form>
          </div>
        )}

        {/* ==========================================
            TAB 8: 🎰 SOFTAGGREGATOR (11,200+ GAMES & SEAMLESS CALLBACK)
            ========================================== */}
        {activeTab === 'softaggregator' && (
          <div style={{ background: '#0a101a', border: '1px solid rgba(0, 255, 136, 0.25)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#00ff88', fontWeight: 900 }}>
                  🎰 SoftAggregator 11,200+ Games &amp; Seamless Wallet
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Live API for Pragmatic Play, JILI, PG Soft, Spribe Aviator, Hacksaw, Nolimit • Real-time PKR wallet sync via <code>/sg/callback</code>
                </p>
              </div>
              <span style={{ background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid #00ff88', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
                11,200+ GAMES ACTIVE
              </span>
            </div>

            {/* Credentials & Setup Instructions Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Step 1: Wallet Callback URL */}
              <div style={{ background: '#050a12', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                  1. Your Wallet Callback URL
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '6px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  https://winxpro.com.pk/sg/callback
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 12px', lineHeight: 1.4 }}>
                  In your SoftAggregator portal (<code>softaggregator.com/backend/</code>), paste this exact URL into the <strong>Your wallet callback URL</strong> field and click Save.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/softaggregator/callback?action=balance&username=admin_tester&currency=PKR')
                      const data = await res.json()
                      setSgCallbackCheck(data)
                    } catch (e) {
                      setSgCallbackCheck({ error: 2, message: e.message })
                    }
                  }}
                  style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}
                >
                  ⚡ Test /sg/callback Diagnostics
                </button>
                {sgCallbackCheck && (
                  <pre style={{ marginTop: '10px', background: '#000', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#38bdf8', overflowX: 'auto' }}>
                    {JSON.stringify(sgCallbackCheck, null, 2)}
                  </pre>
                )}
              </div>

              {/* Step 2: Account API Credentials */}
              <div style={{ background: '#050a12', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase' }}>
                  2. Active API Credentials (WinXPro)
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                  Connected &amp; Verified in <code>.env.local</code>:
                </div>
                <div style={{ background: '#000', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace', margin: '8px 0', lineHeight: 1.5 }}>
                  API_LOGIN: 88006ae8-42e8-49ee-b657-278536dd288b<br />
                  CURRENCY: PKR (Account Default)<br />
                  TEST CREDIT: 2.00 USDT Loaded
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Portal: <a href="https://softaggregator.com/backend/" target="_blank" rel="noreferrer" style={{ color: '#00ff88', textDecoration: 'underline' }}>softaggregator.com/backend/</a>
                </p>
              </div>
            </div>

            {/* Live Interactive Game Launch Tester */}
            <div style={{ background: '#050a12', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎮</span>
                <span>Live SoftAggregator Game Tester</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    SELECT GAME TO LAUNCH
                  </label>
                  <select
                    value={sgTestGameId}
                    onChange={e => setSgTestGameId(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="xddb07a7a584679c">Gates of Olympus (Pragmatic Play)</option>
                    <option value="x979f934a2e9d3d0">Sweet Bonanza (Pragmatic Play)</option>
                    <option value="x887bde40b16350c">Aviator (Spribe)</option>
                    <option value="xbadfee046056d52">Mines (Spribe)</option>
                    <option value="xdfa97ffede36309">Plinko (Spribe)</option>
                    <option value="x7a97d5c967c6e9c">Crazy FaFaFa (JILI)</option>
                    <option value="x073af651805f030">superRich (JILI)</option>
                    <option value="xcaf917bb33330ad">Fortune Tree (JILI)</option>
                    <option value="x0677695eabcfb08">Fortune Tiger (PG Soft)</option>
                    <option value="x252cc9f28ea457d">Fortune Rabbit (PG Soft)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={sgTesting}
                onClick={async () => {
                  setSgTesting(true)
                  setSgLaunchResult(null)
                  try {
                    const res = await fetch('/api/softaggregator/launch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        gameid: sgTestGameId,
                        user_id: 'admin_test',
                        email: 'admin@winxpro.com.pk',
                        device: 'mobile'
                      })
                    })
                    const data = await res.json()
                    setSgLaunchResult(data)
                  } catch (e) {
                    setSgLaunchResult({ success: false, error: e.message })
                  } finally {
                    setSgTesting(false)
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00bb66)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {sgTesting ? 'Connecting SoftAggregator...' : '🚀 Test Launch Game via SoftAggregator'}
              </button>

              {sgLaunchResult && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: sgLaunchResult.success ? '#00ff88' : '#f43f5e', marginBottom: '8px' }}>
                    Status: {sgLaunchResult.success ? 'LAUNCH SUCCESS' : (sgLaunchResult.error || 'FAILED')}
                  </div>
                  {sgLaunchResult.launch_url ? (
                    <div>
                      <a href={sgLaunchResult.launch_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '12px', textDecoration: 'underline', display: 'block', marginBottom: '12px' }}>
                        🔗 Open Live Session URL ({sgLaunchResult.launch_url.slice(0, 60)}...)
                      </a>
                      <iframe
                        src={sgLaunchResult.launch_url}
                        style={{ width: '100%', height: '500px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', background: '#000' }}
                        title="SoftAggregator Live Game Preview"
                      />
                    </div>
                  ) : (
                    <pre style={{ background: '#000', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#ff7788', overflowX: 'auto' }}>
                      {JSON.stringify(sgLaunchResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 9: 💬 24/7 LIVE SUPPORT CHAT DESK
            ========================================== */}
        {/* ==========================================
            TAB: 🎲 BET HISTORY (BETS, WINS & LOSSES)
            ========================================== */}
        {activeTab === 'bets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bet History Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL WAGERS (BETS PLACED)</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
                  {betsList.filter(t => t.type === 'bet').length} bets
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Total: <strong style={{ color: '#fff' }}>Rs {totalBetVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL WIN PAYOUTS</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', marginTop: '6px' }}>
                  {betsList.filter(t => t.type === 'win' || t.type === 'payout').length} wins
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Paid Out: <strong style={{ color: '#fff' }}>Rs {totalWinVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>NET HOUSE REVENUE (GGR)</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: netGGR >= 0 ? '#00ff88' : '#ff4444', marginTop: '6px' }}>
                  Rs {netGGR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  House Hold: <strong style={{ color: '#fff' }}>{totalBetVolume > 0 ? ((netGGR / totalBetVolume) * 100).toFixed(1) : 0}%</strong>
                </div>
              </div>

              <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>SUPABASE DATABASE SYNC</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#00ff88', marginTop: '8px' }}>
                  🟢 Connected &amp; Persistent
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Real-time ledger updates
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--card)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBetFilter('all')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: betFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: betFilter === 'all' ? '#000' : '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  All ({betsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBetFilter('bet')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: betFilter === 'bet' ? '#38bdf8' : 'transparent',
                    color: betFilter === 'bet' ? '#000' : '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Bets Only ({betsList.filter(t => t.type === 'bet').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBetFilter('win')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: betFilter === 'win' ? '#00ff88' : 'transparent',
                    color: betFilter === 'win' ? '#000' : '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Wins &amp; Payouts ({betsList.filter(t => t.type === 'win' || t.type === 'payout').length})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search by email, game, or user ID..."
                value={betSearch}
                onChange={e => setBetSearch(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '13px',
                  minWidth: '280px'
                }}
              />
            </div>

            {/* Bet History Table */}
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Time</th>
                    <th style={{ padding: '12px 16px' }}>User / Account</th>
                    <th style={{ padding: '12px 16px' }}>Game / Activity</th>
                    <th style={{ padding: '12px 16px' }}>Type</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Details / Round</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        No bet records found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBets.map((t, idx) => {
                      const isWin = t.type === 'win' || t.type === 'payout'
                      return (
                        <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {t.created_at ? new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#fff' }}>
                            <div>{t.email || t.user_id}</div>
                            {t.email && t.user_id && <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{t.user_id}</div>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>
                            {t.method || t.game_id || 'Casino Game'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 900,
                              background: isWin ? 'rgba(0, 255, 136, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: isWin ? '#00ff88' : '#38bdf8',
                              border: `1px solid ${isWin ? 'rgba(0, 255, 136, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                            }}>
                              {isWin ? '🏆 WIN' : '🎯 BET'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: '14px', color: isWin ? '#00ff88' : '#f87171' }}>
                            {isWin ? '+' : '-'}Rs {parseFloat(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ color: '#00ff88', fontSize: '11px', fontWeight: 800 }}>✓ Completed</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.notes || t.description || (t.tx_id ? `TX: ${t.tx_id}` : '—')}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>ACTIVE CONVERSATIONS</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#00ff88', marginTop: '4px' }}>
                  {chatThreads.length}
                </div>
              </div>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>UNREAD MESSAGES</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ff3366', marginTop: '4px' }}>
                  {chatThreads.reduce((acc, t) => acc + (t.unread_admin || 0), 0)}
                </div>
              </div>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>AGENT STATUS</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
                  🟢 Live (24/7 Connected)
                </div>
              </div>
            </div>

            {/* Chat Workspace */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 340px) 1fr',
              gap: '16px',
              minHeight: '620px',
              background: '#0a1017',
              borderRadius: '16px',
              border: '1px solid rgba(0, 255, 136, 0.25)',
              overflow: 'hidden'
            }}>
              {/* Left Column: Conversations List */}
              <div style={{
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                background: '#0d151f'
              }}>
                <div style={{ padding: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    User Support Inbox
                  </div>
                  <input
                    type="text"
                    placeholder="Search by user email or ID..."
                    value={chatSearch}
                    onChange={e => setChatSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#070b12',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {chatThreads.filter(t => !chatSearch || (t.user_key && t.user_key.toLowerCase().includes(chatSearch.toLowerCase()))).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No support conversations yet.
                    </div>
                  ) : (
                    chatThreads
                      .filter(t => !chatSearch || (t.user_key && t.user_key.toLowerCase().includes(chatSearch.toLowerCase())))
                      .map(t => {
                        const isSelected = selectedChatUser === t.user_key
                        return (
                          <div
                            key={t.user_key}
                            onClick={() => {
                              setSelectedChatUser(t.user_key)
                              fetchActiveThreadMessages(t.user_key)
                            }}
                            style={{
                              padding: '12px 14px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              background: isSelected ? 'rgba(0, 255, 136, 0.12)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #00ff88' : '3px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'background 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 800, color: isSelected ? '#00ff88' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                👤 {t.email || t.user_key}
                              </span>
                              {t.unread_admin > 0 && (
                                <span style={{
                                  background: '#ff0055',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  borderRadius: '999px',
                                  padding: '1px 6px'
                                }}>
                                  {t.unread_admin}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.last_message?.text || 'No message text'}
                            </div>

                            <div style={{ fontSize: '9.5px', color: '#556677' }}>
                              {t.last_message?.time || new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>

              {/* Right Column: Chat Stream & Message Composer */}
              <div style={{ display: 'flex', flexDirection: 'column', background: '#070c14' }}>
                {selectedChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#0d1520'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💬 Chat with</span>
                          <span style={{ color: '#00ff88' }}>{selectedChatUser}</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px' }}>
                          ● Active Session • Synced with Client Live App
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchActiveThreadMessages(selectedChatUser)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: '#00ff88',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Refresh Chat
                      </button>
                    </div>

                    {/* Chat Messages Stream */}
                    <div style={{
                      flex: 1,
                      padding: '16px',
                      overflowY: 'auto',
                      minHeight: '460px',
                      maxHeight: '580px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      background: '#050910'
                    }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '12px' }}>
                          No messages in this conversation yet.
                        </div>
                      ) : (
                        chatMessages.map(m => {
                          const isUser = m.sender === 'user'
                          return (
                            <div
                              key={m.id}
                              style={{
                                maxWidth: '78%',
                                alignSelf: isUser ? 'flex-start' : 'flex-end',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px'
                              }}
                            >
                              <div style={{ fontSize: '10px', color: isUser ? '#38bdf8' : '#00ff88', fontWeight: 800, padding: '0 4px' }}>
                                {isUser ? `👤 User (${selectedChatUser})` : `🛡️ ${m.admin_name || 'Admin Support'}`}
                              </div>

                              <div style={{
                                padding: '10px 14px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                lineHeight: '1.4',
                                background: isUser ? '#162332' : 'linear-gradient(135deg, #00ff88 0%, #00bb66 100%)',
                                color: isUser ? '#ffffff' : '#000000',
                                fontWeight: isUser ? 500 : 700,
                                border: isUser ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                              }}>
                                {m.text && <div>{m.text}</div>}

                                {/* Image Attachment (Clickable) */}
                                {(m.image || m.imageUrl) && (
                                  <div style={{ marginTop: m.text ? '8px' : 0 }}>
                                    <a href={m.image || m.imageUrl} target="_blank" rel="noreferrer">
                                      <img
                                        src={m.image || m.imageUrl}
                                        alt="Screenshot"
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block', border: '1px solid rgba(0,0,0,0.2)' }}
                                      />
                                    </a>
                                  </div>
                                )}

                                {/* Voice Note Audio Player */}
                                {(m.audio || m.audioUrl) && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', marginTop: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>🎙</span>
                                    <audio controls src={m.audio || m.audioUrl} style={{ width: '200px', height: '32px' }} />
                                  </div>
                                )}
                              </div>

                              <div style={{ fontSize: '9.5px', color: '#556677', alignSelf: isUser ? 'flex-start' : 'flex-end', padding: '0 4px' }}>
                                {m.time}
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={adminChatEndRef} />
                    </div>

                    {/* Quick Reply Chips */}
                    <div style={{
                      padding: '8px 14px',
                      background: '#09111c',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto'
                    }}>
                      {[
                        'Please provide your 11-digit TID from your receipt.',
                        '✅ Your deposit has been verified and added to balance.',
                        '🏧 Your withdrawal request has been approved and dispatched.',
                        '👋 Assalam-o-Alaikum! How can we assist you with WinX Pro today?'
                      ].map((quick, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendAdminReply(null, quick)}
                          style={{
                            background: 'rgba(0, 255, 136, 0.08)',
                            border: '1px solid rgba(0, 255, 136, 0.25)',
                            color: '#00ff88',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          {quick.slice(0, 32)}...
                        </button>
                      ))}
                    </div>

                    {/* Admin Image Attachment Preview */}
                    {adminReplyImage && (
                      <div style={{
                        padding: '6px 14px',
                        background: '#071018',
                        borderTop: '1px solid rgba(0, 255, 136, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={adminReplyImage} alt="Attachment" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>Image ready to send</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdminReplyImage(null)}
                          style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '14px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Message Composer */}
                    <form onSubmit={handleSendAdminReply} style={{
                      padding: '12px 14px',
                      background: '#0d1520',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      <label style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) setAdminReplyImage(ev.target.result);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <span style={{ fontSize: '16px' }}>📷</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Type response to user..."
                        value={adminReplyText}
                        onChange={e => setAdminReplyText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#070b12',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />

                      <button
                        type="submit"
                        disabled={adminReplyLoading}
                        style={{
                          background: 'linear-gradient(135deg, #00ff88, #00bb66)',
                          color: '#000',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '13px',
                          cursor: adminReplyLoading ? 'not-allowed' : 'pointer',
                          opacity: adminReplyLoading ? 0.7 : 1
                        }}
                      >
                        {adminReplyLoading ? 'Sending...' : 'Send Reply'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                    Select a conversation from the left to view messages and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
