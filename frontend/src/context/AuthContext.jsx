import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, tokenStore } from '../services/api'

const AuthContext = createContext(null)

/**
 * Holds the admin session. The token is verified with the API on startup,
 * expires automatically, and is cleared whenever the API answers 401.
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => tokenStore.get())
  const [checking, setChecking] = useState(() => !!tokenStore.get())
  const [notice, setNotice] = useState('')

  const logout = useCallback((reason = '') => {
    tokenStore.clear()
    setAuth(null)
    setNotice(reason)
  }, [])

  // Verify a stored token once on load.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .me()
      .then(({ admin }) => setAuth((a) => (a ? { ...a, admin } : a)))
      .catch(() => logout())
      .finally(() => setChecking(false))
  }, [logout])

  // React to 401s raised by the Axios interceptor.
  useEffect(() => {
    const onLogout = (e) => logout(e.detail?.reason || 'Your session has ended. Please log in again.')
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [logout])

  // Log out exactly when the token expires.
  useEffect(() => {
    if (!auth?.expiresAt) return
    const ms = auth.expiresAt - Date.now()
    const t = setTimeout(() => logout('Your session expired. Please log in again.'), Math.max(0, Math.min(ms, 2 ** 31 - 1)))
    return () => clearTimeout(t)
  }, [auth, logout])

  const login = useCallback(async (email, password) => {
    const { token, expiresAt, admin } = await authApi.login({ email, password })
    const next = { token, expiresAt, admin }
    tokenStore.set(next)
    setAuth(next)
    setNotice('')
    return admin
  }, [])

  const value = useMemo(
    () => ({
      admin: auth?.admin ?? null,
      isAuthenticated: !!auth?.token,
      checking,
      notice,
      login,
      logout,
    }),
    [auth, checking, notice, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
