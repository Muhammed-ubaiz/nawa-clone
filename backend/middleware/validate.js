import { validationResult } from 'express-validator'
import ApiError from '../utils/ApiError.js'

/** Runs after express-validator chains; turns failures into a 400 with field messages. */
export function validate(req, _res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()
  const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }))
  next(ApiError.badRequest(errors[0]?.message || 'Validation failed', errors))
}
