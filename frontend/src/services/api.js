import axios from 'axios'

/**
 * Backend base URL, set per environment with VITE_API_URL (see .env.example). Accepts the server
 * origin or its /api path, with or without a trailing slash. Only the dev server falls back to the
 * local backend; production builds must set it (.env.production — vite.config.js enforces this).
 */
const DEV_FALLBACK = import.meta.env.DEV ? 'http://localhost:5000' : ''
const RAW_API_URL = (import.meta.env.VITE_API_URL || DEV_FALLBACK).trim().replace(/\/+$/, '')
export const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`

/** Origin of the API server, used to build absolute URLs for uploaded images. */
export const API_ORIGIN = new URL(API_URL).origin

const TOKEN_KEY = 'nawa_admin_auth'

/** Token storage. Kept in one place so the strategy can change (e.g. to httpOnly cookies). */
export const tokenStore = {
  get() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (data.expiresAt && Date.now() >= data.expiresAt) {
        localStorage.removeItem(TOKEN_KEY)
        return null
      }
      return data
    } catch {
      return null
    }
  },
  set(data) {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
    } catch {
      /* storage unavailable (private mode) — session only lives in memory */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

// Attach the JWT to every request when the admin is logged in.
api.interceptors.request.use((config) => {
  const auth = tokenStore.get()
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

const DEFAULT_MESSAGES = {
  400: 'Please check the information you entered.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'The requested item could not be found.',
  409: 'This item already exists.',
  413: 'The file is too large.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
}

/**
 * Normalises every failure into an Error with:
 *   message  — human-readable text safe to show users
 *   status   — HTTP status (0 for network errors)
 *   fields   — { fieldName: message } from server validation, if any
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    const status = error.response?.status ?? 0
    const data = error.response?.data || {}
    let message = data.message
    if (!message || (status >= 500 && !import.meta.env.DEV)) {
      message =
        status === 0
          ? 'Cannot reach the server. Please check your connection and try again.'
          : DEFAULT_MESSAGES[status] || DEFAULT_MESSAGES[status >= 500 ? 500 : 400]
    }

    // A rejected token on an authenticated request ends the admin session.
    if (status === 401 && error.config?.headers?.Authorization) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: message } }))
    }

    const err = new Error(message)
    err.status = status
    err.fields = Object.fromEntries((data.errors || []).map((e) => [e.field, e.message]))
    return Promise.reject(err)
  },
)

/** Builds multipart form data, JSON-encoding arrays/objects. */
export function toFormData(values) {
  const fd = new FormData()
  Object.entries(values).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (v instanceof File) fd.append(k, v)
    else if (Array.isArray(v) || (typeof v === 'object' && !(v instanceof Date))) fd.append(k, JSON.stringify(v))
    else fd.append(k, String(v))
  })
  return fd
}

const data = (res) => res.data

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(data),
  me: () => api.get('/auth/me').then(data),
}

export const appointmentsApi = {
  create: (payload) => api.post('/appointments', payload).then(data),
  list: (params) => api.get('/appointments', { params }).then(data),
  get: (id) => api.get(`/appointments/${id}`).then(data),
  update: (id, payload) => api.put(`/appointments/${id}`, payload).then(data),
  remove: (id) => api.delete(`/appointments/${id}`).then(data),
}

export const blogsApi = {
  list: (params, config) => api.get('/blogs', { params, ...config }).then(data),
  getBySlug: (slug, config) => api.get(`/blogs/${encodeURIComponent(slug)}`, config).then(data),
  getById: (id) => api.get(`/blogs/id/${id}`).then(data),
  create: (values) => api.post('/blogs', toFormData(values)).then(data),
  update: (id, values) => api.put(`/blogs/${id}`, toFormData(values)).then(data),
  setPublished: (id, published) => api.put(`/blogs/${id}`, { published }).then(data),
  remove: (id) => api.delete(`/blogs/${id}`).then(data),
}

export const servicesApi = {
  list: (params, config) => api.get('/services', { params, ...config }).then(data),
  getBySlug: (slug, config) => api.get(`/services/${encodeURIComponent(slug)}`, config).then(data),
  create: (values) => api.post('/services', toFormData(values)).then(data),
  update: (id, values) => api.put(`/services/${id}`, toFormData(values)).then(data),
  setPublished: (id, published) => api.put(`/services/${id}`, { published }).then(data),
  remove: (id) => api.delete(`/services/${id}`).then(data),
}

export const contactsApi = {
  create: (payload) => api.post('/contacts', payload).then(data),
  list: (params) => api.get('/contacts', { params }).then(data),
  get: (id) => api.get(`/contacts/${id}`).then(data),
  setStatus: (id, status) => api.put(`/contacts/${id}`, { status }).then(data),
  remove: (id) => api.delete(`/contacts/${id}`).then(data),
}

export const dashboardApi = {
  get: () => api.get('/dashboard').then(data),
}

/**
 * Analytics. `filter` = { period, month, year, from, to, basis }.
 * Period-specific endpoints mirror the API: /today, /week, /month, /year, /custom.
 */
const periodParams = ({ period, month, year, from, to, basis }) => {
  const p = { basis }
  if (period === 'month') Object.assign(p, { month, year })
  if (period === 'year') Object.assign(p, { year })
  if (period === 'custom') Object.assign(p, { from, to })
  return p
}

export const analyticsApi = {
  overview: (config) => api.get('/analytics/overview', config).then(data),
  summary: (filter, config) => api.get(`/analytics/${filter.period}`, { params: periodParams(filter), ...config }).then(data),
  services: (filter, config) => api.get('/analytics/services', { params: { period: filter.period, ...periodParams(filter) }, ...config }).then(data),
  /**
   * Appointment report by scheduled date.
   * params: { period: all|today|month|year|custom, month, year, from, to, search, status, page, limit, export }
   */
  appointments: (params, config) => api.get('/analytics/appointments', { params, timeout: params?.export ? 60000 : 20000, ...config }).then(data),
}

export default api
