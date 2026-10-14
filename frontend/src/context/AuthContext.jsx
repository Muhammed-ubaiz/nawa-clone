import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

/**
 * Holds the admin session (Firebase Authentication). Firebase keeps the user signed in across
 * reloads and refreshes tokens itself; on startup the account is checked against admins/{uid}.
 * Signing out in another tab, or losing admin access, ends the session here too.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(true)
  const [notice, setNotice] = useState('')
  const signedIn = useRef(false)

  const logout = useCallback((reason = '') => {
    signedIn.current = false
    authApi.logout()
    setAdmin(null)
    setNotice(reason)
  }, [])

  // Only a rejected account ends the session: a network error keeps the signed-in user (with the
  // profile Firebase already knows) so a refresh of an admin page while offline does not log out.
  useEffect(
    () =>
      authApi.onChange(async (user) => {
        if (!user) {
          if (signedIn.current) logout('Your session has ended. Please log in again.')
          setChecking(false)
          return
        }
        try {
          const { admin: profile } = await authApi.me()
          signedIn.current = true
          setAdmin(profile)
        } catch (err) {
          if (err.status === 401 || err.status === 403) {
            signedIn.current = false
            authApi.logout()
            setAdmin(null)
          } else {
            signedIn.current = true
            setAdmin((a) => a ?? { id: user.uid, name: user.displayName || user.email, email: user.email, role: 'admin' })
          }
        } finally {
          setChecking(false)
        }
      }),
    [logout],
  )

  // Raised by the data layer when Firestore rejects the admin's listeners.
  useEffect(() => {
    const onLogout = (e) => logout(e.detail?.reason || 'Your session has ended. Please log in again.')
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [logout])

  const login = useCallback(async (email, password) => {
    const { admin: profile } = await authApi.login({ email, password })
    signedIn.current = true
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
