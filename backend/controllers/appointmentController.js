import Appointment, { APPOINTMENT_STATUSES } from '../models/Appointment.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex } from '../utils/slugify.js'
import { matchAny, paginate, sortBy } from '../utils/query.js'

const PUBLIC_FIELDS = ['name', 'phone', 'email', 'date', 'time', 'service', 'message']

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))

/** POST /api/appointments (public) */
export async function createAppointment(req, res) {
  // Status is never accepted from the public form.
  const appointment = await Appointment.create(pick(req.body, PUBLIC_FIELDS))
  res.status(201).json({
    success: true,
    message: 'Appointment request received. Our team will contact you shortly.',
    appointment: { id: appointment._id, status: appointment.status },
  })
}

/** GET /api/appointments?search=&status=&page=&limit= (admin) */
export async function getAppointments(req, res) {
  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '')
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

  let items = await Appointment.find(APPOINTMENT_STATUSES.includes(status) ? { status } : {})
  if (search) items = matchAny(items, ['name', 'phone', 'email', 'service'], new RegExp(escapeRegex(search.slice(0, 80)), 'i'))
  items = sortBy(items, { createdAt: -1 })
  const total = items.length

  res.json({ success: true, data: paginate(items, page, limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } })
}

/** GET /api/appointments/:id (admin) */
export async function getAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, data: appointment })
}

/** PUT /api/appointments/:id (admin) — update status and/or details */
export async function updateAppointment(req, res) {
  const updates = pick(req.body, [...PUBLIC_FIELDS, 'status'])
  const appointment = await Appointment.update(req.params.id, updates)
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, message: 'Appointment updated', data: appointment })
}

/** DELETE /api/appointments/:id (admin) */
export async function deleteAppointment(req, res) {
  const appointment = await Appointment.delete(req.params.id)
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, message: 'Appointment deleted' })
}
