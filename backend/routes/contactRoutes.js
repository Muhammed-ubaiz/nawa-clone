import { Router } from 'express'
import { body, param } from 'express-validator'
import { createContact, deleteContact, getContact, getContacts, updateContact } from '../controllers/contactController.js'
import { protect } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'

const router = Router()
const idRule = param('id').matches(/^[A-Za-z0-9_-]{1,64}$/).withMessage('Invalid message id')

router
  .route('/')
  .post(
    rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }),
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your name'),
    body('email').isString().trim().isEmail().withMessage('Please enter a valid email address'),
    body('phone').optional({ values: 'falsy' }).isString().trim().matches(/^\+?[\d\s()-]{7,20}$/).withMessage('Please enter a valid phone number'),
    body('message').isString().trim().isLength({ min: 10, max: 3000 }).withMessage('Message must be 10–3000 characters'),
    validate,
    createContact,
  )
  .get(protect, getContacts)

router
  .route('/:id')
  .get(protect, idRule, validate, getContact)
  .put(protect, idRule, validate, updateContact)
  .delete(protect, idRule, validate, deleteContact)

export default router
