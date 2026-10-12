import Appointment, { APPOINTMENT_STATUSES } from '../models/Appointment.js'
import Blog from '../models/Blog.js'
import Contact from '../models/Contact.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex } from '../utils/slugify.js'
import { countBy, inRange, paginate, project, sortBy } from '../utils/query.js'
import {
  BASES,
  CLINIC_TZ,
  boundsFor,
  bucketKeys,
  calendar,
  clinicToday,
  hourKeyFromTime,
  resolvePeriod,
  zonedParts,
} from '../utils/dateRange.js'
import { streamAnalyticsReport } from '../utils/analyticsReport.js'

/*
 * Analytics on Firestore: the documents of each collection are loaded once per request and the
 * former MongoDB aggregation pipelines ($match / $group / $dateToString / $sort / $limit) are
 * computed in code. Output shapes are unchanged.
 */

const emptyStatusCounts = () => Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]))
const dateField = (basis) => (basis === 'scheduled' ? 'date' : 'createdAt')

/** Reads period/month/year/from/to/basis from the query, optionally forcing a period. */
function readRange(query, forcedPeriod) {
  const basis = String(query.basis || 'created')
  if (!BASES.includes(basis)) throw ApiError.badRequest(`basis must be one of: ${BASES.join(', ')}`)
  const range = resolvePeriod({
    period: forcedPeriod || String(query.period || 'month'),
    month: query.month,
    year: query.year,
    from: query.from,
    to: query.to,
  })
  return { range, basis, bounds: boundsFor(range, basis) }
}

