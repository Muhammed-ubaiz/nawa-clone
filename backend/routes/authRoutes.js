import { Router } from 'express'
import { body } from 'express-validator'
import { login, me } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please wait 15 minutes and try again.' }),
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().isLength({ min: 1, max: 200 }).withMessage('Password is required'),
  validate,
  login,
)

router.get('/me', protect, me)

export default router
