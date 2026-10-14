/**
 * Data layer for the website and admin panel. The Firebase SDK is large, so it is loaded on demand:
 * pages render straight away and the SDK downloads in parallel with the first data request.
 * The implementation lives in ./firebaseApi.js; this file only forwards calls to it.
 *
 * Every function resolves to { success, data, ... } and rejects with an Error carrying
 * { message, status, fields } (see ./errors).
 */
let impl = null
const load = () => (impl ??= import('./firebaseApi.js'))

/** Wraps each async method of `firebaseApi[name]` so the module is imported on first use. */
const lazy = (name, methods) =>
  Object.fromEntries(methods.map((m) => [m, (...args) => load().then((mod) => mod[name][m](...args))]))

export const authApi = {
  ...lazy('authApi', ['login', 'me', 'logout']),
  /** Subscribes to sign-in / sign-out. Returns an unsubscribe function (usable before the SDK loads). */
  onChange(callback) {
    let unsubscribe = null
    let cancelled = false
    load().then((mod) => {
      if (!cancelled) unsubscribe = mod.authApi.onChange(callback)
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  },
}

export const appointmentsApi = lazy('appointmentsApi', ['create', 'list', 'get', 'update', 'remove'])
export const contactsApi = lazy('contactsApi', ['create', 'list', 'get', 'setStatus', 'remove'])
export const blogsApi = lazy('blogsApi', ['list', 'getBySlug', 'getById', 'create', 'update', 'setPublished', 'remove'])
export const servicesApi = lazy('servicesApi', ['list', 'getBySlug', 'create', 'update', 'setPublished', 'remove'])
export const dashboardApi = lazy('dashboardApi', ['get'])
export const analyticsApi = lazy('analyticsApi', ['overview', 'summary', 'services', 'appointments'])
