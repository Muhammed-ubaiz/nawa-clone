import { Router } from 'express'
import { body, param } from 'express-validator'
import { createBlog, deleteBlog, getBlogById, getBlogBySlug, getBlogs, updateBlog } from '../controllers/blogController.js'
import { optionalAuth, protect } from '../middleware/authMiddleware.js'
import { uploadImage, verifyImageSignature } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = Router()
const idRule = param('id').matches(/^[A-Za-z0-9_-]{1,64}$/).withMessage('Invalid article id')

const blogRules = (optional = false) => {
  const req = (chain) => (optional ? chain.optional() : chain)
  return [
    req(body('title')).isString().trim().isLength({ min: 3, max: 180 }).withMessage('Title must be 3–180 characters'),
    req(body('content')).isString().trim().isLength({ min: 20 }).withMessage('Content must be at least 20 characters'),
    body('excerpt').optional().isString().trim().isLength({ max: 400 }).withMessage('Excerpt must be 400 characters or fewer'),
    body('category').optional().isString().trim().isLength({ max: 60 }),
    body('author').optional().isString().trim().isLength({ max: 80 }),
    body('slug').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
    body('published').optional().isIn([true, false, 'true', 'false', '1', '0', 'on']).withMessage('Invalid published value'),
  ]
}

router.get('/', optionalAuth, getBlogs)
router.post('/', protect, uploadImage('featuredImage'), verifyImageSignature, ...blogRules(false), validate, createBlog)

// Must be declared before '/:slug'
router.get('/id/:id', protect, idRule, validate, getBlogById)

router.get('/:slug', optionalAuth, getBlogBySlug)
router.put('/:id', protect, uploadImage('featuredImage'), verifyImageSignature, idRule, ...blogRules(true), validate, updateBlog)
router.delete('/:id', protect, idRule, validate, deleteBlog)

export default router
