import { API_ORIGIN } from '../services/api'

/** Resolves an image value from the API: uploaded files are served by the backend. */
export const mediaUrl = (src) => {
  if (!src) return ''
  if (src.startsWith('/uploads/')) return `${API_ORIGIN}${src}`
  return src
}

export const formatDate = (iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', opts)
}

export const formatShortDate = (iso) => formatDate(iso, { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
export const isPhone = (v = '') => /^\+?[\d\s()-]{7,20}$/.test(v.trim())
