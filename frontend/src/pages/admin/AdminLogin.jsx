import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSEO } from '../../hooks/useSEO'
import { images } from '../../data/images'
import { isEmail } from '../../utils/format'
import { showError, showSuccess, showWarning, withLoading } from '../../utils/alerts'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'

export default function AdminLogin() {
  useSEO({ title: 'Admin Login', description: 'Nawa Ayurveda administration.' })
  const { login, isAuthenticated, notice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/dashboard'
  // Already signed in → straight to the dashboard. While a login is being submitted, the submit
  // handler does the redirect itself.
  if (isAuthenticated && !submitting) return <Navigate to={redirectTo} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return // prevent duplicate logins

    // 1. Validate
    const errs = {}
    if (!email.trim()) errs.email = 'Enter your email address.'
    else if (!isEmail(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Enter your password.'
    setErrors(errs)
    if (!email.trim() || !password) {
      await showWarning('Missing Information', 'Please enter your email and password.', { returnFocus: false })
      document.getElementById(errs.email ? 'admin-email' : 'admin-password')?.focus()
      return
    }
    if (errs.email) {
      await showWarning('Invalid Email', 'Please enter a valid email address.', { returnFocus: false })
      document.getElementById('admin-email')?.focus()
      return
    }

    // 2–4. Loading state while the request runs (always closed afterwards)
    setSubmitting(true)
    try {
      await withLoading(() => login(email.trim(), password), { title: 'Signing in…' })
    } catch (err) {
      setSubmitting(false)
      // 6. Error feedback — the form keeps the email; only the password field is focused.
      if (err.status === 401 || err.status === 400) {
        await showError('Login Failed', 'Invalid email or password.', { returnFocus: false })
      } else if (err.status === 429) {
        await showWarning('Too Many Attempts', err.message, { returnFocus: false })
      } else if (err.status === 0 || err.status >= 500) {
        await showError('Something went wrong', 'Unable to connect to the server. Please try again.', { returnFocus: false })
      } else {
        await showError('Login Failed', err.message || 'Invalid email or password.', { returnFocus: false })
      }
      document.getElementById('admin-password')?.select()
      return
    }

    // 6. Success — go to the dashboard straight away; the confirmation closes by itself over it.
    navigate(redirectTo, { replace: true })
    showSuccess('Login Successful', 'Welcome back!', { timer: 1400, showConfirmButton: false })
  }

  return (
    <div className="admin-ui grid min-h-screen bg-white [color-scheme:light] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={images.shirodhara} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="label-caps text-secondary">Nawa Ayurvedic Medical Center</p>
          <p className="mt-4 max-w-md font-serif text-[40px] leading-tight">Care for every guest, managed in one calm place.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-10">
            <Logo variant="login" />
            <p className="label-caps mt-4 text-primary">Admin Panel</p>
          </div>

          <h1 className="font-serif text-[38px] leading-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] text-text-soft">Sign in to manage appointments, articles and services.</p>

          {notice && (
            <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-[13px] font-semibold">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  className={`field !pl-11 ${errors.email ? '!border-red-400' : ''}`}
                  placeholder="admin@nawaayurveda.ae"
                />
              </div>
              {errors.email && <p className="mt-1.5 pl-4 text-[12px] font-medium text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-[13px] font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" aria-hidden="true" />
                <input
                  id="admin-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className={`field !pl-11 !pr-12 ${errors.password ? '!border-red-400' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-text-soft hover:bg-muted"
                >
                  {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 pl-4 text-[12px] font-medium text-red-600">{errors.password}</p>}
            </div>
            <Button type="submit" variant="dark" className="w-full" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-[13px] text-text-soft">
            <a href="/" className="font-semibold text-primary hover:underline">
              &larr; Back to website
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
