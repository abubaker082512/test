import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'

export default function AuthModal({ isOpen, onClose }) {
  const router = useRouter()
  const { signUp, logIn, signInWithGoogle, toggleDemoMode } = useAuth()
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referrerEmail, setReferrerEmail] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedRef = localStorage.getItem('winxpro_referrer')
      if (cachedRef && !referrerEmail) {
        setReferrerEmail(cachedRef)
      }
    }
  }, [isOpen])

  if (!isOpen) return null


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isLogin && !agreed) {
      setError('Please agree to the User Agreement to continue.')
      return
    }

    setLoading(true)

    try {
      const { error } = isLogin 
        ? await logIn(email, password)
        : await signUp(email, password, referrerEmail)

      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoClick = () => {
    toggleDemoMode(true)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 230, 118, 0.15)',
        animation: 'modal-pop 0.25s ease-out'
      }}>
        {/* Top Promo Banner (Screenshot 4 style) */}
        <div style={{
          background: 'linear-gradient(90deg, #18092a 0%, #2a0845 50%, #18092a 100%)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>✈️</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                Invite friends & earn <span style={{ color: '#00e676', background: 'rgba(0,230,118,0.15)', padding: '1px 5px', borderRadius: '4px' }}>Rs 600</span>
              </div>
              <div style={{ fontSize: '10px', color: '#ffd700', fontWeight: 700 }}>
                Sign up & get <span style={{ color: '#00e676', background: 'rgba(0,230,118,0.15)', padding: '1px 5px', borderRadius: '4px' }}>Rs 100</span> cash
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle: Register | Login */}
        <div style={{ display: 'flex', borderBottom: '1px solid #27272a', background: '#0a0a0c' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null) }}
            style={{
              flex: 1,
              padding: '14px',
              background: !isLogin ? '#121214' : 'transparent',
              color: !isLogin ? '#00e676' : '#71717a',
              border: 'none',
              borderBottom: !isLogin ? '3px solid #00e676' : '3px solid transparent',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null) }}
            style={{
              flex: 1,
              padding: '14px',
              background: isLogin ? '#121214' : 'transparent',
              color: isLogin ? '#00e676' : '#71717a',
              border: 'none',
              borderBottom: isLogin ? '3px solid #00e676' : '3px solid transparent',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>

        <div style={{ padding: '24px 20px' }}>
          {error && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid #ff4444',
              color: '#ff6666',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                * Email / Phone Number:
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#71717a', fontSize: '14px' }}>👤</span>
                <input
                  type="email"
                  placeholder="Please enter Phone number / Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 36px',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                * Enter Password:
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#71717a', fontSize: '14px' }}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 36px 12px 36px',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '12px', color: '#71717a', cursor: 'pointer', fontSize: '14px' }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </span>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  * Enter Password Again:
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#71717a', fontSize: '14px' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 36px',
                      borderRadius: '8px',
                      border: '1px solid #27272a',
                      background: '#18181b',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Referral Code / Email (Optional):
                </label>
                <input
                  type="text"
                  placeholder="Enter referral email or invite code"
                  value={referrerEmail}
                  onChange={(e) => setReferrerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {!isLogin && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#a1a1aa', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ accentColor: '#00e676' }}
                />
                <span>I am over 18 years old and have read and agreed to <strong style={{ color: '#00e676' }}>《User Agreement》</strong></span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #00e676 0%, #00b34d 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)',
                marginTop: '6px'
              }}
            >
              {loading ? '⏳ Processing...' : isLogin ? 'Log In' : 'Register Now'}
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
            <span style={{ fontSize: '11px', color: '#71717a' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
          </div>

          <button
            type="button"
            onClick={async () => {
              setError(null)
              setLoading(true)
              const { error } = await signInWithGoogle()
              if (error) setError(error.message)
              else onClose()
              setLoading(false)
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: '1px solid #27272a',
              background: '#ffffff',
              color: '#1f2937',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          {/* Bottom Footer Bar: Customer Service & Demo Mode (Screenshot 4) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid #27272a'
          }}>
            <button
              type="button"
              onClick={() => { onClose(); router.push('/support') }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00e676',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🎧 Customer Service
            </button>

            <button
              type="button"
              onClick={handleDemoClick}
              style={{
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid #00e676',
                color: '#00e676',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🎮 Demo (10k Trial)
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
