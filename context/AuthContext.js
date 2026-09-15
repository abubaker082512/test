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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Normalize user object so both user.id and user.uid are available
        const normalizedUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
        }
        setUser(normalizedUser)
        await ensureWallet(firebaseUser.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email, password, referrerEmail) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user
      
      // Store user profile and referral data in Firestore
      const userDocRef = doc(db, 'users', newUser.uid)
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        referrer_email: referrerEmail || '',
        created_at: new Date().toISOString()
      }, { merge: true })

      await ensureWallet(newUser.uid)
      return { data: { user: newUser }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const logIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await ensureWallet(userCredential.user.uid)
      return { data: { user: userCredential.user }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
      return { error: null }
    } catch (error) {
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
