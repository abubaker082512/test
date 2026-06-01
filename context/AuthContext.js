import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    return supabase.auth.signUp({ email, password })
  }

  const logIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const logOut = async () => {
    return supabase.auth.signOut()
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
