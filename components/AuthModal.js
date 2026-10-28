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
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

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
        if (!isLogin) {
          // Trigger the Registration Successful screen (Screenshot 4)
          setRegistrationSuccess(true)
        } else {
          onClose()
        }
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

  const handleModalClose = () => {
    setRegistrationSuccess(false)
    setError(null)
    onClose()
  }

  // SCREENSHOT 4: Registration Successful Modal
  if (registrationSuccess) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}>
        <div style={{
          background: 'rgba(18, 24, 34, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '380px',
          padding: '28px 20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 230, 91, 0.2)',
          textAlign: 'center',
          position: 'relative',
          animation: 'modal-pop 0.25s ease-out'
        }}>
          {/* Close X */}
          <button 
            onClick={handleModalClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>

          {/* Green checkmark circle glow */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 230, 91, 0.15)',
            border: '2px solid #00E65B',
            boxShadow: '0 0 24px rgba(0, 230, 91, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#00E65B',
            fontSize: '28px',
            fontWeight: 900
          }}>
            ✓
          </div>

          <h3 style={{
            fontSize: '20px',
            fontWeight: 900,
            color: '#00E65B',
            letterSpacing: '0.3px',
            marginBottom: '8px'
          }}>
            🎉 Registration Successful! 🎉
          </h3>

          <p style={{
            fontSize: '13px',
            color: '#94A3B8',
            marginBottom: '24px',
            lineHeight: '1.4'
          }}>
            Invite your friends to join and claim <strong style={{ color: '#fff' }}>Rs 600</strong>
          </p>

          {/* Action Buttons matching Screenshot 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Invite Friends Button */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                top: '-7px',
                right: '12px',
                background: 'linear-gradient(90deg, #FF9800 0%, #FF5722 100%)',
                color: '#fff',
                fontSize: '8.5px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(255, 87, 34, 0.4)',
                zIndex: 10
              }}>
                HOT
              </span>

              <button
                onClick={() => { handleModalClose(); router.push('/invite') }}
                style={{
                  width: '100%',
                  padding: '12px 8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 230, 91, 0.4)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>🎁</span> Invite friends
              </button>
            </div>

            {/* Deposit Now Button */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                top: '-7px',
                right: '10px',
                background: '#00E65B',
                color: '#07090D',
                fontSize: '8.5px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(0, 230, 91, 0.4)',
                zIndex: 10
              }}>
                +Rs 8888
              </span>

              <button
                onClick={() => { handleModalClose(); router.push('/wallet') }}
                style={{
                  width: '100%',
                  padding: '12px 8px',
                  borderRadius: '12px',
                  background: 'var(--cta-claim)',
                  color: '#07090D',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 230, 91, 0.35)'
                }}
              >
                <span>👛</span> Deposit Now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Login / Register form in Obsidian Slate Glass
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: 'rgba(18, 24, 34, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 230, 91, 0.15)',
        animation: 'modal-pop 0.25s ease-out'
      }}>
        {/* Top Promo Banner */}
        <div style={{
          background: 'rgba(20, 26, 36, 0.95)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎁</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                Invite friends & earn <span style={{ color: '#00E65B', background: 'rgba(0, 230, 91, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>Rs 600</span>
              </div>
              <div style={{ fontSize: '10px', color: '#FFB800', fontWeight: 700 }}>
                Sign up & get <span style={{ color: '#00E65B', background: 'rgba(0, 230, 91, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>Rs 100</span> welcome bonus
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle: Register | Login */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(11, 14, 20, 0.6)' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null) }}
            style={{
              flex: 1,
              padding: '14px',
              background: !isLogin ? 'rgba(20, 26, 36, 0.7)' : 'transparent',
              color: !isLogin ? '#00E65B' : '#64748B',
              border: 'none',
              borderBottom: !isLogin ? '2.5px solid #00E65B' : '2.5px solid transparent',
              fontWeight: 800,
              fontSize: '14px',
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
              background: isLogin ? 'rgba(20, 26, 36, 0.7)' : 'transparent',
              color: isLogin ? '#00E65B' : '#64748B',
              border: 'none',
              borderBottom: isLogin ? '2.5px solid #00E65B' : '2.5px solid transparent',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid #FF3366',
              color: '#FF3366',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Email / Username Input */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                Account Email or Mobile
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or 03xxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  background: 'rgba(20, 26, 36, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(20, 26, 36, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(20, 26, 36, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
            )}

            {/* Referrer code (Register only) */}
            {!isLogin && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Referral / Invitation Code (Optional)
                </label>
                <input
                  type="text"
                  value={referrerEmail}
                  onChange={(e) => setReferrerEmail(e.target.value)}
                  placeholder="Referral Code or Inviter Email"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(20, 26, 36, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--cta-claim)',
                color: '#07090D',
                border: 'none',
                fontSize: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 4px 16px rgba(0, 230, 91, 0.35)'
              }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Log In to Account' : 'Create Free Account'}
            </button>
          </form>

          {/* Bottom Footer Options */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <button
              type="button"
              onClick={() => { onClose(); router.push('/support') }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '12px',
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
                background: 'rgba(0, 230, 91, 0.12)',
                border: '1px solid rgba(0, 230, 91, 0.4)',
                color: '#00E65B',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
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
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
