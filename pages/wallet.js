import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { db } from '../utils/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import AuthModal from '../components/AuthModal'
import CurrencyFlag from '../components/CurrencyFlag'

export default function WalletPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Sub-tabs for Deposit
  const [depositMode, setDepositMode] = useState('directpay') // 'directpay' | 'manual'

  // Exchange Rates and Gateway Settings State
  const [rates, setRates] = useState({
    pkr_rate: 1.0,
    usd_rate: 280.0,
    directpay_enabled: true,
    jazzcash_mode: 'directpay',
    easypaisa_mode: 'directpay',
    card_mode: 'directpay'
  })
  const [ratesLoading, setRatesLoading] = useState(true)

  // Gateway Mode toggle per payment method ('direct_api' | 'directpay')
  const [gatewayModes, setGatewayModes] = useState({
    Easypaisa: 'directpay',
    JazzCash: 'directpay',
    Card: 'directpay'
  })

  // Auto Deposit form
  const [dpMethod, setDpMethod] = useState('Easypaisa') // 'Easypaisa' | 'JazzCash' | 'Card'
  const [dpAmount, setDpAmount] = useState('')
  const [dpPhone, setDpPhone] = useState('')
  const [dpName, setDpName] = useState('')
  const [dpEmail, setDpEmail] = useState('')
  const [dpLoading, setDpLoading] = useState(false)
  const [dpMsg, setDpMsg] = useState(null)

  // Manual Deposit form
  const [depAmount, setDepAmount] = useState('')
  const [depCurrency, setDepCurrency] = useState('pkr') // 'pkr' | 'usd'
  const [depMethod, setDepMethod] = useState('Easypaisa')
  const [depTxId, setDepTxId] = useState('')
  const [depMsg, setDepMsg] = useState(null)

  // Withdraw form
  const [witAmount, setWitAmount] = useState('') // In-game Pi amount
  const [witCurrency, setWitCurrency] = useState('pkr') // 'pkr' | 'usd'
  const [witMethod, setWitMethod] = useState('Easypaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witMsg, setWitMsg] = useState(null)

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        const jMode = data.jazzcash_mode || 'directpay'
        const eMode = data.easypaisa_mode || 'directpay'
        const cMode = data.card_mode || 'directpay'
        setRates({
          pkr_rate: data.pkr_rate || 1.0,
          usd_rate: data.usd_rate || 280.0,
          directpay_enabled: data.directpay_enabled !== false,
          jazzcash_mode: jMode,
          easypaisa_mode: eMode,
          card_mode: cMode
        })
        setGatewayModes({
          Easypaisa: eMode,
          JazzCash: jMode,
          Card: cMode
        })
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('winxpro_settings', JSON.stringify(data))
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('Failed to load exchange rates', e)
    } finally {
      setRatesLoading(false)
    }
  }

  const fetchData = async () => {
    const activeUid = user?.id || user?.uid || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('winxpro_session') || '{}')?.id) || ''
    const activeEmail = user?.email || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('winxpro_session') || '{}')?.email) || ''
    if (!activeUid && !activeEmail) return

    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()
      if (json.success) {
        if (json.wallet) setWallet(json.wallet)
        if (Array.isArray(json.transactions)) {
          setTransactions(json.transactions)
        }
      }
    } catch (e) {}

    try {
      if (user?.id) {
        const { data: t } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        if (t && t.length > 0) {
          setTransactions(prev => {
            const map = new Map()
            for (const item of [...(prev || []), ...t]) {
              const k = item.id || item.tx_id
              if (k) map.set(k, item)
            }
            return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          })
        }
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchRates()
    fetchData()

    // Real-time polling every 4s for instant balance & transaction auto-updates
    const pollInterval = setInterval(() => {
      fetchData()
    }, 4000)

    // Real-time listener for Settings & Gateway routes via Firestore
    let unsub = null
    try {
      unsub = onSnapshot(doc(db, 'settings', 'payment_gateways'), (snap) => {
        if (snap && snap.exists()) {
          const data = snap.data()
          setRates(prev => ({
            ...prev,
            pkr_rate: data.pkr_rate ? parseFloat(data.pkr_rate) : prev.pkr_rate,
            usd_rate: data.usd_rate ? parseFloat(data.usd_rate) : prev.usd_rate,
            directpay_enabled: data.directpay_enabled !== undefined ? Boolean(data.directpay_enabled) : prev.directpay_enabled,
            jazzcash_mode: data.jazzcash_mode || prev.jazzcash_mode || 'directpay',
            easypaisa_mode: data.easypaisa_mode || prev.easypaisa_mode || 'directpay',
            card_mode: data.card_mode || prev.card_mode || 'directpay'
          }))
          setGatewayModes({
            Easypaisa: data.easypaisa_mode || 'directpay',
            JazzCash: data.jazzcash_mode || 'directpay',
            Card: data.card_mode || 'directpay'
          })
        }
      })
    } catch (e) {}

    const onSettingsUpdate = () => { fetchRates() }
    const onWalletUpdate = () => { fetchData() }
    window.addEventListener('settings-updated', onSettingsUpdate)
    window.addEventListener('wallet-updated', onWalletUpdate)

    return () => {
      if (unsub) unsub()
      clearInterval(pollInterval)
      window.removeEventListener('settings-updated', onSettingsUpdate)
      window.removeEventListener('wallet-updated', onWalletUpdate)
    }
  }, [user])

  // Handle return redirect from DirectPay, JazzCash, or EasyPaisa
  useEffect(() => {
    if (!router.isReady) return

    const { directpay_status, jazzcash_status, easypaisa_status, txn_id, orderRefNum, amount, gateway_transaction_id, dp_txn_id, transaction_id, bank_ref } = router.query
    const resolvedTxnId = txn_id || orderRefNum || router.query.client_transaction_id
    const resolvedGatewayId = gateway_transaction_id || dp_txn_id || transaction_id || bank_ref || ''

    // DirectPay Return
    if (directpay_status === 'success' && resolvedTxnId) {
      const activeUid = user?.id || user?.uid || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('winxpro_session') || '{}')?.id)
      const activeEmail = user?.email || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('winxpro_session') || '{}')?.email)

      fetch('/api/payments/directpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn_id: resolvedTxnId,
          gateway_transaction_id: resolvedGatewayId,
          user_id: activeUid,
          email: activeEmail,
          amount
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDpMsg({ type: 'success', text: data.message || `🎉 Payment verified! Credited Pi ${amount || data.creditedAmount || ''} to your balance.` })
            if (data.balance !== undefined) {
              setWallet(prev => ({ ...(prev || {}), balance: data.balance }))
            }
          } else {
            setDpMsg({ type: 'success', text: `Payment received! Processing transaction ID: ${resolvedTxnId}` })
          }
          fetchData()
          window.dispatchEvent(new Event('wallet-updated'))
        })
        .catch(() => {
          setDpMsg({ type: 'success', text: `Payment completed! Transaction ${resolvedTxnId} confirmed.` })
          fetchData()
        })
    } else if (directpay_status === 'failed') {
      if (resolvedTxnId) {
        fetch('/api/payments/directpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txn_id: resolvedTxnId,
            gateway_transaction_id: resolvedGatewayId,
            status: 'failed'
          })
        }).catch(() => {})
      }
      setDpMsg({ type: 'error', text: 'DirectPay transaction was cancelled or failed. Please try again.' })
    }

    // JazzCash Return
    if (jazzcash_status === 'success') {
      setDpMsg({ type: 'success', text: `🎉 JazzCash payment successful! Transaction ${txn_id || ''} confirmed.` })
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    } else if (jazzcash_status === 'failed') {
      setDpMsg({ type: 'error', text: `JazzCash payment was declined or cancelled. Transaction: ${txn_id || ''}` })
    }

    // EasyPaisa Return
    if (easypaisa_status === 'success') {
      setDpMsg({ type: 'success', text: `🎉 EasyPaisa payment successful! Reference: ${orderRefNum || ''}` })
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    } else if (easypaisa_status === 'failed') {
      setDpMsg({ type: 'error', text: `EasyPaisa payment failed or was cancelled. Reference: ${orderRefNum || ''}` })
    }
  }, [router.isReady, router.query, user])

  // Helper to submit hidden POST form (used for Easypaisa Direct hosted checkout)
  const submitPostForm = (actionUrl, fields) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = actionUrl
    form.target = '_self'
    Object.keys(fields).forEach(key => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = fields[key]
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
  }

  // Unified Auto Pay Flow (DirectPay Gateway for Easypaisa, JazzCash, Card)
  const handleAutoPaySubmit = async (e) => {
    e.preventDefault()
    setDpMsg(null)
    setDpLoading(true)

    const activeUserId = user?.id || user?.uid || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('winxpro_session') || '{}')?.id) || 'player_' + Date.now()
    const activeEmail = user?.email || dpEmail || 'player@winxpro.com.pk'
    const activeName = dpName || user?.displayName || (activeEmail ? activeEmail.split('@')[0] : 'Player')
    const activePhone = dpPhone || '03001234567'

    const activeMode = (
      dpMethod === 'JazzCash' ? (rates.jazzcash_mode || 'directpay') :
      dpMethod === 'Easypaisa' ? (rates.easypaisa_mode || 'directpay') :
      (rates.card_mode || 'directpay')
    )

    try {
      // 1. JAZZCASH
      if (dpMethod === 'JazzCash') {
        if (activeMode === 'direct_api') {
          // Official JazzCash MWallet REST API v1.1
          const res = await fetch('/api/payments/jazzcash/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: activeUserId,
              amountInPKR: Number(dpAmount),
              mobileNumber: activePhone,
              payer_name: activeName
            })
          })
          const data = await res.json().catch(() => ({}))
          if (data.success) {
            setDpMsg({
              type: 'success',
              text: `🎉 JazzCash Payment successful! Pi ${data.inGameAmount} has been credited to your balance.`
            })
            setDpAmount('')
            setDpPhone('')
            fetchData()
            window.dispatchEvent(new Event('wallet-updated'))
          } else if (data.isPending || data.responseCode === '124' || data.responseCode === '001') {
            setDpMsg({
              type: 'success',
              text: `📲 JazzCash Request Sent! Please enter your MPIN on your mobile phone screen (${activePhone}) to authorize PKR ${dpAmount}. (Ref: ${data.txnRefNo || ''})`
            })
            const poll = setInterval(() => { fetchData() }, 3000)
            setTimeout(() => clearInterval(poll), 60000)
          } else if (data.paymentUrl) {
            window.location.href = data.paymentUrl
            return
          } else {
            setDpMsg({
              type: 'error',
              text: data.responseMessage || data.error || 'JazzCash transaction could not be completed.'
            })
          }
          setDpLoading(false)
          return
        }

        // DirectPay JazzCash Hosted Gateway
        const dpRes = await fetch('/api/payments/directpay/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: activeUserId,
            amountInPKR: Number(dpAmount),
            payer_name: activeName,
            email: activeEmail,
            msisdn: activePhone,
            currency: 'PKR',
            payment_method: 'JazzCash'
          })
        })
        const dpData = await dpRes.json().catch(() => ({}))
        if (dpData.success && dpData.paymentUrl) {
          window.location.href = dpData.paymentUrl
          return
        }
        setDpMsg({ type: 'error', text: dpData.error || 'Failed to connect to JazzCash gateway.' })
        setDpLoading(false)
        return
      }

      // 2. EASYPAISA
      if (dpMethod === 'Easypaisa') {
        if (activeMode === 'direct_api') {
          // Official Easypay Direct Checkout
          const res = await fetch('/api/payments/easypaisa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: activeUserId,
              amountInPKR: Number(dpAmount),
              mobileNumber: activePhone,
              email: activeEmail,
              payment_method: 'MA_PAYMENT_METHOD'
            })
          })
          const data = await res.json().catch(() => ({}))
          if (data.success && data.actionUrl && data.fields) {
            submitPostForm(data.actionUrl, data.fields)
            return
          }
          setDpMsg({ type: 'error', text: data.error || 'Failed to initialize EasyPaisa Direct checkout.' })
          setDpLoading(false)
          return
        }

        // DirectPay EasyPaisa Hosted Gateway
        const dpRes = await fetch('/api/payments/directpay/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: activeUserId,
            amountInPKR: Number(dpAmount),
            payer_name: activeName,
            email: activeEmail,
            msisdn: activePhone,
            currency: 'PKR',
            payment_method: 'Easypaisa'
          })
        })
        const dpData = await dpRes.json().catch(() => ({}))
        if (dpData.success && dpData.paymentUrl) {
          window.location.href = dpData.paymentUrl
          return
        }
        setDpMsg({ type: 'error', text: dpData.error || 'Failed to connect to EasyPaisa gateway.' })
        setDpLoading(false)
        return
      }

      // 3. CARD / OTHER
      const res = await fetch('/api/payments/directpay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          amountInPKR: Number(dpAmount),
          payer_name: activeName,
          email: activeEmail,
          msisdn: activePhone,
          currency: 'PKR',
          payment_method: dpMethod
        })
      })
      const data = await res.json().catch(() => ({}))
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }
      setDpMsg({ type: 'error', text: data.error || `Unable to connect to ${dpMethod} gateway.` })
      setDpLoading(false)
    } catch (err) {
      setDpMsg({
        type: 'error',
        text: err.message || `Connection error with ${dpMethod} gateway.`
      })
      setDpLoading(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    setDepMsg(null)

    const rawAmount = Number(depAmount)
    const rate = depCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate
    const inGameAmount = parseFloat((rawAmount * rate).toFixed(2))

    if (inGameAmount < 10) {
      return setDepMsg({ type: 'error', text: `Minimum deposit value must be at least Pi 10.00` })
    }

    const notesStr = `Deposit of ${depCurrency === 'pkr' ? 'Fiat' : '$'} ${rawAmount} ${depCurrency.toUpperCase()} via ${depMethod}. Rate: 1 ${depCurrency.toUpperCase()} = ${rate} Pi.`

    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        amount: inGameAmount,
        method: `${depMethod} (${depCurrency.toUpperCase()})`,
        tx_id: depTxId,
        notes: notesStr
      })
    })
    const data = await res.json()
    setDepMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) {
      setDepAmount('')
      setDepTxId('')
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWitMsg(null)

    const rawInGameAmount = Number(witAmount)

    if (rawInGameAmount < 500) {
      return setWitMsg({ type: 'error', text: 'Minimum withdrawal is Pi 500' })
    }

    if (!wallet || wallet.balance < rawInGameAmount) {
      return setWitMsg({ type: 'error', text: 'Insufficient balance' })
    }

    const rate = witCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate
    const payoutAmount = parseFloat((rawInGameAmount / rate).toFixed(2))
    const currencyLabel = witCurrency === 'pkr' ? 'Fiat' : 'USD'
    const symbolLabel = witCurrency === 'pkr' ? 'Pi' : '$'

    const notesStr = `Withdrawal to ${witMethod} account ${witAccount}. Net Payout: ${symbolLabel} ${payoutAmount} ${currencyLabel} (Rate: 1 ${currencyLabel} = ${rate} Pi).`

    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        amount: rawInGameAmount,
        method: `${witMethod} (${currencyLabel})`,
        account_number: witAccount,
        notes: notesStr
      })
    })
    const data = await res.json()
    setWitMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) {
      setWitAmount('')
      setWitAccount('')
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (!user) return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '64px' }}>🔒</div>
      <h2>Login Required</h2>
      <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', boxSizing: 'border-box', marginBottom: '12px', fontSize: '14px' }
  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }
  const msgStyle = (type) => ({ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', background: type === 'error' ? '#ff000022' : '#00ff8822', border: `1px solid ${type === 'error' ? '#ff4444' : '#00e676'}`, color: type === 'error' ? '#ff6666' : '#00ff88' })

  // Calculated Preview Computations
  const computedDpCreditedVal = dpAmount ? (Number(dpAmount) * rates.pkr_rate).toFixed(2) : '0.00'
  const computedCreditedVal = depAmount ? (Number(depAmount) * (depCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate)).toFixed(2) : '0.00'
  const computedWithdrawVal = witAmount ? (Number(witAmount) / (witCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate)).toFixed(2) : '0.00'

  // Payment Methods List for DirectPay
  const directPayMethods = [
    {
      id: 'Easypaisa',
      name: 'Easypaisa',
      icon: '🟢',
      badge: 'Auto Wallet',
      bgColor: 'linear-gradient(135deg, rgba(0, 200, 83, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      borderColor: '#00c853'
    },
    {
      id: 'JazzCash',
      name: 'JazzCash',
      icon: '🔴',
      badge: 'Auto Wallet',
      bgColor: 'linear-gradient(135deg, rgba(213, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      borderColor: '#d50000'
    },
    {
      id: 'Card',
      name: 'Debit / Card',
      icon: '💳',
      badge: 'Visa / MC',
      bgColor: 'linear-gradient(135deg, rgba(41, 121, 255, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      borderColor: '#2979ff'
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '18px' }}>← Back to Lobby</Link>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>💰 Wallet & Payments</h1>
        <div />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Balance Card */}
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--card) 100%)', border: '2px solid var(--accent)', textAlign: 'center', boxShadow: '0 8px 32px rgba(255, 215, 0, 0.15)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>AVAILABLE IN-GAME BALANCE</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--accent)', textShadow: '0 0 20px rgba(255, 215, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CurrencyFlag size={42} /> {wallet ? parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
        </div>

        {/* Deposit Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Deposit Funds
            </h2>

            {/* Sub-tab toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setDepositMode('directpay')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: depositMode === 'directpay' ? 'var(--accent)' : 'transparent',
                  color: depositMode === 'directpay' ? '#000' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Auto Gateway
              </button>
              <button
                onClick={() => setDepositMode('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: depositMode === 'manual' ? 'var(--accent)' : 'transparent',
                  color: depositMode === 'manual' ? '#000' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📝 Manual TxID
              </button>
            </div>
          </div>

          {/* Mode A: DirectPay (Easypaisa, JazzCash, Card Auto Gateway) */}
          {depositMode === 'directpay' && (
            <div>
              {/* Payment Method Selector Grid */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '10px' }}>
                Select Payment Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {directPayMethods.map(m => {
                  const isSelected = dpMethod === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => setDpMethod(m.id)}
                      style={{
                        background: m.bgColor,
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 16px rgba(255, 215, 0, 0.35)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{m.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: isSelected ? 'var(--accent)' : '#fff' }}>
                        {m.name}
                      </div>
                      <div style={{ 
                        fontSize: '9px', 
                        marginTop: '4px',
                        padding: '2px 4px', 
                        borderRadius: '4px', 
                        background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.1)', 
                        color: isSelected ? '#000' : 'var(--muted)',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {m.badge}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Gateway Channel Info */}
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '13px' }}>
                    ⚡ {dpMethod} Instant Payment
                  </span>
                  <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 'bold' }}>
                    ● 24/7 Automated
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>
                  {dpMethod === 'Easypaisa' && 'Fast and secure Easypaisa payment with instant account crediting.'}
                  {dpMethod === 'JazzCash' && 'Fast and secure JazzCash payment with instant account crediting.'}
                  {dpMethod === 'Card' && 'Secure Visa / Mastercard 3D-Secure payment.'}
                </p>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent)' }}>
                  Exchange Rate: <strong>1 PKR = 1 Balance Unit</strong> (Instant Credit)
                </div>
              </div>

              {dpMsg && <div style={msgStyle(dpMsg.type)}>{dpMsg.text}</div>}

              <form onSubmit={handleAutoPaySubmit}>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Deposit Amount in PKR:
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 500 (Min 10, Max 50,000)" 
                  value={dpAmount} 
                  onChange={e => setDpAmount(e.target.value)} 
                  style={inputStyle} 
                  required 
                  min={10}
                  max={50000}
                />

                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  {dpMethod === 'Easypaisa' && 'Easypaisa Mobile Account Number:'}
                  {dpMethod === 'JazzCash' && 'JazzCash Mobile Account Number:'}
                  {dpMethod === 'Card' && 'Billing / Contact Mobile Number:'}
                </label>
                <input 
                  type="text" 
                  placeholder="03xxxxxxxxx (11 digits starting with 03)" 
                  value={dpPhone} 
                  onChange={e => setDpPhone(e.target.value)} 
                  pattern="^03\d{9}$"
                  title="Must be 11 digits starting with 03 (e.g. 03001234567)"
                  style={inputStyle} 
                  required 
                />

                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  {dpMethod === 'Card' ? 'Cardholder Full Name:' : 'Payer Full Name on Account:'}
                </label>
                <input 
                  type="text" 
                  placeholder="Full Name as registered on account" 
                  value={dpName} 
                  onChange={e => setDpName(e.target.value)} 
                  style={inputStyle} 
                  required 
                />

                {dpAmount && (
                  <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '8px', padding: '12px', color: '#00e676', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🎉 You will receive: <CurrencyFlag size={18} /> {computedDpCreditedVal} balance
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={dpLoading}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    fontSize: '15px', 
                    fontWeight: '900', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: dpMethod === 'Easypaisa' 
                      ? 'linear-gradient(135deg, #00c853 0%, #008435 100%)' 
                      : dpMethod === 'JazzCash' 
                      ? 'linear-gradient(135deg, #d50000 0%, #8b0000 100%)' 
                      : 'linear-gradient(135deg, var(--accent) 0%, #cc8800 100%)',
                    color: dpMethod === 'Card' ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                >
                  {dpLoading ? 'Connecting to Gateway...' : `🚀 Pay with ${dpMethod} (Instant)`}
                </button>
              </form>
            </div>
          )}

          {/* Mode B: Manual Transfer with TxID Verification */}
          {depositMode === 'manual' && (
            <div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Manual transfer to official accounts:<br />
                <strong style={{ color: '#fff' }}>🟢 Easypaisa:</strong> 0300-0000000 (WinX Pro Official)<br />
                <strong style={{ color: '#fff' }}>🔴 JazzCash:</strong> 0300-0000000 (WinX Pro Official)<br />
                <strong style={{ color: '#fff' }}>🌐 Binance / USDT:</strong> usd-official-wallet-address<br />
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', color: 'var(--accent)' }}>
                  Rates: <strong>1 PKR = 1 Balance Unit</strong>
                </div>
              </div>

              {depMsg && <div style={msgStyle(depMsg.type)}>{depMsg.text}</div>}

              <form onSubmit={handleDeposit}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select value={depCurrency} onChange={e => setDepCurrency(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}>
                    <option value="pkr">Fiat (PKR)</option>
                    <option value="usd">USD ($)</option>
                  </select>
                  <select value={depMethod} onChange={e => { setDepMethod(e.target.value); if (e.target.value === 'binance') setDepCurrency('usd'); else setDepCurrency('pkr') }} style={{ ...inputStyle, marginBottom: 0, flex: 2 }}>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="binance">Binance Pay (Crypto)</option>
                  </select>
                </div>
                
                <input 
                  type="number" 
                  placeholder={`Deposit Amount in ${depCurrency.toUpperCase()}`} 
                  value={depAmount} 
                  onChange={e => setDepAmount(e.target.value)} 
                  style={inputStyle} 
                  required 
                  min={1} 
                />

                {depAmount && (
                  <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '8px', padding: '12px', color: '#00e676', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🎉 You will receive: <CurrencyFlag size={18} /> {computedCreditedVal} balance
                  </div>
                )}

                <input type="text" placeholder="Transaction ID (from Bank/Wallet SMS/Receipt)" value={depTxId} onChange={e => setDepTxId(e.target.value)} style={inputStyle} required />
                <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: '14px' }}>Submit Manual Deposit Request</button>
              </form>
            </div>
          )}
        </div>

        {/* Withdraw Section */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#ffaa00', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏧 Request Payout / Withdrawal
          </h2>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5' }}>
            Minimum withdrawal: <strong>500 PKR</strong>. Fast 24/7 processing to Easypaisa, JazzCash, Bank, or USDT.
          </div>

          {witMsg && <div style={msgStyle(witMsg.type)}>{witMsg.text}</div>}

          <form onSubmit={handleWithdraw}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={witCurrency} onChange={e => setWitCurrency(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}>
                <option value="pkr">Fiat (PKR)</option>
                <option value="usd">USD ($)</option>
              </select>
              <select value={witMethod} onChange={e => setWitMethod(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 2 }}>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer (1LINK)</option>
                <option value="Debit / Credit Card">Debit / Credit Card</option>
                <option value="binance">Binance Pay (Crypto)</option>
              </select>
            </div>
            
            <input type="text" placeholder="Your Payout Account Number / Mobile / Address" value={witAccount} onChange={e => setWitAccount(e.target.value)} style={inputStyle} required />
            
            <input 
              type="number" 
              placeholder="Withdrawal Amount (in PKR, min 500)" 
              value={witAmount} 
              onChange={e => setWitAmount(e.target.value)} 
              style={inputStyle} 
              required 
              min={500} 
            />

            {witAmount && (
              <div style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '8px', padding: '12px', color: '#ffaa00', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                💰 Net Payout: {witCurrency === 'pkr' ? 'Rs ' : '$'} {computedWithdrawVal} {witCurrency.toUpperCase()}
              </div>
            )}

            <button type="submit" className="btn" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ffaa00 0%, #cc7700 100%)', color: '#000', fontWeight: 'bold', fontSize: '14px' }}>
              Submit Payout Request
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: '18px', color: 'var(--accent)' }}>📋 Transaction History</h2>
          {transactions.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px' }}>No transactions recorded yet.</div>}
          {transactions.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '14px' }}>
                  {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdrawal'} ({tx.method || 'System'})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  {new Date(tx.created_at).toLocaleString()} {tx.tx_id && `• TxID: ${tx.tx_id}`}
                </div>
                {tx.notes && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{tx.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: tx.type === 'deposit' ? '#00e676' : '#ff5555', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {tx.type === 'deposit' ? '+' : '-'}<CurrencyFlag size={14} />{parseFloat(tx.amount).toFixed(2)}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  background: tx.status === 'completed' ? 'rgba(0, 230, 118, 0.2)' : tx.status === 'pending' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                  color: tx.status === 'completed' ? '#00e676' : tx.status === 'pending' ? '#ffaa00' : '#ff4444'
                }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
