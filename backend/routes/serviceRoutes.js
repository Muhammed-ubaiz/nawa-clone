import { Router } from 'express'
import { body, param } from 'express-validator'
import { createService, deleteService, getServiceBySlug, getServices, updateService } from '../controllers/serviceController.js'
import { optionalAuth, protect } from '../middleware/authMiddleware.js'
import { uploadImage, verifyImageSignature } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = Router()
const idRule = param('id').matches(/^[A-Za-z0-9_-]{1,64}$/).withMessage('Invalid service id')

const serviceRules = (optional = false) => {
  const req = (chain) => (optional ? chain.optional() : chain)
  return [
    req(body('name')).isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2–120 characters'),
    body('shortDescription').optional().isString().trim().isLength({ max: 300 }).withMessage('Short description must be 300 characters or fewer'),
    body('description').optional().isString().trim().isLength({ max: 5000 }),
    body('slug').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
    body('order').optional().isNumeric(),
    body('published').optional().isIn([true, false, 'true', 'false', '1', '0', 'on']),
  ]
}

router.get('/', optionalAuth, getServices)
router.post('/', protect, uploadImage('image'), verifyImageSignature, ...serviceRules(false), validate, createService)
router.get('/:slug', optionalAuth, getServiceBySlug)
router.put('/:id', protect, uploadImage('image'), verifyImageSignature, idRule, ...serviceRules(true), validate, updateService)
router.delete('/:id', protect, idRule, validate, deleteService)

export default router
