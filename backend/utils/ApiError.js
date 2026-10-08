/** Error carrying an HTTP status code; handled by errorMiddleware. */
export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details)
  }
  static unauthorized(msg = 'Not authorised') {
    return new ApiError(401, msg)
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg)
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg)
  }
}
