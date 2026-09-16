import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function SignupPage() {
  const router = useRouter()
  const { user, signUp, logIn, signInWithGoogle, toggleDemoMode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referrerEmail, setReferrerEmail] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isLoginTab, setIsLoginTab] = useState(false)

  useEffect(() => {
    if (router.isReady) {
      const refParam = router.query.ref || router.query.referral || router.query.invite || router.query.code
      if (refParam) {
        setReferrerEmail(refParam)
        if (typeof window !== 'undefined') {
          localStorage.setItem('winxpro_referrer', refParam)
        }
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('winxpro_referrer')
        if (cached) setReferrerEmail(cached)
      }

      if (router.query.mode === 'login') {
        setIsLoginTab(true)
      }
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    if (user && !user.isDemo) {
      router.push('/')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isLoginTab && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isLoginTab && !agreed) {
      setError('Please agree to the User Agreement.')
      return
    }

    setLoading(true)
    try {
      const { error } = isLoginTab
        ? await logIn(email, password)
        : await signUp(email, password, referrerEmail)

      if (error) {
        setError(error.message)
      } else {
        router.push(isLoginTab ? '/' : '/wallet?welcome=1')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) setError(error.message)
      else router.push('/')
    } catch (err) {
      setError('Google Sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoMode = () => {
    toggleDemoMode(true)
    router.push('/')
  }

  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>{isLoginTab ? 'Login' : 'Sign Up & Get Rs 100 Bonus'} | WinX Pro</title>
        <meta name="description" content="Sign up at WinX Pro for a free Rs 100 welcome bonus and Rs 600 referral rewards on live casino, slots and sports betting." />
      </Head>

      <NavBar />

      <main style={{ flex: 1, padding: '24px 16px 80px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{
          background: 'linear-gradient(135deg, #18092a 0%, #2a0845 50%, #0d1117 100%)',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 230, 118, 0.1)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{ fontSize: '36px' }}>🎁</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', letterSpacing: '0.3px' }}>
              Welcome Registration Gift
            </div>
            <div style={{ fontSize: '13px', color: '#00e676', fontWeight: 800, marginTop: '2px' }}>
              Instant <span style={{ textDecoration: 'underline' }}>Pi 100.00 Free Cash</span> credited upon signup!
            </div>
            <div style={{ fontSize: '11px', color: '#ffd700', marginTop: '2px', fontWeight: 600 }}>
              💸 Refer friends to earn Pi 155.55 + 5% lifetime rebate
            </div>
          </div>
        </div>

        <div style={{
          background: '#121214',
          borderRadius: '18px',
          border: '1px solid #27272a',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{ display: 'flex', background: '#0a0a0c', borderBottom: '1px solid #27272a' }}>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null) }}
              style={{
                flex: 1,
                padding: '16px',
                background: !isLoginTab ? '#121214' : 'transparent',
                color: !isLoginTab ? '#00e676' : '#71717a',
                border: 'none',
                borderBottom: !isLoginTab ? '3px solid #00e676' : '3px solid transparent',
                fontWeight: 900,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              🔥 Register (Rs 100 Free)
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null) }}
              style={{
                flex: 1,
                padding: '16px',
                background: isLoginTab ? '#121214' : 'transparent',
                color: isLoginTab ? '#00e676' : '#71717a',
                border: 'none',
                borderBottom: isLoginTab ? '3px solid #00e676' : '3px solid transparent',
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
                background: 'rgba(255, 68, 68, 0.12)',
                border: '1px solid #ff4444',
                color: '#ff6666',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  * Email / Phone Number:
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '13px', color: '#71717a', fontSize: '15px' }}>👤</span>
                  <input
                    type="email"
                    placeholder="Enter email address or mobile"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 38px',
                      borderRadius: '10px',
                      border: '1px solid #27272a',
                      background: '#18181b',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  * Enter Password:
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '13px', color: '#71717a', fontSize: '15px' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 38px',
                      borderRadius: '10px',
                      border: '1px solid #27272a',
                      background: '#18181b',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '13px', color: '#71717a', cursor: 'pointer', fontSize: '15px' }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </span>
                </div>
              </div>

              {!isLoginTab && (
                <div>
                  <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    * Confirm Password:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '13px', color: '#71717a', fontSize: '15px' }}>🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        borderRadius: '10px',
                        border: '1px solid #27272a',
                        background: '#18181b',
                        color: '#fff',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {!isLoginTab && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 700 }}>
                      Referral Code / Inviter (Optional):
                    </label>
                    {referrerEmail && (
                      <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 700 }}>
                        ✓ Referral Applied
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '13px', color: '#71717a', fontSize: '15px' }}>🎟️</span>
                    <input
                      type="text"
                      placeholder="Enter referral code or email"
                      value={referrerEmail}
                      onChange={(e) => setReferrerEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        borderRadius: '10px',
                        border: referrerEmail ? '1px solid #00e676' : '1px solid #27272a',
                        background: '#18181b',
                        color: referrerEmail ? '#00e676' : '#fff',
                        fontWeight: referrerEmail ? '700' : 'normal',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {!isLoginTab && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', lineHeight: '1.4' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ accentColor: '#00e676', marginTop: '2px', width: '16px', height: '16px' }}
                  />
                  <span>
                    I confirm I am over 18 years of age and agree to the <strong style={{ color: '#00e676' }}>《Terms & User Agreement》</strong>.
                  </span>
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
                  marginTop: '4px'
                }}
              >
                {loading ? '⏳ Processing...' : isLoginTab ? 'Log In to Account' : '🎉 Register & Claim Rs 100 Free'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
              <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 700 }}>OR SIGN IN WITH</span>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #333',
                background: '#ffffff',
                color: '#1f2937',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
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

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid #27272a'
            }}>
              <Link href="/support" style={{ textDecoration: 'none' }}>
                <span style={{ color: '#00e676', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  🎧 Customer Support
                </span>
              </Link>

              <button
                type="button"
                onClick={handleDemoMode}
                style={{
                  background: 'rgba(0, 230, 118, 0.15)',
                  border: '1px solid #00e676',
                  color: '#00e676',
                  borderRadius: '8px',
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

        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
          <div style={{ background: '#18181c', padding: '12px 8px', borderRadius: '10px', border: '1px solid #27272a' }}>
            <div style={{ fontSize: '20px' }}>⚡</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Instant 100 PKR</div>
            <div style={{ fontSize: '10px', color: '#71717a' }}>No deposit needed</div>
          </div>
          <div style={{ background: '#18181c', padding: '12px 8px', borderRadius: '10px', border: '1px solid #27272a' }}>
            <div style={{ fontSize: '20px' }}>💸</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Rs 600 Referrals</div>
            <div style={{ fontSize: '10px', color: '#71717a' }}>Per active friend</div>
          </div>
          <div style={{ background: '#18181c', padding: '12px 8px', borderRadius: '10px', border: '1px solid #27272a' }}>
            <div style={{ fontSize: '20px' }}>🚀</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Fast Payouts</div>
            <div style={{ fontSize: '10px', color: '#71717a' }}>Easypaisa/Jazzcash</div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
