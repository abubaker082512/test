import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'
import BottomNav from '../components/BottomNav'

// Recharge Methods with Official Brand Logos
const RECHARGE_METHODS = [
  { id: 'easypaisa', name: 'Easypaisa', icon: '/icons/easypaisa.webp', badge: 'DirectPay' },
  { id: 'jazzcash', name: 'JazzCash', icon: '/icons/jazzcash.jpeg', badge: 'DirectPay' },
  { id: 'card', name: 'Cards (Visa/MC)', icon: '/icons/card.svg', badge: 'Instant' },
  { id: 'wallets', name: 'Bank Wallets', icon: '/icons/wallet.svg', badge: '1LINK' },
  { id: 'qr', name: 'QR Pay', icon: '/icons/qr-pay.svg' },
  { id: 'usdt', name: 'USDT', badge: '+3%', icon: '/icons/usdt.png' },
  { id: 'jazzcash_qr', name: 'JAZZCASH_QR', icon: '/icons/jazzcash-qr.png' }
]

// Preset Recharge Amounts (Rs 200 min up to Rs 100,000)
const RECHARGE_AMOUNTS = [200, 500, 1000, 1500, 2000, 3000, 5000, 10000, 15000, 20000, 30000, 50000, 100000]

// Top Pakistani Commercial Banks for 1LINK Transfers
const PAKISTAN_BANKS = [
  'Meezan Bank',
  'Habib Bank Limited (HBL)',
  'Bank Alfalah',
  'United Bank Limited (UBL)',
  'MCB Bank',
  'Allied Bank Limited (ABL)',
  'Askari Bank',
  'Standard Chartered Bank',
  'Faysal Bank',
  'Bank of Punjab (BOP)',
  'JS Bank',
  'Soneri Bank',
  'Dubai Islamic Bank',
  'BankIslami Pakistan',
  'Al Baraka Bank',
  'Samba Bank',
  'Sindh Bank',
  'NayaPay',
  'SadaPay',
  'Other Bank'
]

