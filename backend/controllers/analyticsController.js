import Appointment, { APPOINTMENT_STATUSES } from '../models/Appointment.js'
import Blog from '../models/Blog.js'
import Contact from '../models/Contact.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegex } from '../utils/slugify.js'
import {
  BASES,
  BUCKET_FORMAT,
  CLINIC_TZ,
  boundsFor,
  bucketKeys,
  calendar,
  clinicToday,
  hourKeyFromTime,
  resolvePeriod,
} from '../utils/dateRange.js'
import { streamAnalyticsReport } from '../utils/analyticsReport.js'

const emptyStatusCounts = () => Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]))

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

const apptMatch = (basis, bounds) => ({ [basis === 'scheduled' ? 'date' : 'createdAt']: { $gte: bounds.gte, $lt: bounds.lt } })
const createdMatch = (bounds) => ({ createdAt: { $gte: bounds.gte, $lt: bounds.lt } })

/** Appointment counts per status within the range. */
async function statusCounts(match) {
  const rows = await Appointment.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }])
  const counts = emptyStatusCounts()
  rows.forEach((r) => {
    if (r._id in counts) counts[r._id] = r.count
  })
  return { total: Object.values(counts).reduce((a, b) => a + b, 0), ...counts }
}

/**
 * Appointments per bucket (hour / day / month) with a per-status split.
 * Empty buckets are included so charts show a continuous axis.
 */
async function timeline(range, basis, bounds) {
  const match = apptMatch(basis, bounds)
  const keys = bucketKeys(range)
  const byKey = new Map(keys.map((k) => [k.key, { ...k, total: 0, ...emptyStatusCounts() }]))
  let unscheduled = 0

  const add = (key, status, count) => {
    const row = byKey.get(key)
    if (!row) return
    row.total += count
    if (status in row) row[status] += count
  }

  if (range.granularity === 'hour' && basis === 'scheduled') {
    // Scheduled visits carry a time-slot string ("10:00 AM"), not a timestamp.
    const rows = await Appointment.aggregate([{ $match: match }, { $group: { _id: { time: '$time', status: '$status' }, count: { $sum: 1 } } }])
    rows.forEach(({ _id, count }) => {
      const key = hourKeyFromTime(_id.time)
      if (key) add(key, _id.status, count)
      else unscheduled += count
    })
  } else {
    const field = basis === 'scheduled' ? '$date' : '$createdAt'
    const rows = await Appointment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            bucket: { $dateToString: { format: BUCKET_FORMAT[range.granularity], date: field, timezone: bounds.timezone } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ])
    rows.forEach(({ _id, count }) => add(_id.bucket, _id.status, count))
  }

  return { granularity: range.granularity, buckets: [...byKey.values()], ...(unscheduled ? { withoutTimeSlot: unscheduled } : {}) }
}

/** Services ranked by number of appointment requests in the range. */
async function topServices(basis, bounds, limit = 10) {
  const rows = await Appointment.aggregate([
    { $match: apptMatch(basis, bounds) },
    {
      $group: {
        _id: '$service',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
      },
    },
    { $sort: { total: -1, _id: 1 } },
    { $limit: limit },
  ])
  const sum = rows.reduce((a, r) => a + r.total, 0)
  return rows.map((r) => ({
    service: r._id || 'Unspecified',
    total: r.total,
    completed: r.completed,
    cancelled: r.cancelled,
    share: sum ? Math.round((r.total / sum) * 1000) / 10 : 0,
  }))
}

async function contactCounts(bounds) {
  const rows = await Contact.aggregate([{ $match: createdMatch(bounds) }, { $group: { _id: '$status', count: { $sum: 1 } } }])
  const by = Object.fromEntries(rows.map((r) => [r._id, r.count]))
  return { total: (by.New || 0) + (by.Read || 0), unread: by.New || 0, read: by.Read || 0 }
}