/** Equivalent of $dateToString with the bucket formats %H / %Y-%m-%d / %Y-%m in a timezone. */
function bucketKeyOf(date, granularity, timezone) {
  const p =
    timezone === 'UTC'
      ? { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate(), H: date.getUTCHours() }
      : zonedParts(date)
  const pad = (n) => String(n).padStart(2, '0')
  if (granularity === 'hour') return pad(p.H)
  if (granularity === 'month') return `${p.y}-${pad(p.m)}`
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`
}

/** Appointment counts per status. */
function statusCounts(appointments) {
  const counts = emptyStatusCounts()
  for (const a of appointments) if (a.status in counts) counts[a.status] += 1
  return { total: Object.values(counts).reduce((x, y) => x + y, 0), ...counts }
}

/**
 * Appointments per bucket (hour / day / month) with a per-status split.
 * Empty buckets are included so charts show a continuous axis.
 */
function timeline(range, basis, bounds, appointments) {
  const keys = bucketKeys(range)
  const byKey = new Map(keys.map((k) => [k.key, { ...k, total: 0, ...emptyStatusCounts() }]))
  let unscheduled = 0

  const add = (key, status) => {
    const row = byKey.get(key)
    if (!row) return
    row.total += 1
    if (status in row) row[status] += 1
  }

  for (const a of appointments) {
    if (range.granularity === 'hour' && basis === 'scheduled') {
      // Scheduled visits carry a time-slot string ("10:00 AM"), not a timestamp.
      const key = hourKeyFromTime(a.time)
      if (key) add(key, a.status)
      else unscheduled += 1
    } else {
      add(bucketKeyOf(a[dateField(basis)], range.granularity, bounds.timezone), a.status)
    }
  }

  return { granularity: range.granularity, buckets: [...byKey.values()], ...(unscheduled ? { withoutTimeSlot: unscheduled } : {}) }
}

/** Services ranked by number of appointment requests. */
function topServices(appointments, limit = 10) {
  const by = new Map()
  for (const a of appointments) {
    const key = a.service || null
    const row = by.get(key) || { service: key, total: 0, completed: 0, cancelled: 0 }
    row.total += 1
    if (a.status === 'Completed') row.completed += 1
    if (a.status === 'Cancelled') row.cancelled += 1
    by.set(key, row)
  }
  const rows = [...by.values()].sort((x, y) => y.total - x.total || String(x.service).localeCompare(String(y.service))).slice(0, limit)
  const sum = rows.reduce((acc, r) => acc + r.total, 0)
  return rows.map((r) => ({
    service: r.service || 'Unspecified',
    total: r.total,
    completed: r.completed,
    cancelled: r.cancelled,
    share: sum ? Math.round((r.total / sum) * 1000) / 10 : 0,
  }))
}

function contactCounts(contacts) {
  const by = countBy(contacts, 'status')
  return { total: (by.New || 0) + (by.Read || 0), unread: by.New || 0, read: by.Read || 0 }
}

function blogCounts(blogs) {
  const published = blogs.filter((b) => b.published).length
  return { created: blogs.length, published, drafts: blogs.length - published }
}

const describe = (range, basis, bounds) => ({
  period: range.period,
  label: range.label,
  basis,
  granularity: range.granularity,
  month: range.month,
  year: range.year,
  from: bounds.gte,
  to: bounds.lt,
  timezone: bounds.timezone,
})

/** Everything the dashboard needs for one period. */
export async function buildSummary(range, basis, loaded) {
  const bounds = boundsFor(range, basis)
  // Contacts and blogs only have a creation date, so they always use the clinic timezone.
  const createdBounds = boundsFor(range, 'created')
  const [allAppointments, allContacts, allBlogs] = loaded || (await Promise.all([Appointment.find(), Contact.find(), Blog.find()]))

  const appointments = inRange(allAppointments, dateField(basis), bounds)
  return {
    range: describe(range, basis, bounds),
    appointments: statusCounts(appointments),
    timeline: timeline(range, basis, bounds, appointments),
    services: topServices(appointments),
    contacts: contactCounts(inRange(allContacts, 'createdAt', createdBounds)),
    blogs: blogCounts(inRange(allBlogs, 'createdAt', createdBounds)),
  }
}

/** Factory for /today, /week, /month, /year, /custom. */
export const periodSummary = (period) => async (req, res) => {
  const { range, basis } = readRange(req.query, period)
  res.json({ success: true, data: await buildSummary(range, basis) })
}

/** GET /api/analytics/services?period=&month=&year=&from=&to=&basis=&limit= */
export async function servicesAnalytics(req, res) {
  const { range, basis, bounds } = readRange(req.query)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const appointments = inRange(await Appointment.find(), dateField(basis), bounds)
  res.json({ success: true, data: { range: describe(range, basis, bounds), services: topServices(appointments, limit) } })
}

const REPORT_PERIODS = ['all', 'today', 'week', 'month', 'year', 'custom']
const EXPORT_CAP = 10000

/**
 * Case-insensitive name/phone matcher. Digit-only queries also match phone numbers stored with
 * spaces or dashes ("501234567" matches "+971 50 123 4567").
 */
function searchMatcher(raw) {
  const q = String(raw || '').trim().slice(0, 60)
  if (!q) return null
  const nameRx = new RegExp(escapeRegex(q), 'i')
  const digits = q.replace(/\D/g, '')
  const phoneRx =
    digits.length >= 3 && /^[\d\s()+-]+$/.test(q) ? new RegExp(digits.split('').join('[\\s()+-]*')) : new RegExp(escapeRegex(q), 'i')
  return (a) => nameRx.test(a.name || '') || phoneRx.test(a.phone || '')
}

const REPORT_FIELDS = ['name', 'phone', 'email', 'service', 'date', 'time', 'status', 'createdAt']

/**
 * GET /api/analytics/appointments  (admin)
 *
 * Appointment report by SCHEDULED date (Appointment.date) in the clinic timezone.
 *   period = all | today | week | month | year | custom   (month&year, year, from&to as needed)
 *   search = patient name or phone, status = Pending|Confirmed|Completed|Cancelled
 *   page, limit (max 100)           — paginated table
 *   export=true                     — every matching record (for PDF), oldest first
 *
 * `stats` always describe the whole selected period (search/status do not change them);
 * `records` and `pagination` respect search/status.
 */
export async function appointmentsAnalytics(req, res) {
  const period = String(req.query.period || 'all')
  if (!REPORT_PERIODS.includes(period)) throw ApiError.badRequest(`period must be one of: ${REPORT_PERIODS.join(', ')}`)

  const status = String(req.query.status || '')
  if (status && !APPOINTMENT_STATUSES.includes(status)) throw ApiError.badRequest(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`)

  const isExport = req.query.export === 'true' || req.query.export === '1'
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

  const all = await Appointment.find()

  // Period → scheduled-date range (UTC calendar days, because `date` stores the chosen day at UTC midnight).
  let inPeriod = all
  let rangeInfo = { period: 'all', label: 'All appointments', fromDate: null, toDate: null }
  if (period !== 'all') {
    const range = resolvePeriod({ period, month: req.query.month, year: req.query.year, from: req.query.from, to: req.query.to })
    inPeriod = inRange(all, 'date', boundsFor(range, 'scheduled'))
    const last = calendar.addDays(range.end, -1)
    rangeInfo = {
      period,
      label: range.label,
      fromDate: calendar.iso(range.start),
      toDate: calendar.iso(last),
      month: range.month,
      year: range.year,
    }
  }

  const matches = searchMatcher(req.query.search)
  const service = String(req.query.service || '').trim().slice(0, 120)
  const filtered = inPeriod.filter((a) => (!status || a.status === status) && (!service || a.service === service) && (!matches || matches(a)))

  // Headline card counts (all by scheduled date, clinic timezone).
  const today = clinicToday()
  const countSched = (p) => inRange(all, 'date', boundsFor(resolvePeriod(p), 'scheduled')).length

  const ordered = sortBy(filtered, isExport ? { date: 1, createdAt: 1 } : { date: -1, createdAt: -1 })
  const records = (isExport ? ordered.slice(0, EXPORT_CAP) : paginate(ordered, page, limit)).map((a) => project(a, REPORT_FIELDS))

  const stats = statusCounts(inPeriod)
  const services = topServices(inPeriod, 8)

  res.json({
    success: true,
    data: {
      range: { ...rangeInfo, basis: 'scheduled', timezone: CLINIC_TZ, today: calendar.iso(today) },
      stats,
      // Appointments per service for the whole period (top 8).
      services: services.map((s) => ({
        service: s.service,
        total: s.total,
        share: stats.total ? Math.round((s.total / stats.total) * 1000) / 10 : 0,
      })),
      overview: {
        allTime: all.length,
        today: countSched({ period: 'today' }),
        month: countSched({ period: 'month', month: today.m, year: today.y }),
        year: countSched({ period: 'year', year: today.y }),
      },
      filters: { search: String(req.query.search || ''), status, service },
      records,
      pagination: isExport
        ? { page: 1, limit: records.length, total: filtered.length, pages: 1, truncated: filtered.length > records.length }
        : { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) || 1 },
      generatedAt: new Date(),
    },
  })
}

