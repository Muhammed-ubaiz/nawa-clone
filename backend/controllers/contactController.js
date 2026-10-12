import Contact, { CONTACT_STATUSES } from '../models/Contact.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex } from '../utils/slugify.js'

/** POST /api/contacts (public) */
export async function createContact(req, res) {
  const { name, email, phone, message } = req.body
  await Contact.create({ name, email, phone, message })
  res.status(201).json({ success: true, message: 'Thank you! Your message has been sent.' })
}

/** GET /api/contacts?status=&search=&page=&limit= (admin) */
export async function getContacts(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
  const status = String(req.query.status || '')
  const search = String(req.query.search || '').trim()

  const filter = {}
  if (CONTACT_STATUSES.includes(status)) filter.status = status
  if (search) {
    const rx = new RegExp(escapeRegex(search.slice(0, 80)), 'i')
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }]
  }

  const [items, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Contact.countDocuments(filter),
  ])
  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } })
}

/** GET /api/contacts/:id (admin) */
export async function getContact(req, res) {
  const contact = await Contact.findById(req.params.id).lean()
  if (!contact) throw ApiError.notFound('Message not found')
  res.json({ success: true, data: contact })
}

/** PUT /api/contacts/:id (admin) — mark as read / unread */
export async function updateContact(req, res) {
  const status = String(req.body.status || '')
  if (!CONTACT_STATUSES.includes(status)) throw ApiError.badRequest(`Status must be one of: ${CONTACT_STATUSES.join(', ')}`)
  const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
  if (!contact) throw ApiError.notFound('Message not found')
  res.json({ success: true, message: `Marked as ${status.toLowerCase()}`, data: contact })
}

/** DELETE /api/contacts/:id (admin) */
export async function deleteContact(req, res) {
  const contact = await Contact.findByIdAndDelete(req.params.id)
  if (!contact) throw ApiError.notFound('Message not found')
  res.json({ success: true, message: 'Message deleted' })
}
