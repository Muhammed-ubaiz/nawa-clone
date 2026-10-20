import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSEO } from '../../hooks/useSEO'
import { images } from '../../data/images'
import { isEmail } from '../../utils/format'
import Button from '../../components/common/Button'

export default function AdminLogin() {
  useSEO({ title: 'Admin Login', description: 'Nawa Ayurveda administration.' })
  const { login, isAuthenticated, notice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/dashboard'
  if (isAuthenticated && !submitting) return <Navigate to={redirectTo} replace />

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!isEmail(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Enter your password.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    setServerError('')
    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-legacy grid min-h-screen bg-muted lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={images.shirodhara} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="label-caps text-secondary">Nawa Ayurvedic Medical Centre</p>
          <p className="mt-4 max-w-md font-serif text-[40px] leading-tight">Care for every guest, managed in one calm place.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-10 flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="h-11 w-11" aria-hidden="true">
              <circle cx="20" cy="20" r="20" className="fill-primary" />
              <path d="M20 8c-6 7-8 12-8 16a8 8 0 0 0 16 0c0-4-2-9-8-16Z" className="fill-secondary" />
            </svg>
            <span className="leading-none">
              <span className="block font-serif text-[26px]">Nawa</span>
              <span className="label-caps mt-1 block text-primary">Admin Panel</span>
            </span>
          </div>

          <h1 className="font-serif text-[38px] leading-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] text-text-soft">Sign in to manage appointments, articles and services.</p>

          {(serverError || notice) && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError || notice}</span>
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
