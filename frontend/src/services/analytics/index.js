import { badRequest } from '../errors'
import { BASES, CLINIC_TZ, boundsFor, bucketKeyOf, bucketKeys, calendar, clinicToday, hourKeyFromTime, resolvePeriod } from './dateRange'

/**
 * Analytics computed in the browser from the admin's live Firestore collections.
 * Each function takes `{ appointments, contacts, blogs }` (normalised docs with ISO dates) and
 * returns the same shapes the dashboard and reports pages were built against.
 */

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const emptyStatusCounts = () => Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]))

/** Reads period/month/year/from/to/basis from the query, optionally forcing a period. */
function readRange(query = {}, forcedPeriod) {
  const basis = String(query.basis || 'created')
  if (!BASES.includes(basis)) throw badRequest(`basis must be one of: ${BASES.join(', ')}`)
  const range = resolvePeriod({
    period: forcedPeriod || String(query.period || 'month'),
    month: query.month,
    year: query.year,
    from: query.from,
    to: query.to,
  })
  return { range, basis, bounds: boundsFor(range, basis) }
}

const time = (v) => (v ? new Date(v).getTime() : NaN)
const within = (field, bounds) => (doc) => {
  const t = time(doc[field])
  return t >= bounds.gte.getTime() && t < bounds.lt.getTime()
}
const apptField = (basis) => (basis === 'scheduled' ? 'date' : 'createdAt')
const apptIn = (list, basis, bounds) => list.filter(within(apptField(basis), bounds))
const createdIn = (list, bounds) => list.filter(within('createdAt', bounds))
const byNewest = (a, b) => time(b.createdAt) - time(a.createdAt)

/** Appointment counts per status. */
function statusCounts(list) {
  const counts = emptyStatusCounts()
  list.forEach((a) => {
    if (a.status in counts) counts[a.status] += 1
  })
  return { total: Object.values(counts).reduce((a, b) => a + b, 0), ...counts }
}

/**
 * Appointments per bucket (hour / day / month) with a per-status split.
 * Empty buckets are included so charts show a continuous axis.
 */
function timeline(range, basis, bounds, list) {
  const byKey = new Map(bucketKeys(range).map((k) => [k.key, { ...k, total: 0, ...emptyStatusCounts() }]))
  let unscheduled = 0

  list.forEach((a) => {
    // Scheduled visits carry a time-slot string ("10:00 AM"), not a timestamp.
    const key =
      range.granularity === 'hour' && basis === 'scheduled'
        ? hourKeyFromTime(a.time)
        : bucketKeyOf(a[apptField(basis)], range.granularity, bounds.timezone)
    if (!key) {
      unscheduled += 1
      return
    }
    const row = byKey.get(key)
    if (!row) return
    row.total += 1
    if (a.status in row) row[a.status] += 1
  })

  return { granularity: range.granularity, buckets: [...byKey.values()], ...(unscheduled ? { withoutTimeSlot: unscheduled } : {}) }
}

/** Services ranked by number of appointment requests, ties alphabetical. */
function groupServices(list) {
  const map = new Map()
  list.forEach((a) => {
    const key = a.service || ''
    const row = map.get(key) || { service: key, total: 0, completed: 0, cancelled: 0 }
    row.total += 1
    if (a.status === 'Completed') row.completed += 1
    if (a.status === 'Cancelled') row.cancelled += 1
    map.set(key, row)
  })
  return [...map.values()].sort((a, b) => b.total - a.total || a.service.localeCompare(b.service))
}

function topServices(list, limit = 10) {
  const rows = groupServices(list).slice(0, limit)
  const sum = rows.reduce((a, r) => a + r.total, 0)
  return rows.map((r) => ({
    service: r.service || 'Unspecified',
    total: r.total,
    completed: r.completed,
    cancelled: r.cancelled,
    share: sum ? Math.round((r.total / sum) * 1000) / 10 : 0,
  }))
}

function contactCounts(list) {
  const unread = list.filter((c) => c.status === 'New').length
  const read = list.filter((c) => c.status === 'Read').length
  return { total: unread + read, unread, read }
}

function blogCounts(list) {
  const published = list.filter((b) => b.published).length
  return { created: list.length, published, drafts: list.length - published }
}

const describe = (range, basis, bounds) => ({
  period: range.period,
  label: range.label,
  basis,
  granularity: range.granularity,
  month: range.month,
  year: range.year,
  from: bounds.gte.toISOString(),
  to: bounds.lt.toISOString(),
  timezone: bounds.timezone,
})

/** Everything the dashboard needs for one period. */
function buildSummary(range, basis, { appointments, contacts, blogs }) {
  const bounds = boundsFor(range, basis)
  // Contacts and blogs only have a creation date, so they always use the clinic timezone.
  const createdBounds = boundsFor(range, 'created')
  const appts = apptIn(appointments, basis, bounds)
  return {
    range: describe(range, basis, bounds),
    appointments: statusCounts(appts),
    timeline: timeline(range, basis, bounds, appts),
    services: topServices(appts),
    contacts: contactCounts(createdIn(contacts, createdBounds)),
    blogs: blogCounts(createdIn(blogs, createdBounds)),
  }
}

/** today | week | month | year | custom summary. */
export function periodSummary(period, query, data) {
  const { range, basis } = readRange(query, period)
  return buildSummary(range, basis, data)
}

/** Most requested services for a period. */
export function servicesAnalytics(query, { appointments }) {
  const { range, basis, bounds } = readRange(query)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10))
  return { range: describe(range, basis, bounds), services: topServices(apptIn(appointments, basis, bounds), limit) }
}

const REPORT_PERIODS = ['all', 'today', 'week', 'month', 'year', 'custom']
const EXPORT_CAP = 10000
const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Case-insensitive name/phone search. Digit-only queries also match phone numbers
 * stored with spaces or dashes ("501234567" matches "+971 50 123 4567").
 */
