import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  authApi,
  getStoredUser,
  getToken,
  registerUnauthorizedHandler,
  setStoredUser,
  setToken,
  type AuthUser,
} from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getToken()) && !getStoredUser())

  const logout = useCallback(() => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => setUser(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function refresh() {
      if (!getToken()) {
        setIsLoading(false)
        return
      }
      try {
        const { data } = await authApi.me()
        if (cancelled) return
        const next: AuthUser = { username: data.username, role: data.role }
        setStoredUser(next)
        setUser(next)
      } catch {
        if (!cancelled) {
          setToken(null)
          setStoredUser(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    refresh()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    setToken(data.token)
    const next: AuthUser = { username: data.username, role: data.role }
    setStoredUser(next)
    setUser(next)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
