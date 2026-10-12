import Service from '../models/Service.js'
import ApiError from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'
import { removeUpload, toPublicPath } from '../utils/files.js'

const toBool = (v) => v === true || v === 'true' || v === '1' || v === 'on'

/** Arrays arrive as JSON strings in multipart requests and as arrays in JSON requests. */
function parseArray(value) {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw ApiError.badRequest('benefits and process must be JSON arrays')
  }
}

function readBody(body) {
  const data = {}
  for (const k of ['name', 'shortDescription', 'description']) {
    if (body[k] !== undefined) data[k] = String(body[k])
  }
  if (body.published !== undefined) data.published = toBool(body.published)
  if (body.order !== undefined) data.order = Number(body.order) || 0
  if (typeof body.image === 'string' && /^https?:\/\//.test(body.image)) data.image = body.image

  const benefits = parseArray(body.benefits)
  if (benefits) data.benefits = benefits.map((b) => String(b).trim()).filter(Boolean).slice(0, 20)

  const process = parseArray(body.process)
  if (process) {
    data.process = process
      .map((p) => ({ title: String(p?.title || '').trim(), text: String(p?.text || '').trim() }))
      .filter((p) => p.title)
      .slice(0, 20)
  }
  return data
}

/** GET /api/services — published only; admins can pass all=true. */
export async function getServices(req, res) {
  const filter = req.admin && toBool(req.query.all) ? {} : { published: true }
  const services = await Service.find(filter).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, data: services })
}

/** GET /api/services/:slug */
export async function getServiceBySlug(req, res) {
  const filter = { slug: String(req.params.slug).toLowerCase() }
  if (!req.admin) filter.published = true
  const service = await Service.findOne(filter)
  if (!service) throw ApiError.notFound('Service not found')
  res.json({ success: true, data: service })
}

/** POST /api/services (admin, multipart: image file optional) */
export async function createService(req, res) {
  const data = readBody(req.body)
  data.slug = await uniqueSlug(Service, req.body.slug || data.name)
  if (req.file) data.image = toPublicPath(req.file)
  const service = await Service.create(data)
  res.status(201).json({ success: true, message: 'Service created', data: service })
}

/** PUT /api/services/:id (admin) */
export async function updateService(req, res) {
  const service = await Service.findById(req.params.id)
  if (!service) throw ApiError.notFound('Service not found')

  const data = readBody(req.body)
  const newSlug = String(req.body.slug || '').trim()
  if (newSlug && newSlug !== service.slug) data.slug = await uniqueSlug(Service, newSlug, service._id)

  const oldImage = service.image
  if (req.file) data.image = toPublicPath(req.file)

  Object.assign(service, data)
  await service.save()
  if (oldImage && oldImage !== service.image) await removeUpload(oldImage)

  res.json({ success: true, message: 'Service updated', data: service })
}

/** DELETE /api/services/:id (admin) */
export async function deleteService(req, res) {
  const service = await Service.findByIdAndDelete(req.params.id)
  if (!service) throw ApiError.notFound('Service not found')
  await removeUpload(service.image)
  res.json({ success: true, message: 'Service deleted' })
}
