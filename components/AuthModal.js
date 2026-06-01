import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const { signUp, logIn } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = isLogin 
        ? await logIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else {
        onClose() // Close modal on success
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--card)', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--accent)' }}>{isLogin ? 'Log In' : 'Sign Up'}</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#111', color: '#fff' }}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#111', color: '#fff' }}
            required
          />
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </div>

        <button 
          onClick={onClose} 
          className="btn" 
          style={{ width: '100%', marginTop: '16px', background: 'transparent', border: 'none', color: 'var(--muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
