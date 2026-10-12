import Blog from '../models/Blog.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex, uniqueSlug } from '../utils/slugify.js'
import { removeUpload, toPublicPath } from '../utils/files.js'
import { omit, paginate, sortBy } from '../utils/query.js'

const toBool = (v) => v === true || v === 'true' || v === '1' || v === 'on'

/** Builds the update object from a (possibly multipart) body. */
function readBody(body) {
  const data = {}
  for (const k of ['title', 'excerpt', 'content', 'category', 'author']) {
    if (body[k] !== undefined) data[k] = String(body[k])
  }
  if (body.published !== undefined) data.published = toBool(body.published)
  // An external image URL may be supplied instead of an upload.
  if (typeof body.featuredImage === 'string' && /^https?:\/\//.test(body.featuredImage)) data.featuredImage = body.featuredImage
  return data
}

/** List rows without the article body (readTime is still included, computed beforehand). */
const summary = (blog) => omit(blog, ['content'])

/**
 * GET /api/blogs?category=&search=&page=&limit=&all=
 * Public: published posts only. Admins can pass all=true to include drafts.
 */
export async function getBlogs(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12))
  const includeDrafts = req.admin && toBool(req.query.all)

  const visible = await Blog.find(includeDrafts ? {} : { published: true })
  const categories = [...new Set(visible.map((b) => b.category).filter(Boolean))].sort()

  let items = visible
  const category = String(req.query.category || '').trim()
  if (category && category !== 'All') items = items.filter((b) => b.category === category)
  const search = String(req.query.search || '').trim()
  if (search) {
    const rx = new RegExp(escapeRegex(search.slice(0, 80)), 'i')
    items = items.filter((b) => rx.test(b.title || ''))
  }
  items = sortBy(items, { createdAt: -1 })
  const total = items.length
  const pageItems = paginate(items, page, limit)

  res.json({
    success: true,
    data: includeDrafts ? pageItems : pageItems.map(summary),
    categories,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  })
}

/** GET /api/blogs/:slug — public, published only (admins may preview drafts). */
export async function getBlogBySlug(req, res) {
  const filter = { slug: String(req.params.slug).toLowerCase() }
  if (!req.admin) filter.published = true
  const blog = await Blog.findOne(filter)
  if (!blog) throw ApiError.notFound('Article not found')

  // Prefer same-category posts, then fill up with the most recent others.
  const others = sortBy((await Blog.find({ published: true })).filter((b) => b._id !== blog._id), { createdAt: -1 })
  const sameCategory = others.filter((b) => b.category === blog.category).slice(0, 3)
  const fill = sameCategory.length < 3 ? others.filter((b) => b.category !== blog.category).slice(0, 3 - sameCategory.length) : []

  res.json({ success: true, data: blog, related: [...sameCategory, ...fill].map(summary) })
}

/** GET /api/blogs/id/:id (admin) — used by the edit form. */
export async function getBlogById(req, res) {
  const blog = await Blog.findById(req.params.id)
  if (!blog) throw ApiError.notFound('Article not found')
  res.json({ success: true, data: blog })
}

/** POST /api/blogs (admin, multipart: featuredImage file optional) */
export async function createBlog(req, res) {
  const data = readBody(req.body)
  data.slug = await uniqueSlug(Blog, req.body.slug || data.title)
  if (req.file) data.featuredImage = toPublicPath(req.file)
  const blog = await Blog.create(data)
  res.status(201).json({ success: true, message: 'Article created', data: blog })
}

/** PUT /api/blogs/:id (admin) */
export async function updateBlog(req, res) {
  const blog = await Blog.findById(req.params.id)
  if (!blog) throw ApiError.notFound('Article not found')

  const data = readBody(req.body)
  // Slugs stay stable (published URLs) unless the admin edits the slug explicitly.
  const newSlug = String(req.body.slug || '').trim()
  if (newSlug && newSlug !== blog.slug) data.slug = await uniqueSlug(Blog, newSlug, blog._id)

  const oldImage = blog.featuredImage
  if (req.file) data.featuredImage = toPublicPath(req.file)
  if (toBool(req.body.removeImage) && !req.file) data.featuredImage = undefined // unset the field

  const updated = await Blog.update(blog._id, data)
  if (!updated) throw ApiError.notFound('Article not found')
  if (oldImage && oldImage !== updated.featuredImage) await removeUpload(oldImage)

  res.json({ success: true, message: 'Article updated', data: updated })
}

/** DELETE /api/blogs/:id (admin) */
export async function deleteBlog(req, res) {
  const blog = await Blog.delete(req.params.id)
  if (!blog) throw ApiError.notFound('Article not found')
  await removeUpload(blog.featuredImage)
  res.json({ success: true, message: 'Article deleted' })
}
