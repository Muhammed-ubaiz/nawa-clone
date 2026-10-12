import Blog from '../models/Blog.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex, uniqueSlug } from '../utils/slugify.js'
import { removeUpload, toPublicPath } from '../utils/files.js'

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

/**
 * GET /api/blogs?category=&search=&page=&limit=&all=
 * Public: published posts only. Admins can pass all=true to include drafts.
 */
export async function getBlogs(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12))
  const includeDrafts = req.admin && toBool(req.query.all)

  const filter = includeDrafts ? {} : { published: true }
  const category = String(req.query.category || '').trim()
  if (category && category !== 'All') filter.category = category
  const search = String(req.query.search || '').trim()
  if (search) filter.title = new RegExp(escapeRegex(search.slice(0, 80)), 'i')

  const [items, total, categories] = await Promise.all([
    Blog.find(filter)
      .select(includeDrafts ? '' : '-content')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Blog.countDocuments(filter),
    Blog.distinct('category', includeDrafts ? {} : { published: true }),
  ])

  res.json({
    success: true,
    data: items,
    categories: categories.filter(Boolean).sort(),
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
  const base = { published: true, _id: { $ne: blog._id } }
  const sameCategory = await Blog.find({ ...base, category: blog.category }).select('-content').sort({ createdAt: -1 }).limit(3)
  const others =
    sameCategory.length < 3
      ? await Blog.find({ ...base, category: { $ne: blog.category } })
          .select('-content')
          .sort({ createdAt: -1 })
          .limit(3 - sameCategory.length)
      : []

  res.json({ success: true, data: blog, related: [...sameCategory, ...others] })
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
  if (toBool(req.body.removeImage) && !req.file) data.featuredImage = undefined

  Object.assign(blog, data)
  await blog.save()
  if (oldImage && oldImage !== blog.featuredImage) await removeUpload(oldImage)

  res.json({ success: true, message: 'Article updated', data: blog })
}

/** DELETE /api/blogs/:id (admin) */
export async function deleteBlog(req, res) {
  const blog = await Blog.findByIdAndDelete(req.params.id)
  if (!blog) throw ApiError.notFound('Article not found')
  await removeUpload(blog.featuredImage)
  res.json({ success: true, message: 'Article deleted' })
}
