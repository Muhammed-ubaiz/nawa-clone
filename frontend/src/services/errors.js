/**
 * Every data-layer failure becomes an Error with:
 *   message  — human-readable text safe to show users
 *   status   — HTTP-like status the pages already understand (0 = network, 400, 401, 403, 404, 429, 500)
 *   fields   — { fieldName: message } for validation failures
 */
export function apiError(status, message, fields = {}) {
  const err = new Error(message)
  err.status = status
  err.fields = fields
  return err
}

export const badRequest = (message, fields) => apiError(400, message, fields)
export const notFound = (message = 'The requested item could not be found.') => apiError(404, message)

const AUTH_CODES = {
  'auth/invalid-credential': [401, 'Invalid email or password.'],
  'auth/invalid-login-credentials': [401, 'Invalid email or password.'],
  'auth/wrong-password': [401, 'Invalid email or password.'],
  'auth/user-not-found': [401, 'Invalid email or password.'],
  'auth/invalid-email': [400, 'Enter a valid email address.'],
  'auth/user-disabled': [403, 'This account has been disabled.'],
  'auth/too-many-requests': [429, 'Too many login attempts. Please wait a few minutes and try again.'],
  'auth/network-request-failed': [0, 'Cannot reach the server. Please check your connection and try again.'],
}

const FIRESTORE_CODES = {
  'permission-denied': [403, 'You do not have permission to do that.'],
  unauthenticated: [401, 'Your session has expired. Please log in again.'],
  'not-found': [404, 'The requested item could not be found.'],
  'invalid-argument': [400, 'Please check the information you entered.'],
  'failed-precondition': [400, 'Please check the information you entered.'],
  'resource-exhausted': [429, 'Too many requests. Please wait a moment and try again.'],
  unavailable: [0, 'Cannot reach the server. Please check your connection and try again.'],
  'deadline-exceeded': [0, 'The server took too long to respond. Please try again.'],
}

/** Converts a Firebase (or unknown) error into an apiError; errors that already are one pass through. */
export function toApiError(err) {
  if (typeof err?.status === 'number') return err
  const code = String(err?.code || '')
  const known = AUTH_CODES[code] || FIRESTORE_CODES[code.replace(/^firestore\//, '')]
  if (known) return apiError(known[0], known[1])
  if (import.meta.env.DEV) console.error(err)
  return apiError(500, 'Something went wrong on our side. Please try again shortly.')
}
