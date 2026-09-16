import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../utils/firebase'
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut, 
  updateProfile 
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getOrCreateWallet } from '../utils/firebaseDb'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-create wallet for new users in Firestore (non-blocking in background)
  const ensureWallet = (userId) => {
    if (!userId) return
    Promise.resolve().then(async () => {
      try {
        await Promise.race([
          getOrCreateWallet(userId, 1000.0),
          new Promise(r => setTimeout(r, 600))
        ])
        fetch('/api/wallet/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        }).catch(() => {})
      } catch (e) {
        console.error('Wallet init error:', e)
      }
    })
  }

  // Helper to format friendly error messages
  const formatAuthError = (err) => {
    if (!err) return null
    const msg = err.message || err.code || ''
    if (msg.includes('auth/invalid-email')) return 'Invalid email address format.'
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'Invalid email or password.'
    }
    if (msg.includes('auth/email-already-in-use')) return 'An account already exists with this email.'
    if (msg.includes('auth/weak-password')) return 'Password should be at least 6 characters.'
    if (msg.includes('auth/popup-closed-by-user')) return 'Google Sign-in was cancelled.'
    if (msg.includes('auth/unauthorized-domain')) return 'Domain not authorized in Firebase Console (Add winxpro.com.pk & www.winxpro.com.pk in Firebase Console > Authentication > Settings > Authorized domains).'
    return null
  }

  // Create or load local fallback player session
  const setLocalSession = async (email, password, referrerEmail = '') => {
    const safeId = 'user_' + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24)
    const localUser = {
      id: safeId,
      uid: safeId,
      email: email.toLowerCase(),
      displayName: email.split('@')[0],
      isLocal: true
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('winxpro_session', JSON.stringify(localUser))
    }
    setUser(localUser)
    ensureWallet(safeId)
    return { data: { user: localUser }, error: null }
  }

  useEffect(() => {
    // 1. Check local session for instantaneous 0ms UI load
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('winxpro_session')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setUser(parsed)
          ensureWallet(parsed.uid || parsed.id)
        } catch (e) {}
      }
    }

    // 2. Check Google Redirect Sign-In result (for mobile browsers / WebViews)
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        const gUser = result.user
        const normalizedUser = {
          ...gUser,
          id: gUser.uid,
          uid: gUser.uid,
          email: gUser.email,
          displayName: gUser.displayName || gUser.email?.split('@')[0],
          photoURL: gUser.photoURL || ''
        }
        setUser(normalizedUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
        }
        ensureWallet(gUser.uid)
      }
    }).catch(() => {})

    // 3. Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const normalizedUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL || ''
        }
        setUser(normalizedUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
        }
        ensureWallet(firebaseUser.uid)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email, password, referrerEmail) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user
      const normalizedUser = {
        ...newUser,
        id: newUser.uid,
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName || newUser.email?.split('@')[0]
      }
      
      setUser(normalizedUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
      }

      // Background non-blocking profile sync
      const userDocRef = doc(db, 'users', newUser.uid)
      setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        referrer_email: referrerEmail || '',
        created_at: new Date().toISOString()
      }, { merge: true }).catch(() => {})

      ensureWallet(newUser.uid)
      return { data: { user: normalizedUser }, error: null }
    } catch (error) {
      const friendly = formatAuthError(error)
      if (friendly) {
        return { data: null, error: { message: friendly } }
      }
      return await setLocalSession(email, password, referrerEmail)
    }
  }

  const logIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const loggedUser = userCredential.user
      const normalizedUser = {
        ...loggedUser,
        id: loggedUser.uid,
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName || loggedUser.email?.split('@')[0]
      }
      
      setUser(normalizedUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
      }

      ensureWallet(loggedUser.uid)
      return { data: { user: normalizedUser }, error: null }
    } catch (error) {
      const friendly = formatAuthError(error)
      if (friendly) {
        return { data: null, error: { message: friendly } }
      }
      return await setLocalSession(email, password)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      let gUser = null
      
      try {
        const userCredential = await signInWithPopup(auth, provider)
        gUser = userCredential.user
      } catch (popupErr) {
        // If popup is blocked (mobile WebView / browser popup blocker), fallback to redirect
        if (
          popupErr.code === 'auth/popup-blocked' || 
          popupErr.code === 'auth/cancelled-popup-request' || 
          popupErr.message?.includes('popup')
        ) {
          await signInWithRedirect(auth, provider)
          return { data: null, error: null }
        }
        throw popupErr
      }

      if (gUser) {
        const normalizedUser = {
          ...gUser,
          id: gUser.uid,
          uid: gUser.uid,
          email: gUser.email,
          displayName: gUser.displayName || gUser.email?.split('@')[0],
          photoURL: gUser.photoURL || ''
        }

        setUser(normalizedUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
        }

        // Background non-blocking profile sync
        const userDocRef = doc(db, 'users', gUser.uid)
        setDoc(userDocRef, {
          id: gUser.uid,
          email: gUser.email,
          displayName: normalizedUser.displayName,
          photoURL: gUser.photoURL || '',
          updated_at: new Date().toISOString()
        }, { merge: true }).catch(() => {})

        ensureWallet(gUser.uid)
        return { data: { user: normalizedUser }, error: null }
      }
      return { data: null, error: null }
    } catch (error) {
      const friendly = formatAuthError(error)
      return { data: null, error: { message: friendly || error.message || 'Google Sign-in failed' } }
    }
  }

  const logOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('winxpro_session')
      }
      await signOut(auth).catch(() => {})
      setUser(null)
      return { error: null }
    } catch (error) {
      setUser(null)
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
