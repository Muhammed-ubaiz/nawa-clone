import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  getAppointments,
  updateAppointment,
} from '../controllers/appointmentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { APPOINTMENT_STATUSES } from '../models/Appointment.js'

const router = Router()
const idRule = param('id').matches(/^[A-Za-z0-9_-]{1,64}$/).withMessage('Invalid appointment id')

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Shared field rules; `optional` relaxes required fields for updates. */
const fieldRules = (optional = false) => {
  const req = (chain) => (optional ? chain.optional() : chain)
  return [
    req(body('name')).isString().trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your full name'),
    req(body('phone')).isString().trim().matches(/^\+?[\d\s()-]{7,20}$/).withMessage('Please enter a valid phone number'),
    body('email').optional({ values: 'falsy' }).isString().trim().isEmail().withMessage('Please enter a valid email address'),
    req(body('date'))
      .isISO8601()
      .withMessage('Please choose a valid date')
      .bail()
      .custom((v) => optional || new Date(v) >= startOfToday())
      .withMessage('Please choose a date from today onward'),
    body('time').optional({ values: 'falsy' }).isString().trim().isLength({ max: 20 }),
    req(body('service')).isString().trim().isLength({ min: 2, max: 120 }).withMessage('Please select a service'),
    body('message').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }).withMessage('Message is too long'),
  ]
}

router
  .route('/')
  .post(rateLimit({ windowMs: 10 * 60 * 1000, max: 15 }), ...fieldRules(false), validate, createAppointment)
  .get(protect, getAppointments)

router
  .route('/:id')
  .get(protect, idRule, validate, getAppointment)
  .put(
    protect,
    idRule,
    ...fieldRules(true),
    body('status').optional().isIn(APPOINTMENT_STATUSES).withMessage(`Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`),
    validate,
    updateAppointment,
  )
  .delete(protect, idRule, validate, deleteAppointment)

export default router