function searchFilter(raw) {
  const q = String(raw || '').trim().slice(0, 60)
  if (!q) return null
  const name = new RegExp(escapeRegex(q), 'i')
  const digits = q.replace(/\D/g, '')
  const phone =
    digits.length >= 3 && /^[\d\s()+-]+$/.test(q) ? new RegExp(digits.split('').join('[\\s()+-]*')) : new RegExp(escapeRegex(q), 'i')
  return (a) => name.test(a.name || '') || phone.test(a.phone || '')
}

const RECORD_FIELDS = ['_id', 'name', 'phone', 'email', 'service', 'date', 'time', 'status', 'createdAt']
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))

/**
 * Appointment report by SCHEDULED date.
 *   period = all | today | week | month | year | custom   (month&year, year, from&to as needed)
 *   search = patient name or phone, status, service
 *   page, limit (max 100)  — paginated table
 *   export=true            — every matching record (for PDF), oldest first
 *
 * `stats` always describe the whole selected period (search/status do not change them);
 * `records` and `pagination` respect search/status/service.
 */
export function appointmentsAnalytics(query, { appointments }) {
  const period = String(query.period || 'all')
  if (!REPORT_PERIODS.includes(period)) throw badRequest(`period must be one of: ${REPORT_PERIODS.join(', ')}`)

  const status = String(query.status || '')
  if (status && !APPOINTMENT_STATUSES.includes(status)) throw badRequest(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`)

  const isExport = query.export === true || query.export === 'true' || query.export === '1'
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))

  // Period → scheduled-date filter (UTC calendar days, because `date` stores the chosen day at UTC midnight).
  let inPeriod = appointments
  let rangeInfo = { period: 'all', label: 'All appointments', fromDate: null, toDate: null }
  if (period !== 'all') {
    const range = resolvePeriod({ period, month: query.month, year: query.year, from: query.from, to: query.to })
    inPeriod = apptIn(appointments, 'scheduled', boundsFor(range, 'scheduled'))
    rangeInfo = {
      period,
      label: range.label,
      fromDate: calendar.iso(range.start),
      toDate: calendar.iso(calendar.addDays(range.end, -1)),
      month: range.month,
      year: range.year,
    }
  }

  const search = searchFilter(query.search)
  const service = String(query.service || '').trim().slice(0, 120)
  const matching = inPeriod.filter((a) => (!status || a.status === status) && (!service || a.service === service) && (!search || search(a)))
  matching.sort(
    isExport
      ? (a, b) => time(a.date) - time(b.date) || time(a.createdAt) - time(b.createdAt)
      : (a, b) => time(b.date) - time(a.date) || time(b.createdAt) - time(a.createdAt),
  )
  const records = (isExport ? matching.slice(0, EXPORT_CAP) : matching.slice((page - 1) * limit, page * limit)).map((a) =>
    pick(a, RECORD_FIELDS),
  )

  // Headline card counts (all by scheduled date, clinic timezone).
  const today = clinicToday()
  const sched = (p) => apptIn(appointments, 'scheduled', boundsFor(resolvePeriod(p), 'scheduled')).length

  const stats = statusCounts(inPeriod)
  return {
    range: { ...rangeInfo, basis: 'scheduled', timezone: CLINIC_TZ, today: calendar.iso(today) },
    stats,
    // Appointments per service for the whole period (top 8).
    services: groupServices(inPeriod)
      .slice(0, 8)
      .map((s) => ({
        service: s.service || 'Unspecified',
        total: s.total,
        share: stats.total ? Math.round((s.total / stats.total) * 1000) / 10 : 0,
      })),
    overview: {
      allTime: appointments.length,
      today: sched({ period: 'today' }),
      month: sched({ period: 'month', month: today.m, year: today.y }),
      year: sched({ period: 'year', year: today.y }),
    },
    filters: { search: String(query.search || ''), status, service },
    records,
    pagination: isExport
      ? { page: 1, limit: records.length, total: matching.length, pages: 1, truncated: matching.length > records.length }
      : { page, limit, total: matching.length, pages: Math.ceil(matching.length / limit) || 1 },
    generatedAt: new Date().toISOString(),
  }
}

/** Period-independent figures: today's cards, contact and blog analytics, recent activity. */
export function overview({ appointments, contacts, blogs }) {
  const today = clinicToday()
  const todayRange = resolvePeriod({ period: 'today' })
  const tb = boundsFor(todayRange)
  const mb = boundsFor(resolvePeriod({ period: 'month', month: today.m, year: today.y }))
  const yb = boundsFor(resolvePeriod({ period: 'year', year: today.y }))
  const tbScheduled = boundsFor(todayRange, 'scheduled')

  const contactsToday = createdIn(contacts, tb).length
  const cs = contactCounts(contacts)
  const blogsPublished = blogs.filter((b) => b.published).length

  return {
    timezone: CLINIC_TZ,
    today: {
      label: todayRange.label,
      received: statusCounts(createdIn(appointments, tb)),
      scheduled: statusCounts(apptIn(appointments, 'scheduled', tbScheduled)),
      contacts: contactsToday,
    },
    contacts: {
      today: contactsToday,
      month: createdIn(contacts, mb).length,
      year: createdIn(contacts, yb).length,
      ...cs,
    },
    blogs: {
      total: blogs.length,
      published: blogsPublished,
      drafts: blogs.length - blogsPublished,
      month: createdIn(blogs, mb).length,
      year: createdIn(blogs, yb).length,
    },
    recentAppointments: [...appointments].sort(byNewest).slice(0, 10),
    recentContacts: [...contacts].sort(byNewest).slice(0, 8),
  }
}
