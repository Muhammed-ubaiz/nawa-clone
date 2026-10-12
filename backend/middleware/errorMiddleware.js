import fs from 'node:fs/promises'
import multer from 'multer'

export function notFound(req, _res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  err.statusCode = 404
  next(err)
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Clean up an uploaded file if the request failed afterwards.
  if (req.file?.path) fs.unlink(req.file.path).catch(() => {})

  let status = err.statusCode || 500
  let message = err.message || 'Something went wrong'
  let details = err.details

  if (err instanceof multer.MulterError) {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 3 MB or smaller.' : err.message
  } else if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation failed'
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
  } else if (typeof err.code === 'number' && err.details && /^\d+ [A-Z_]+:/.test(err.message || '')) {
    // Firestore / gRPC errors (e.g. "7 PERMISSION_DENIED: ...") — log the detail, answer generically.
    status = err.code === 5 ? 404 : 503
    message = err.code === 5 ? 'Resource not found' : 'The database is temporarily unavailable. Please try again.'
    if (status === 503) console.error(err)
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Malformed JSON body'
  } else if (err.type === 'entity.too.large') {
    status = 413
    message = 'Request body too large'
  }

  if (status >= 500) console.error(err)

  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    ...(details ? { errors: details } : {}),
  })
}
