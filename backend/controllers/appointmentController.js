import Appointment, { APPOINTMENT_STATUSES } from '../models/Appointment.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex } from '../utils/slugify.js'

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

  const filter = {}
  if (APPOINTMENT_STATUSES.includes(status)) filter.status = status
  if (search) {
    const rx = new RegExp(escapeRegex(search.slice(0, 80)), 'i')
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { service: rx }]
  }

  const [items, total] = await Promise.all([
    Appointment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } })
}

/** GET /api/appointments/:id (admin) */
export async function getAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id).lean()
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, data: appointment })
}

/** PUT /api/appointments/:id (admin) — update status and/or details */
export async function updateAppointment(req, res) {
  const updates = pick(req.body, [...PUBLIC_FIELDS, 'status'])
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, message: 'Appointment updated', data: appointment })
}

/** DELETE /api/appointments/:id (admin) */
export async function deleteAppointment(req, res) {
  const appointment = await Appointment.findByIdAndDelete(req.params.id)
  if (!appointment) throw ApiError.notFound('Appointment not found')
  res.json({ success: true, message: 'Appointment deleted' })
}
