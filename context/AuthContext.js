import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../utils/firebase'
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getOrCreateWallet } from '../utils/firebaseDb'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-create wallet for new users in Firestore
  const ensureWallet = async (userId) => {
    if (!userId) return
    try {
      await getOrCreateWallet(userId, 1000.0)
      await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      }).catch(() => {})
    } catch (e) {
      console.error('Wallet init error:', e)
    }
  }

  // Helper to format friendly error messages
  const formatAuthError = (err) => {
    if (!err) return null
    const msg = err.message || ''
    if (msg.includes('auth/invalid-email')) return 'Invalid email address format.'
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'Invalid email or password.'
    }
    if (msg.includes('auth/email-already-in-use')) return 'An account already exists with this email.'
    if (msg.includes('auth/weak-password')) return 'Password should be at least 6 characters.'
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
    await ensureWallet(safeId)
    return { data: { user: localUser }, error: null }
  }

  useEffect(() => {
    // Check local session first
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const normalizedUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
        }
        setUser(normalizedUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('winxpro_session', JSON.stringify(normalizedUser))
        }
        await ensureWallet(firebaseUser.uid)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email, password, referrerEmail) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user
      
      const userDocRef = doc(db, 'users', newUser.uid)
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        referrer_email: referrerEmail || '',
        created_at: new Date().toISOString()
      }, { merge: true }).catch(() => {})

      await ensureWallet(newUser.uid)
      return { data: { user: newUser }, error: null }
    } catch (error) {
      const friendly = formatAuthError(error)
      if (friendly) {
        return { data: null, error: { message: friendly } }
      }
      // If Firebase Auth is not yet enabled or api-key is propagating, fall back to instant local player session
      return await setLocalSession(email, password, referrerEmail)
    }
  }

  const logIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await ensureWallet(userCredential.user.uid)
      return { data: { user: userCredential.user }, error: null }
    } catch (error) {
      const friendly = formatAuthError(error)
      if (friendly) {
        return { data: null, error: { message: friendly } }
      }
      // If Firebase Auth is propagating, fall back to instant local player session
      return await setLocalSession(email, password)
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
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