/**
 * GET /api/analytics/overview — period-independent figures:
 * today's cards, contact and blog analytics, recent activity.
 */
export async function overview(_req, res) {
  const today = clinicToday()
  const todayRange = resolvePeriod({ period: 'today' })
  const tb = boundsFor(todayRange)
  const mb = boundsFor(resolvePeriod({ period: 'month', month: today.m, year: today.y }))
  const yb = boundsFor(resolvePeriod({ period: 'year', year: today.y }))
  const tbScheduled = boundsFor(todayRange, 'scheduled')

  const [appointments, contacts, blogs] = await Promise.all([Appointment.find(), Contact.find(), Blog.find()])
  const cs = countBy(contacts, 'status')
  const contactsToday = inRange(contacts, 'createdAt', tb).length
  const blogsPublished = blogs.filter((b) => b.published).length

  res.json({
    success: true,
    data: {
      timezone: CLINIC_TZ,
      today: {
        label: todayRange.label,
        received: statusCounts(inRange(appointments, 'createdAt', tb)),
        scheduled: statusCounts(inRange(appointments, 'date', tbScheduled)),
        contacts: contactsToday,
      },
      contacts: {
        today: contactsToday,
        month: inRange(contacts, 'createdAt', mb).length,
        year: inRange(contacts, 'createdAt', yb).length,
        total: (cs.New || 0) + (cs.Read || 0),
        unread: cs.New || 0,
        read: cs.Read || 0,
      },
      blogs: {
        total: blogs.length,
        published: blogsPublished,
        drafts: blogs.length - blogsPublished,
        month: inRange(blogs, 'createdAt', mb).length,
        year: inRange(blogs, 'createdAt', yb).length,
      },
      recentAppointments: sortBy(appointments, { createdAt: -1 }).slice(0, 10),
      recentContacts: sortBy(contacts, { createdAt: -1 }).slice(0, 8),
    },
  })
}

/** GET /api/analytics/report?period=...  — downloadable PDF of the selected period. */
export async function report(req, res) {
  const { range, basis, bounds } = readRange(req.query)
  const loaded = await Promise.all([Appointment.find(), Contact.find(), Blog.find()])
  const summary = await buildSummary(range, basis, loaded)
  const appointments = sortBy(inRange(loaded[0], dateField(basis), bounds), basis === 'scheduled' ? { date: 1, time: 1 } : { createdAt: 1 })
    .slice(0, 500)
    .map((a) => project(a, ['name', 'phone', 'service', 'date', 'time', 'status', 'createdAt']))
  const total = summary.appointments.total
  await streamAnalyticsReport(res, { summary, appointments, truncated: total > appointments.length, generatedBy: req.admin?.name })
}
