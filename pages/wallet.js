import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'

export default function WalletPage() {
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Deposit form
  const [depAmount, setDepAmount] = useState('')
  const [depMethod, setDepMethod] = useState('easypaisa')
  const [depTxId, setDepTxId] = useState('')
  const [depMsg, setDepMsg] = useState(null)

  // Withdraw form
  const [witAmount, setWitAmount] = useState('')
  const [witMethod, setWitMethod] = useState('easypaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witMsg, setWitMsg] = useState(null)

  const fetchData = async () => {
    if (!user) return
    const { data: w } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    setWallet(w)
    const { data: t } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    setTransactions(t || [])
  }

  useEffect(() => { fetchData() }, [user])

  const handleDeposit = async (e) => {
    e.preventDefault()
    setDepMsg(null)
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: Number(depAmount), method: depMethod, tx_id: depTxId })
    })
    const data = await res.json()
    setDepMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) { setDepAmount(''); setDepTxId('') }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWitMsg(null)
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: Number(witAmount), method: witMethod, account_number: witAccount })
    })
    const data = await res.json()
    setWitMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) { setWitAmount(''); setWitAccount(''); fetchData() }
  }

  if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (!user) return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '64px' }}>🔒</div>
      <h2>Login Required</h2>
      <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', boxSizing: 'border-box', marginBottom: '12px' }
  const cardStyle = { background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '24px' }
  const msgStyle = (type) => ({ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', background: type === 'error' ? '#ff000022' : '#00ff8822', color: type === 'error' ? '#ff6666' : '#00ff88' })

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '20px' }}>← BetPK</Link>
        <h1 style={{ margin: 0, fontSize: '18px' }}>My Wallet</h1>
        <div />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Balance Card */}
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1a1a00, #111)', border: '1px solid var(--accent)33', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>AVAILABLE BALANCE</div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: 'var(--accent)' }}>
            ₱{wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
          </div>
        </div>

        {/* Deposit */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#00ff88' }}>💳 Deposit</h2>
          <div style={{ background: '#0a1a0a', border: '1px solid #00ff8833', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#aaa' }}>
            Send money to: <br />
            <strong style={{ color: '#00ff88' }}>Easypaisa:</strong> 0300-0000000 (BetPK Official)<br />
            <strong style={{ color: '#00ff88' }}>JazzCash:</strong> 0300-0000000 (BetPK Official)<br />
            Then submit the Transaction ID below.
          </div>
          {depMsg && <div style={msgStyle(depMsg.type)}>{depMsg.text}</div>}
          <form onSubmit={handleDeposit}>
            <select value={depMethod} onChange={e => setDepMethod(e.target.value)} style={inputStyle}>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
            <input type="number" placeholder="Amount (min ₱100)" value={depAmount} onChange={e => setDepAmount(e.target.value)} style={inputStyle} required min={100} />
            <input type="text" placeholder="Transaction ID (from Easypaisa/JazzCash)" value={depTxId} onChange={e => setDepTxId(e.target.value)} style={inputStyle} required />
            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px' }}>Submit Deposit Request</button>
          </form>
        </div>

        {/* Withdraw */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#ff9900' }}>🏧 Withdraw</h2>
          <div style={{ background: '#1a0f00', border: '1px solid #ff990033', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#aaa' }}>
            Minimum withdrawal: ₱500. Processed within 24 hours.
          </div>
          {witMsg && <div style={msgStyle(witMsg.type)}>{witMsg.text}</div>}
          <form onSubmit={handleWithdraw}>
            <select value={witMethod} onChange={e => setWitMethod(e.target.value)} style={inputStyle}>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
            <input type="text" placeholder="Your Account Number" value={witAccount} onChange={e => setWitAccount(e.target.value)} style={inputStyle} required />
            <input type="number" placeholder="Amount (min ₱500)" value={witAmount} onChange={e => setWitAmount(e.target.value)} style={inputStyle} required min={500} />
            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', background: '#ff9900', border: 'none' }}>Submit Withdrawal Request</button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>📋 Transaction History</h2>
          {transactions.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: '24px' }}>No transactions yet.</div>}
          {transactions.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{tx.type}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{new Date(tx.created_at).toLocaleString()}</div>
                {tx.notes && <div style={{ fontSize: '12px', color: '#888' }}>{tx.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: ['payout', 'deposit'].includes(tx.type) ? '#00ff88' : '#ff4444' }}>
                  {['payout', 'deposit'].includes(tx.type) ? '+' : '-'}₱{parseFloat(tx.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '8px', background: tx.status === 'completed' ? '#00ff8822' : tx.status === 'pending' ? '#ff990022' : '#ff000022', color: tx.status === 'completed' ? '#00ff88' : tx.status === 'pending' ? '#ff9900' : '#ff4444' }}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