async function blogCounts(bounds) {
  const [created, published] = await Promise.all([
    Blog.countDocuments(createdMatch(bounds)),
    Blog.countDocuments({ ...createdMatch(bounds), published: true }),
  ])
  return { created, published, drafts: created - published }
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
export async function buildSummary(range, basis) {
  const bounds = boundsFor(range, basis)
  // Contacts and blogs only have a creation date, so they always use the clinic timezone.
  const createdBounds = boundsFor(range, 'created')
  const [appointments, chart, services, contacts, blogs] = await Promise.all([
    statusCounts(apptMatch(basis, bounds)),
    timeline(range, basis, bounds),
    topServices(basis, bounds),
    contactCounts(createdBounds),
    blogCounts(createdBounds),
  ])
  return { range: describe(range, basis, bounds), appointments, timeline: chart, services, contacts, blogs }
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
  res.json({ success: true, data: { range: describe(range, basis, bounds), services: await topServices(basis, bounds, limit) } })
}

const REPORT_PERIODS = ['all', 'today', 'week', 'month', 'year', 'custom']
const EXPORT_CAP = 10000

/**
 * Builds a case-insensitive name/phone search. Digit-only queries also match
 * phone numbers stored with spaces or dashes ("501234567" matches "+971 50 123 4567").
 */
function searchFilter(raw) {
  const q = String(raw || '').trim().slice(0, 60)
  if (!q) return null
  const or = [{ name: new RegExp(escapeRegex(q), 'i') }]
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 3 && /^[\d\s()+-]+$/.test(q)) {
    or.push({ phone: new RegExp(digits.split('').join('[\\s()+-]*')) })
  } else {
    or.push({ phone: new RegExp(escapeRegex(q), 'i') })
  }
  return { $or: or }
}

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

  // Period → scheduled-date match (UTC calendar days, because `date` stores the chosen day at UTC midnight).
  let periodMatch = {}
  let rangeInfo = { period: 'all', label: 'All appointments', fromDate: null, toDate: null }
  if (period !== 'all') {
    const range = resolvePeriod({ period, month: req.query.month, year: req.query.year, from: req.query.from, to: req.query.to })
    const bounds = boundsFor(range, 'scheduled')
    periodMatch = { date: { $gte: bounds.gte, $lt: bounds.lt } }
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

  const search = searchFilter(req.query.search)
  const service = String(req.query.service || '').trim().slice(0, 120)
  const tableMatch = { ...periodMatch, ...(status ? { status } : {}), ...(service ? { service } : {}), ...(search || {}) }

  // Headline card counts (all by scheduled date, clinic timezone).
  const today = clinicToday()
  const sched = (p) => {
    const b = boundsFor(resolvePeriod(p), 'scheduled')
    return { date: { $gte: b.gte, $lt: b.lt } }
  }

  const listQuery = Appointment.find(tableMatch)
    .select('name phone email service date time status createdAt')
    .sort(isExport ? { date: 1, createdAt: 1 } : { date: -1, createdAt: -1 })
    .lean()
  if (isExport) listQuery.limit(EXPORT_CAP)
  else listQuery.skip((page - 1) * limit).limit(limit)

  const [stats, services, filteredTotal, records, allTime, todayCount, monthCount, yearCount] = await Promise.all([
    statusCounts(periodMatch),
    Appointment.aggregate([
      { $match: periodMatch },
      { $group: { _id: '$service', total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    Appointment.countDocuments(tableMatch),
    listQuery,
    Appointment.countDocuments(),
    Appointment.countDocuments(sched({ period: 'today' })),
    Appointment.countDocuments(sched({ period: 'month', month: today.m, year: today.y })),
    Appointment.countDocuments(sched({ period: 'year', year: today.y })),
  ])

  res.json({
    success: true,
    data: {
      range: { ...rangeInfo, basis: 'scheduled', timezone: CLINIC_TZ, today: calendar.iso(today) },
      stats,
      // Appointments per service for the whole period (top 8).
      services: services.map((s) => ({
        service: s._id || 'Unspecified',
        total: s.total,
        share: stats.total ? Math.round((s.total / stats.total) * 1000) / 10 : 0,
      })),
      overview: { allTime, today: todayCount, month: monthCount, year: yearCount },
      filters: { search: String(req.query.search || ''), status, service },
      records,
      pagination: isExport
        ? { page: 1, limit: records.length, total: filteredTotal, pages: 1, truncated: filteredTotal > records.length }
        : { page, limit, total: filteredTotal, pages: Math.ceil(filteredTotal / limit) || 1 },
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
  const monthRange = resolvePeriod({ period: 'month', month: today.m, year: today.y })
  const yearRange = resolvePeriod({ period: 'year', year: today.y })
  const tb = boundsFor(todayRange)
  const mb = boundsFor(monthRange)
  const yb = boundsFor(yearRange)
  const tbScheduled = boundsFor(todayRange, 'scheduled')

  const [
    todayReceived,
    todayScheduled,
    contactsToday,
    contactsMonth,
    contactsYear,
    contactsByStatus,
    blogsTotal,
    blogsPublished,
    blogsMonth,
    blogsYear,
    recentAppointments,
    recentContacts,
  ] = await Promise.all([
    statusCounts(createdMatch(tb)),
    statusCounts({ date: { $gte: tbScheduled.gte, $lt: tbScheduled.lt } }),
    Contact.countDocuments(createdMatch(tb)),
    Contact.countDocuments(createdMatch(mb)),
    Contact.countDocuments(createdMatch(yb)),
    Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Blog.countDocuments(),
    Blog.countDocuments({ published: true }),
    Blog.countDocuments(createdMatch(mb)),
    Blog.countDocuments(createdMatch(yb)),
    Appointment.find().sort({ createdAt: -1 }).limit(10).lean(),
    Contact.find().sort({ createdAt: -1 }).limit(8).lean(),
  ])

  const cs = Object.fromEntries(contactsByStatus.map((r) => [r._id, r.count]))

  res.json({
    success: true,
    data: {
      timezone: CLINIC_TZ,
      today: {
        label: todayRange.label,
        received: todayReceived,
        scheduled: todayScheduled,
        contacts: contactsToday,
      },
      contacts: {
        today: contactsToday,
        month: contactsMonth,
        year: contactsYear,
        total: (cs.New || 0) + (cs.Read || 0),
        unread: cs.New || 0,
        read: cs.Read || 0,
      },
      blogs: {
        total: blogsTotal,
        published: blogsPublished,
        drafts: blogsTotal - blogsPublished,
        month: blogsMonth,
        year: blogsYear,
      },
      recentAppointments,
      recentContacts,
    },
  })
}

/** GET /api/analytics/report?period=...  — downloadable PDF of the selected period. */
export async function report(req, res) {
  const { range, basis, bounds } = readRange(req.query)
  const [summary, appointments] = await Promise.all([
    buildSummary(range, basis),
    Appointment.find(apptMatch(basis, bounds))
      .sort(basis === 'scheduled' ? { date: 1, time: 1 } : { createdAt: 1 })
      .limit(500)
      .select('name phone service date time status createdAt')
      .lean(),
  ])
  const total = summary.appointments.total
  await streamAnalyticsReport(res, { summary, appointments, truncated: total > appointments.length, generatedBy: req.admin?.name })
}
