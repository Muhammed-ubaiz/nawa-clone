import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import ApiError from '../utils/ApiError.js'

const readToken = (req) => {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

async function resolveAdmin(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  return Admin.findById(String(payload.id))
}

/** Requires a valid JWT belonging to an existing admin. */
export async function protect(req, _res, next) {
  const token = readToken(req)
  if (!token) return next(ApiError.unauthorized('Please log in to continue.'))
  try {
    const admin = await resolveAdmin(token)
    if (!admin) return next(ApiError.unauthorized('Account no longer exists.'))
    req.admin = admin
    next()
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired, please log in again.' : 'Invalid session token.'
    next(ApiError.unauthorized(msg))
  }
}

/** Attaches req.admin when a valid token is present; never blocks the request. */
export async function optionalAuth(req, _res, next) {
  const token = readToken(req)
  if (!token) return next()
  try {
    req.admin = (await resolveAdmin(token)) || undefined
  } catch {
    /* treat as public request */
  }
  next()
}

/** Restricts a route to the given roles (use after `protect`). */
export const authorize =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.admin?.role) ? next() : next(ApiError.forbidden('You do not have permission for this action.'))
