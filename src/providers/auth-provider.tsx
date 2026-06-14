'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { authApi, type AuthResponse } from '@/lib/api/auth'
import { setToken } from '@/lib/api/token'

interface AuthUser {
  id: string
  email: string
  profileIncomplete: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signIn: (data: AuthResponse) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeUser(token: string): AuthUser {
  const payload = token.split('.')[1]
  const decoded = JSON.parse(
    Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8'),
  )
  return {
    id: decoded.sub,
    email: decoded.email,
    profileIncomplete: decoded.profileIncomplete ?? false,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authApi
      .refresh()
      .then((data) => {
        setToken(data.accessToken)
        setUser(decodeUser(data.accessToken))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const signIn = useCallback((data: AuthResponse) => {
    setToken(data.accessToken)
    setUser(decodeUser(data.accessToken))
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
