import React, { useState, useEffect } from 'react'

const ADMIN_PASSWORD = 'Admin@123'

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

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

  useEffect(() => { if (authed) fetchPending() }, [authed])

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

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
          <h1 style={{ color: 'var(--accent)', margin: 0 }}>🛡️ BetPK Admin Panel</h1>
          <button className="btn" onClick={fetchPending} disabled={loading}>{loading ? '⏳ Loading...' : '🔄 Refresh'}</button>
        </div>

        {msg && (
          <div style={{ background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#00ff88' }}>
            ✅ {msg}
          </div>
        )}

        <h2 style={{ color: '#ff9900', marginTop: 0 }}>⏳ Pending Transactions ({pending.length})</h2>

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
    </div>
  )
}
