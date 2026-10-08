import ApiError from '../utils/ApiError.js'

/**
 * Minimal in-memory fixed-window rate limiter (per IP + route).
 * Good enough for a single instance; use a shared store (Redis) if you scale out.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many requests, please try again later.' } = {}) {
  const hits = new Map()

  setInterval(() => {
    const now = Date.now()
    for (const [key, v] of hits) if (v.reset <= now) hits.delete(key)
  }, windowMs).unref()

  return (req, _res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs })
      return next()
    }
    entry.count += 1
    if (entry.count > max) return next(new ApiError(429, message))
    next()
  }
}
