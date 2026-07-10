import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../api/types'
import { fetchCurrentUser, login as apiLogin } from '../api/client'
import { isWalletManuallyDisconnected } from '../wallet/connectedWalletStore'

const TOKEN_KEY = 'hec-token'
const USER_KEY = 'hec-user'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User | ((prev: User | null) => User | null)) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(loadStoredUser)

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((next: User | ((prev: User | null) => User | null)) => {
    setUser((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      if (resolved) {
        localStorage.setItem(USER_KEY, JSON.stringify(resolved))
      }
      return resolved
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return
    try {
      const res = await fetchCurrentUser(storedToken)
      setUser((prev) => {
        const merged = { ...(prev ?? {}), ...res.user } as User
        if (isWalletManuallyDisconnected()) {
          merged.evmAddress = null
        }
        localStorage.setItem(USER_KEY, JSON.stringify(merged))
        return merged
      })
    } catch {
      // 保持本地缓存，避免网络抖动影响已登录状态
    }
  }, [])

  useEffect(() => {
    if (token) {
      void refreshUser()
    }
  }, [token, refreshUser])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, token, login, logout, updateUser, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