export default function WalletPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('deposit') // 'deposit' | 'withdraw' | 'records'
  const [recordsFilter, setRecordsFilter] = useState('all') // 'all' | 'deposit' | 'withdraw' | 'payout'
  const [refreshing, setRefreshing] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  // Deposit States matching Screenshots 1 & 2
  const [rechargeMethod, setRechargeMethod] = useState('easypaisa')
  const [rechargeChannel, setRechargeChannel] = useState('directpay') // 'directpay' | 'transfer'
  const [directPayLoading, setDirectPayLoading] = useState(false)
  const [directPayStatusModal, setDirectPayStatusModal] = useState(null)
  const [amount, setAmount] = useState('200')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Payment Form States
  const [senderPhone, setSenderPhone] = useState('')
  const [tid, setTid] = useState('')
  const [cryptoTxid, setCryptoTxid] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [depositMsg, setDepositMsg] = useState(null)

  // Withdrawal States
  const [witAmount, setWitAmount] = useState('')
  const [witMethod, setWitMethod] = useState('EasyPaisa')
  const [witBankName, setWitBankName] = useState('Meezan Bank')
  const [witAccount, setWitAccount] = useState('')
  const [witTitle, setWitTitle] = useState('')
  const [witMsg, setWitMsg] = useState(null)
  const [witLoading, setWitLoading] = useState(false)

  // Gateway Settings
  const [rates, setRates] = useState({
    pkr_rate: 1.0,
    usd_rate: 280.0,
    min_deposit: 200,
    max_deposit: 100000,
    min_withdraw: 500,
    max_withdraw: 50000,
    manual_jazzcash_title: 'WinX Pro Official',
    manual_jazzcash_no: '03112235935',
    manual_easypaisa_title: 'WinX Pro Official',
    manual_easypaisa_no: '03493530916',
    manual_crypto_network: 'USDT (TRC20)',
    manual_crypto_address: 'TP2B4tF9qK8jZ1sL5vN8mM9eR7wX4yP1aB'
  })

  // Handle Query Parameters & DirectPay return
  useEffect(() => {
    if (!router.isReady) return
    const { tab, directpay_status, txn_id, amount: dpAmount } = router.query
    if (tab === 'withdraw') setActiveTab('withdraw')
    else if (tab === 'records' || tab === 'history') setActiveTab('records')
    else if (tab === 'crypto') setRechargeMethod('usdt')

    if (directpay_status && txn_id) {
      if (directpay_status === 'success') {
        handleVerifyDirectPay(txn_id, dpAmount)
      } else if (directpay_status === 'failed') {
        handleFailDirectPay(txn_id)
      }
    }
  }, [router.isReady, router.query])

  const handleVerifyDirectPay = async (txnId, dpAmount) => {
    setDirectPayLoading(true)
    setDirectPayStatusModal({ status: 'verifying', text: 'Verifying payment with DirectPay...' })
    try {
      const activeUid = user?.id || user?.uid || ''
      const res = await fetch('/api/payments/directpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn_id: txnId,
          user_id: activeUid,
          amount: dpAmount,
          email: user?.email || ''
        })
      })
      const data = await res.json()
      if (data.success && data.status === 'completed') {
        setDirectPayStatusModal({
          status: 'success',
          text: `🎉 Payment of Rs ${parseFloat(data.creditedAmount || dpAmount || 0).toLocaleString()} successfully verified! Your balance is updated.`,
          balance: data.balance
        })
        if (data.balance !== undefined) {
          setWallet(prev => ({ ...(prev || {}), balance: data.balance }))
        }
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setDirectPayStatusModal({
          status: 'error',
          text: data.message || 'Payment verification failed. Please contact support with TxID: ' + txnId
        })
      }
    } catch (err) {
      setDirectPayStatusModal({
        status: 'error',
        text: 'Network error verifying DirectPay transaction. Please refresh or contact support.'
      })
    } finally {
      setDirectPayLoading(false)
      router.replace('/wallet', undefined, { shallow: true })
    }
  }

  const handleFailDirectPay = async (txnId) => {
    try {
      await fetch('/api/payments/directpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id: txnId, status: 'failed' })
      })
    } catch (e) {}
    setDirectPayStatusModal({
      status: 'error',
      text: 'DirectPay transaction was cancelled or declined. No money was deducted.'
    })
    router.replace('/wallet', undefined, { shallow: true })
  }

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        setRates(prev => ({
          ...prev,
          pkr_rate: data.pkr_rate || 1.0,
          usd_rate: data.usd_rate || 280.0,
          min_deposit: data.min_deposit || 100,
          max_deposit: data.max_deposit || 20000,
          min_withdraw: data.min_withdraw || 500,
          max_withdraw: data.max_withdraw || 50000,
          manual_jazzcash_title: data.manual_jazzcash_title || prev.manual_jazzcash_title,
          manual_jazzcash_no: data.manual_jazzcash_no || prev.manual_jazzcash_no,
          manual_easypaisa_title: data.manual_easypaisa_title || prev.manual_easypaisa_title,
          manual_easypaisa_no: data.manual_easypaisa_no || prev.manual_easypaisa_no,
          manual_crypto_address: data.manual_crypto_address || prev.manual_crypto_address
        }))
      }
    } catch (e) {}
  }

  const fetchData = async () => {
    const activeUid = user?.id || user?.uid || ''
    const activeEmail = user?.email || ''
    if (!activeUid && !activeEmail) return

    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()
      if (json.success) {
        if (json.wallet) setWallet(json.wallet)
        if (Array.isArray(json.transactions)) setTransactions(json.transactions)
      }
    } catch (e) {}

    try {
      if (user?.id) {
        const { data: t } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(25)
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
    const poll = setInterval(fetchData, 5000)
    return () => clearInterval(poll)
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 800)
  }

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 1800)
    }
  }

  // Calculate Bonus and "You can get" display
  const numAmount = parseFloat(amount) || 0
  let bonusRate = 0
  if (rechargeMethod === 'usdt') {
    bonusRate = 0.03
  } else if (numAmount >= 10000) {
    bonusRate = 0.10
  } else if (numAmount >= 3000) {
    bonusRate = 0.08
  } else if (numAmount >= 1000) {
    bonusRate = 0.05
  }
  const calculatedTotal = numAmount * (1 + bonusRate)

  // Handle Deposit Initiation (DirectPay & Manual)
  const handleInitiateDeposit = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    const val = parseFloat(amount)
    if (isNaN(val) || val < 200) {
      alert('Minimum deposit amount is Rs 200.')
      return
    }

    // DirectPay flow for Easypaisa, JazzCash, Card, and Bank Wallets
    const isDirectPay = (rechargeChannel === 'directpay' || rechargeMethod === 'card' || rechargeMethod === 'wallets') && rechargeMethod !== 'usdt'

    if (isDirectPay) {
      setDirectPayLoading(true)
      setDepositMsg(null)
      try {
        let paymentMethodName = 'Easypaisa'
        if (rechargeMethod === 'jazzcash') paymentMethodName = 'JazzCash'
        else if (rechargeMethod === 'card') paymentMethodName = 'Card'
        else if (rechargeMethod === 'wallets') paymentMethodName = 'Wallet'
        else if (rechargeMethod === 'qr') paymentMethodName = 'QR'

        const res = await fetch('/api/payments/directpay/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.uid,
            amountInPKR: val,
            payer_name: user.user_metadata?.full_name || user.email || 'Player',
            email: user.email || 'player@winxpro.com.pk',
            msisdn: senderPhone || user.phone || '03001234567',
            payment_method: paymentMethodName
          })
        })

        const data = await res.json()
        if (data.success && data.paymentUrl) {
          // Immediately redirect to official DirectPay secure portal
          window.location.href = data.paymentUrl
          return
        } else {
          alert(data.error || 'DirectPay initiation failed. Opening manual transfer modal.')
          setShowPaymentModal(true)
        }
      } catch (err) {
        alert('Error initiating DirectPay: ' + err.message)
        setShowPaymentModal(true)
      } finally {
        setDirectPayLoading(false)
      }
    } else {
      setDepositMsg(null)
      setShowPaymentModal(true)
    }
  }

  const handleConfirmDeposit = async (e) => {
    if (e) e.preventDefault()
    if (!user) return

    if (rechargeMethod === 'usdt') {
      if (!cryptoTxid || cryptoTxid.trim().length < 8) {
        setDepositMsg({ type: 'error', text: 'Please enter a valid USDT TRC20 Transaction Hash (TXID).' })
        return
      }
    } else {
      if (!tid || tid.trim().length < 6) {
        setDepositMsg({ type: 'error', text: 'Please enter the 11-12 digit Transaction ID (TID) from your payment receipt.' })
        return
      }
    }

    setIsSubmitting(true)
    setDepositMsg(null)

    const activeUserId = user.id || user.uid || 'guest'
    const activeEmail = user.email || `${activeUserId}@winxpro.com`
    const isCrypto = rechargeMethod === 'usdt'

    try {
      const payload = isCrypto ? {
        user_id: activeUserId,
        email: activeEmail,
        amount: numAmount,
        currency: 'USDT',
        method: 'USDT (TRC20)',
        transaction_id: cryptoTxid.trim(),
        notes: `USDT Deposit +3% Bonus | TXID: ${cryptoTxid.trim()}`
      } : {
        user_id: activeUserId,
        email: activeEmail,
        amount: numAmount,
        currency: 'PKR',
        method: rechargeMethod.toUpperCase(),
        sender_phone: senderPhone || user.phone || '03xxxxxxxxx',
        transaction_id: tid.trim(),
        notes: `${rechargeMethod.toUpperCase()} | Channel: ${rechargeChannel} | TID: ${tid.trim()}`
      }

      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.success) {
        setDepositMsg({
          type: 'success',
          text: `✅ Deposit of Rs ${numAmount.toLocaleString()} submitted! Verification is instant.`
        })
        setTid('')
        setCryptoTxid('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
        setTimeout(() => {
          setShowPaymentModal(false)
        }, 2200)
      } else {
        setDepositMsg({ type: 'error', text: data.error || 'Failed to submit deposit. Please check your TID.' })
      }
    } catch (err) {
      setDepositMsg({ type: 'error', text: err.message || 'Network error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Withdrawal Request with Immediate Balance Deduction
  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    const currentBal = wallet ? parseFloat(wallet.balance) : 0
    const val = parseFloat(witAmount)

    if (isNaN(val) || val < (rates.min_withdraw || 500)) {
      setWitMsg({ type: 'error', text: `Minimum withdrawal is Rs ${(rates.min_withdraw || 500).toLocaleString()}` })
      return
    }
    if (val > currentBal) {
      setWitMsg({ type: 'error', text: `Insufficient wallet balance. You have Rs ${currentBal.toFixed(2)}` })
      return
    }
    if (!witAccount || witAccount.trim().length < 8) {
      setWitMsg({ type: 'error', text: 'Please enter a valid mobile number or bank account/IBAN.' })
      return
    }
    if (witMethod === 'Bank Transfer' && !witBankName) {
      setWitMsg({ type: 'error', text: 'Please select your bank name.' })
      return
    }

    setWitLoading(true)
    setWitMsg(null)

    try {
      const isBank = witMethod === 'Bank Transfer'
      const payload = {
        user_id: user.id || user.uid,
        email: user.email || '',
        amount: val,
        method: witMethod,
        bank_name: isBank ? witBankName : null,
        account_title: witTitle.trim() || 'N/A',
        account_number: witAccount.trim(),
        notes: isBank 
          ? `Withdrawal to ${witBankName} | Title: ${witTitle || 'N/A'} | A/C: ${witAccount}`
          : `Withdrawal to ${witMethod} | Title: ${witTitle || 'N/A'} | Number: ${witAccount}`
      }

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setWitMsg({ type: 'success', text: `✅ Payout request of Rs ${val.toLocaleString()} submitted! Amount deducted from your balance.` })
        setWitAmount('')
        setWitAccount('')
        setWitTitle('')
        if (data.new_balance !== undefined) {
          setWallet(prev => ({ ...(prev || {}), balance: data.new_balance }))
        }
        if (data.transaction) {
          setTransactions(prev => [data.transaction, ...(prev || [])])
        }
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setWitMsg({ type: 'error', text: data.error || 'Withdrawal failed.' })
      }
    } catch (err) {
      setWitMsg({ type: 'error', text: err.message })
    } finally {
      setWitLoading(false)
    }
  }

  // Active Admin Details
  const activeAdminNo = rechargeMethod === 'easypaisa'
    ? rates.manual_easypaisa_no
    : rates.manual_jazzcash_no
  const activeAdminTitle = rechargeMethod === 'easypaisa'
    ? rates.manual_easypaisa_title
    : rates.manual_jazzcash_title

  // Dynamic QR Image URL for payment
  const qrDataText = encodeURIComponent(`pkr:${activeAdminNo}?amount=${numAmount}&title=${activeAdminTitle}`)
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrDataText}&color=081a0b`

  return (
    <div className="app bbr-deposit-page">
      {/* 1. Header */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0d1510',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={() => activeTab !== 'deposit' ? setActiveTab('deposit') : router.back()}
          style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ←
        </button>
        <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
          {activeTab === 'withdraw' ? 'Withdrawal' : activeTab === 'records' ? 'My Records' : 'Deposit'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setActiveTab(activeTab === 'records' ? 'deposit' : 'records')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'records' ? '#6dff38' : '#ffd54f',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="My Records"
          >
            📋
          </button>
        </div>
      </div>

      <div style={{
        padding: '14px 16px 90px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box'
      }}>

        {/* 2. Top Balance Card (Screenshots 1 & 2) */}
        <div style={{
          background: 'linear-gradient(135deg, #16261d 0%, #101c15 100%)',
          border: '1px solid rgba(109, 255, 56, 0.16)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Wallet with Coins Icon */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff4081 0%, #ff80ab 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)'
            }}>
              👛
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9bb0a2' }}>Balance</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffd54f', letterSpacing: '0.3px', marginTop: '2px' }}>
                Rs {wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6dff38',
              fontSize: '15px',
              cursor: 'pointer'
            }}
            className={refreshing ? 'coin-spin' : ''}
            title="Refresh Balance"
          >
            🔄
          </button>
        </div>

        {/* Tab Switcher if on Withdraw / Records */}
        {activeTab !== 'deposit' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('deposit')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid rgba(109, 255, 56, 0.4)',
                background: 'rgba(109, 255, 56, 0.1)',
                color: '#6dff38',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ← Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: activeTab === 'withdraw' ? '1.5px solid #6dff38' : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeTab === 'withdraw' ? 'rgba(109, 255, 56, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'withdraw' ? '#6dff38' : '#9bb0a2',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab('records')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: activeTab === 'records' ? '1.5px solid #6dff38' : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeTab === 'records' ? 'rgba(109, 255, 56, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'records' ? '#6dff38' : '#9bb0a2',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Records
            </button>
          </div>
        )}

        {/* MAIN DEPOSIT SCREEN (Screenshots 1 & 2) */}
        {activeTab === 'deposit' && (
          <>
            {/* 3. Recharge Method Section */}
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                Recharge Method:
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {RECHARGE_METHODS.map(m => {
                  const isActive = rechargeMethod === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => setRechargeMethod(m.id)}
                      style={{
                        position: 'relative',
                        background: isActive ? '#70e434' : '#1c261f',
                        border: isActive ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '12px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 16px rgba(112, 228, 52, 0.45)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Top-left Badge (e.g. +3% on USDT) */}
                      {m.badge && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '6px',
                          background: '#70e434',
                          color: '#081a0b',
                          fontSize: '9px',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: '999px',
                          border: '1px solid #081a0b',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                        }}>
                          {m.badge}
                        </span>
                      )}

                      {/* Official SVG Icon */}
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={m.icon}
                          alt={m.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain',
                            borderRadius: '6px'
                          }}
                        />
                      </div>

                      {/* Title */}
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        color: isActive ? '#081a0b' : '#ffffff',
                        textAlign: 'center',
                        lineHeight: 1.1
                      }}>
                        {m.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 4. Recharge Channel Section (Screenshots 1 & 2) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🏁</span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>Recharge Channel:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {rechargeMethod === 'usdt' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRechargeChannel('trc20')}
                      style={{
                        background: rechargeChannel !== 'bep20' ? '#70e434' : '#1c261f',
                        border: rechargeChannel !== 'bep20' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel !== 'bep20' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                        USDT TRC20
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel !== 'bep20' ? '#081a0b' : '#94a3b8' }}>
                        (Instant +3% Bonus)
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRechargeChannel('bep20')}
                      style={{
                        background: rechargeChannel === 'bep20' ? '#70e434' : '#1c261f',
                        border: rechargeChannel === 'bep20' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel === 'bep20' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                        USDT BEP20
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel === 'bep20' ? '#081a0b' : '#94a3b8' }}>
                        (Binance Smart Chain)
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setRechargeChannel('directpay')}
                      style={{
                        background: rechargeChannel === 'directpay' ? '#70e434' : '#1c261f',
                        border: rechargeChannel === 'directpay' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        cursor: 'pointer',
                        boxShadow: rechargeChannel === 'directpay' ? '0 0 14px rgba(112, 228, 52, 0.35)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel === 'directpay' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                        ⚡ DirectPay (Auto)
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel === 'directpay' ? '#081a0b' : '#94a3b8' }}>
                        Instant Auto Credited
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRechargeChannel('transfer')}
                      style={{
                        background: rechargeChannel === 'transfer' ? '#70e434' : '#1c261f',
                        border: rechargeChannel === 'transfer' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        cursor: 'pointer',
                        boxShadow: rechargeChannel === 'transfer' ? '0 0 14px rgba(112, 228, 52, 0.35)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel === 'transfer' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                        📱 Manual Transfer
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel === 'transfer' ? '#081a0b' : '#94a3b8' }}>
                        Scan QR &amp; Enter TID
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 5. Recharge Amount Section (Screenshots 1 & 2) */}
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                Recharge Amount:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {RECHARGE_AMOUNTS.map(amt => {
                  const isSelected = String(amt) === String(amount)
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      style={{
                        background: isSelected ? 'rgba(112, 228, 52, 0.15)' : '#1c261f',
                        border: isSelected ? '1.5px solid #70e434' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 6px',
                        color: isSelected ? '#70e434' : '#ffffff',
                        fontSize: '14px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 12px rgba(112, 228, 52, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {amt.toLocaleString()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 6. "You can get" Calculation Capsule (Screenshots 1 & 2) */}
            <div style={{
              background: '#222d26',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#c4d7ca' }}>
                You can get
              </span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffd54f', letterSpacing: '0.3px' }}>
                Rs {calculatedTotal.toFixed(2)}
              </span>
            </div>

            {/* 7. Amount Input Field with Clear Button (Screenshots 1 & 2) */}
            <div style={{
              background: '#121c16',
              border: '1.5px solid rgba(109, 255, 56, 0.25)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38' }}>Rs</span>
                <input
                  type="number"
                  placeholder="Rs 200 ~ 100,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    width: '100%'
                  }}
                  min="200"
                  max="100000"
                />
              </div>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 8. Full-Width Vibrant Green Deposit Button (DirectPay & Manual) */}
            <button
              type="button"
              onClick={handleInitiateDeposit}
              disabled={directPayLoading}
              style={{
                background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                border: 'none',
                borderRadius: '999px',
                padding: '15px 20px',
                color: '#081a0b',
                fontSize: '16.5px',
                fontWeight: 900,
                letterSpacing: '0.4px',
                cursor: directPayLoading ? 'not-allowed' : 'pointer',
                opacity: directPayLoading ? 0.7 : 1,
                boxShadow: '0 4px 18px rgba(94, 200, 49, 0.45)',
                transition: 'transform 0.15s, opacity 0.15s'
              }}
            >
              {directPayLoading ? 'Connecting DirectPay Gateway...' : rechargeChannel === 'directpay' && rechargeMethod !== 'usdt' ? '⚡ Pay with DirectPay (Instant)' : 'Deposit'}
            </button>
          </>
        )}

        {/* CLASSY WITHDRAWAL TAB */}
        {activeTab === 'withdraw' && (
          <div style={{
            background: 'linear-gradient(145deg, #16261d 0%, #101c15 100%)',
            border: '1.5px solid rgba(109, 255, 56, 0.28)',
            borderRadius: '20px',
            padding: '20px 18px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(109, 255, 56, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.2px' }}>
                ⚡ Instant Withdrawal
              </div>
              <span style={{
                background: 'rgba(109, 255, 56, 0.15)',
                border: '1px solid rgba(109, 255, 56, 0.4)',
                color: '#6dff38',
                fontSize: '11px',
                fontWeight: 900,
                padding: '3px 9px',
                borderRadius: '999px'
              }}>
                VIP 1LINK
              </span>
            </div>

            <div style={{ fontSize: '11.5px', color: '#9bb0a2', marginBottom: '16px', lineHeight: 1.4 }}>
              Minimum withdrawal: <span style={{ color: '#ffd54f', fontWeight: 800 }}>Rs {rates.min_withdraw || 500}</span>. Balance is deducted instantly upon submission.
            </div>

            {witMsg && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontWeight: 800,
                marginBottom: '16px',
                background: witMsg.type === 'error' ? 'rgba(255, 51, 102, 0.16)' : 'rgba(109, 255, 56, 0.16)',
                border: `1.5px solid ${witMsg.type === 'error' ? '#ff3366' : '#6dff38'}`,
                color: witMsg.type === 'error' ? '#ff6688' : '#6dff38',
                lineHeight: 1.4
              }}>
                {witMsg.text}
              </div>
            )}

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#c4d7ca', display: 'block', marginBottom: '6px' }}>
                  Payout Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'EasyPaisa', label: 'Easypaisa', icon: '/icons/easypaisa.webp' },
                    { id: 'JazzCash', label: 'JazzCash', icon: '/icons/jazzcash.jpeg' },
                    { id: 'Bank Transfer', label: 'Bank Transfer', icon: '/icons/qr-pay.svg' }
                  ].map(m => {
                    const isSel = witMethod === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => setWitMethod(m.id)}
                        style={{
                          background: isSel ? '#70e434' : '#101a14',
                          border: isSel ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '10px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: isSel ? '0 0 14px rgba(112, 228, 52, 0.35)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img src={m.icon} alt={m.label} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          color: isSel ? '#081a0b' : '#ffffff',
                          textAlign: 'center',
                          lineHeight: 1.1
                        }}>
                          {m.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Bank Name Dropdown for Bank Transfer */}
              {witMethod === 'Bank Transfer' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#6dff38', display: 'block', marginBottom: '6px' }}>
                    Select Pakistani Bank *
                  </label>
                  <select
                    value={witBankName}
                    onChange={e => setWitBankName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#101a14',
                      border: '1.5px solid #6dff38',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {PAKISTAN_BANKS.map(bank => (
                      <option key={bank} value={bank} style={{ background: '#101a14', color: '#ffffff' }}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#c4d7ca', display: 'block', marginBottom: '6px' }}>
                  Account Title (Recipient Name) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={witTitle}
                  onChange={e => setWitTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#c4d7ca', display: 'block', marginBottom: '6px' }}>
                  {witMethod === 'Bank Transfer' ? 'Bank Account Number / IBAN *' : 'Mobile Account Number *'}
                </label>
                <input
                  type="text"
                  placeholder={witMethod === 'Bank Transfer' ? 'e.g. PK00MEZN0000000000000000' : '03xxxxxxxxx (11 digits)'}
                  value={witAccount}
                  onChange={e => setWitAccount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#c4d7ca' }}>
                    Withdrawal Amount (PKR) *
                  </label>
                  <span style={{ fontSize: '11px', color: '#ffd54f', fontWeight: 800 }}>
                    Available: Rs {wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div style={{
                  background: '#101a14',
                  border: '1.5px solid rgba(109, 255, 56, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38' }}>Rs</span>
                  <input
                    type="number"
                    placeholder={`Min ${rates.min_withdraw || 500}`}
                    value={witAmount}
                    onChange={e => setWitAmount(e.target.value)}
                    required
                    min={rates.min_withdraw || 500}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 800,
                      width: '100%'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setWitAmount(String(Math.floor(wallet ? parseFloat(wallet.balance) : 0)))}
                    style={{
                      background: 'rgba(109, 255, 56, 0.15)',
                      border: '1px solid #6dff38',
                      color: '#6dff38',
                      fontSize: '10.5px',
                      fontWeight: 900,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ALL
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 213, 79, 0.08)',
                border: '1px solid rgba(255, 213, 79, 0.25)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: '#ffd54f'
              }}>
                <span>ℹ️</span>
                <span>Submitting will immediately deduct the funds from your balance. The transaction will appear in <strong>My Records</strong> with status <strong>Pending</strong> until approved.</span>
              </div>

              <button
                type="submit"
                disabled={witLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                  border: 'none',
                  color: '#081a0b',
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '0.3px',
                  cursor: witLoading ? 'not-allowed' : 'pointer',
                  opacity: witLoading ? 0.7 : 1,
                  boxShadow: '0 4px 18px rgba(94, 200, 49, 0.4)',
                  marginTop: '4px'
                }}
              >
                {witLoading ? 'Deducting & Submitting...' : 'Submit Withdrawal'}
              </button>
            </form>
          </div>
        )}

        {/* DEDICATED MY RECORDS TAB */}
        {activeTab === 'records' && (
          <div style={{
            background: 'linear-gradient(145deg, #16261d 0%, #101c15 100%)',
            border: '1.5px solid rgba(109, 255, 56, 0.2)',
            borderRadius: '20px',
            padding: '18px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>
                📋 My Transaction Records
              </div>
              <button
                onClick={handleRefresh}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6dff38',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                className={refreshing ? 'coin-spin' : ''}
                title="Refresh Records"
              >
                🔄
              </button>
            </div>

            {/* Filter Pills: All / Deposits / Withdrawals / Bonuses */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'deposit', label: 'Deposits' },
                { id: 'withdraw', label: 'Withdrawals' },
                { id: 'payout', label: 'Bonuses & Wins' }
              ].map(f => {
                const isActive = recordsFilter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setRecordsFilter(f.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: isActive ? '#70e434' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#081a0b' : '#c4d7ca',
                      border: isActive ? '1px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Records List */}
            {(() => {
              const filtered = transactions.filter(tx => {
                if (recordsFilter === 'all') return true
                if (recordsFilter === 'deposit') return tx.type === 'deposit'
                if (recordsFilter === 'withdraw') return tx.type === 'withdraw'
                if (recordsFilter === 'payout') return tx.type === 'payout' || tx.type === 'bonus' || tx.type === 'win'
                return true
              })

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: '#7a8f82', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                    No {recordsFilter === 'all' ? '' : recordsFilter} records found.
                  </div>
                )
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filtered.map(tx => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'bonus' || tx.type === 'win'
                    const statusStr = (tx.status || 'pending').toLowerCase()
                    const isApproved = statusStr === 'completed' || statusStr === 'approved' || statusStr === 'success'
                    const isPending = statusStr === 'pending' || statusStr === 'processing'
                    const isRejected = statusStr === 'rejected' || statusStr === 'failed' || statusStr === 'cancelled'

                    const tidCode = tx.metadata?.tid || tx.metadata?.transaction_id || tx.transaction_id || tx.id || tx.tx_id

                    return (
                      <div
                        key={tx.id || tx.tx_id || `${tx.created_at}-${tx.amount}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>
                              {tx.type === 'deposit' ? '🟢' : tx.type === 'withdraw' ? '🔴' : '🎁'}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', textTransform: 'capitalize' }}>
                              {tx.type === 'withdraw' ? 'Withdrawal' : tx.type === 'deposit' ? 'Deposit' : 'Bonus Reward'}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: '#9bb0a2', marginTop: '3px' }}>
                            {tx.method || tx.metadata?.channel || tx.metadata?.bank_name || 'Direct Transfer'}
                          </div>

                          {tx.notes && (
                            <div style={{ fontSize: '10px', color: '#7a8f82', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.notes}
                            </div>
                          )}

                          <div style={{ fontSize: '9.5px', color: '#55665b', marginTop: '4px' }}>
                            {new Date(tx.created_at || Date.now()).toLocaleString('en-PK', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <div style={{
                            fontSize: '14.5px',
                            fontWeight: 900,
                            color: isCredit ? '#6dff38' : '#ff4d6d',
                            letterSpacing: '0.2px'
                          }}>
                            {isCredit ? '+' : '-'}Rs {parseFloat(tx.amount || 0).toFixed(2)}
                          </div>

                          {/* Status Pill */}
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            background: isApproved 
                              ? 'rgba(109, 255, 56, 0.18)' 
                              : isPending 
                                ? 'rgba(255, 213, 79, 0.18)' 
                                : 'rgba(255, 51, 102, 0.18)',
                            color: isApproved 
                              ? '#6dff38' 
                              : isPending 
                                ? '#ffd54f' 
                                : '#ff4d6d',
                            border: `1px solid ${isApproved ? 'rgba(109, 255, 56, 0.35)' : isPending ? 'rgba(255, 213, 79, 0.35)' : 'rgba(255, 51, 102, 0.35)'}`
                          }}>
                            {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                          </span>

                          {tidCode && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(String(tidCode), `tid-${tidCode}`)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedField === `tid-${tidCode}` ? '#6dff38' : '#7a8f82',
                                fontSize: '9.5px',
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '2px'
                              }}
                            >
                              {copiedField === `tid-${tidCode}` ? '✓ Copied' : `TID: ${String(tidCode).slice(0, 10)}...`}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

      </div>

      {/* PAYMENT MODAL (Step 1 to 4 QR & TID Submission matching Screenshot 1) */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#121e16',
            border: '1.5px solid #6dff38',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '20px 18px',
            boxShadow: '0 0 30px rgba(109, 255, 56, 0.35)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                {rechargeMethod === 'usdt' ? 'USDT TRC20 Deposit' : 'QR Payment Confirmation'}
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* 4-Step QR Tutorial Graphic or Details (matching Screenshot 1) */}
            {rechargeMethod !== 'usdt' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* QR Code Container */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <img
                    src={dynamicQrCodeUrl}
                    alt="Payment QR"
                    style={{ width: '180px', height: '180px', borderRadius: '10px' }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#081a0b', textAlign: 'center' }}>
                    Scan &amp; Pay: Rs {numAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#55665b' }}>
                    Receiver: {activeAdminTitle} ({activeAdminNo})
                  </div>
                </div>

                {/* Account Details with Copy Buttons */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9bb0a2' }}>Account Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38' }}>{activeAdminNo}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeAdminNo, 'no')}
                        style={{
                          background: '#6dff38',
                          border: 'none',
                          color: '#081a0b',
                          fontSize: '10px',
                          fontWeight: 900,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedField === 'no' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9bb0a2' }}>Account Title:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{activeAdminTitle}</span>
                  </div>
                </div>

                {/* Form Inputs: Sender Mobile & TID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
                      Your Sender Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="03xxxxxxxxx (account sent from)"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#101a14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#6dff38', display: 'block', marginBottom: '4px' }}>
                      Transaction ID (TID / TRX ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 028472918349 (from SMS receipt)"
                      value={tid}
                      onChange={e => setTid(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#101a14',
                        border: '1.5px solid #6dff38',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* USDT Flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(38, 161, 123, 0.4)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#6dff38', marginBottom: '6px' }}>
                    USDT (TRC20 Network) Address
                  </div>
                  <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12.5px', color: '#ffffff', marginBottom: '8px' }}>
                    {rates.manual_crypto_address}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(rates.manual_crypto_address, 'usdt')}
                    style={{
                      background: '#26a17b',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'usdt' ? '✓ Address Copied' : '📋 Copy TRC20 Address'}
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#6dff38', display: 'block', marginBottom: '4px' }}>
                    Transaction Hash (TXID) *
                  </label>
                  <input
                    type="text"
                    placeholder="Paste TRC20 TXID hash here"
                    value={cryptoTxid}
                    onChange={e => setCryptoTxid(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#101a14',
                      border: '1.5px solid #6dff38',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {depositMsg && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                background: depositMsg.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(109, 255, 56, 0.15)',
                border: `1px solid ${depositMsg.type === 'error' ? '#ff3366' : '#6dff38'}`,
                color: depositMsg.type === 'error' ? '#ff3366' : '#6dff38'
              }}>
                {depositMsg.text}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmDeposit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '14px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                border: 'none',
                color: '#081a0b',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(94, 200, 49, 0.4)'
              }}
            >
              {isSubmitting ? 'Submitting Payment...' : `Confirm & Submit Deposit`}
            </button>
          </div>
        </div>
      )}

      {/* DIRECTPAY VERIFICATION MODAL */}
      {directPayStatusModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#121e16',
            border: directPayStatusModal.status === 'success' ? '2px solid #6dff38' : directPayStatusModal.status === 'error' ? '2px solid #ff3366' : '2px solid #ffd54f',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 0 35px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>
              {directPayStatusModal.status === 'success' ? '🎉' : directPayStatusModal.status === 'error' ? '❌' : '⏳'}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 900,
              color: directPayStatusModal.status === 'success' ? '#6dff38' : directPayStatusModal.status === 'error' ? '#ff3366' : '#ffd54f',
              marginBottom: '10px'
            }}>
              {directPayStatusModal.status === 'success' ? 'Payment Verified!' : directPayStatusModal.status === 'error' ? 'Payment Notice' : 'Verifying Payment...'}
            </div>
            <div style={{ fontSize: '13.5px', color: '#c4d7ca', lineHeight: 1.5, marginBottom: '20px' }}>
              {directPayStatusModal.text}
            </div>
            {directPayStatusModal.status !== 'verifying' && (
              <button
                type="button"
                onClick={() => setDirectPayStatusModal(null)}
                style={{
                  background: directPayStatusModal.status === 'success' ? 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)' : 'rgba(255, 255, 255, 0.1)',
                  color: directPayStatusModal.status === 'success' ? '#081a0b' : '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                {directPayStatusModal.status === 'success' ? 'Play Games Now' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}
