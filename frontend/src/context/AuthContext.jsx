import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

/**
 * Holds the admin session, backed by Firebase Authentication. A signed-in user counts as
 * an admin only when an admins/{uid} profile exists; Firebase refreshes the session itself.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(true)
  const [notice, setNotice] = useState('')

  const logout = useCallback((reason = '') => {
    setAdmin(null)
    setNotice(typeof reason === 'string' ? reason : '')
    return authApi.logout().catch(() => {})
  }, [])

  // Restore / track the Firebase session.
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setAdmin(null)
          setChecking(false)
          return
        }
        authApi
          .me()
          .then(({ admin: profile }) => setAdmin(profile))
          .catch(() => {
            setAdmin(null)
            authApi.logout().catch(() => {})
          })
          .finally(() => setChecking(false))
      }),
    [],
  )

  const login = useCallback(async (email, password) => {
    const { admin: profile } = await authApi.login({ email, password })
    setAdmin(profile)
    setNotice('')
    return profile
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: !!admin,
      checking,
      notice,
      login,
      logout,
    }),
    [admin, checking, notice, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
