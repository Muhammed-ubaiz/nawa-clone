import { bucketKeyOf, bucketKeys, hourKeyFromTime } from './dateRange'

/*
 * In-memory equivalents of the former API's MongoDB aggregations. They receive plain
 * records (dates as ISO strings) already narrowed to the requested range.
 */

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const emptyStatusCounts = () => Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]))

/** Appointment counts per status. */
export function statusCounts(appointments) {
  const counts = emptyStatusCounts()
  appointments.forEach((a) => {
    if (a.status in counts) counts[a.status] += 1
  })
  return { total: Object.values(counts).reduce((a, b) => a + b, 0), ...counts }
}

/**
 * Appointments per bucket (hour / day / month) with a per-status split.
 * Empty buckets are included so charts show a continuous axis.
 */
export function timeline(range, basis, bounds, appointments) {
  const keys = bucketKeys(range)
  const byKey = new Map(keys.map((k) => [k.key, { ...k, total: 0, ...emptyStatusCounts() }]))
  let unscheduled = 0

  const add = (key, status) => {
    const row = byKey.get(key)
    if (!row) return
    row.total += 1
    if (status in row) row[status] += 1
  }

  appointments.forEach((a) => {
    if (range.granularity === 'hour' && basis === 'scheduled') {
      // Scheduled visits carry a time-slot string ("10:00 AM"), not a timestamp.
      const key = hourKeyFromTime(a.time)
      if (key) add(key, a.status)
      else unscheduled += 1
    } else {
      const ms = Date.parse(basis === 'scheduled' ? a.date : a.createdAt)
      if (!Number.isNaN(ms)) add(bucketKeyOf(ms, range.granularity, bounds.timezone), a.status)
    }
  })

  return { granularity: range.granularity, buckets: [...byKey.values()], ...(unscheduled ? { withoutTimeSlot: unscheduled } : {}) }
}

/** Groups appointments by service, sorted by count (desc) then name — like the old $group/$sort. */
function groupByService(appointments) {
  const rows = new Map()
  appointments.forEach((a) => {
    const key = a.service || ''
    const row = rows.get(key) || { service: key, total: 0, completed: 0, cancelled: 0 }
    row.total += 1
    if (a.status === 'Completed') row.completed += 1
    if (a.status === 'Cancelled') row.cancelled += 1
    rows.set(key, row)
  })
  return [...rows.values()].sort((a, b) => b.total - a.total || (a.service < b.service ? -1 : a.service > b.service ? 1 : 0))
}

/** Services ranked by number of appointment requests. */
export function topServices(appointments, limit = 10) {
  const rows = groupByService(appointments).slice(0, limit)
  const sum = rows.reduce((a, r) => a + r.total, 0)
  return rows.map((r) => ({
    service: r.service || 'Unspecified',
    total: r.total,
    completed: r.completed,
    cancelled: r.cancelled,
    share: sum ? Math.round((r.total / sum) * 1000) / 10 : 0,
  }))
}

/** Top services for the appointment report, with shares of the whole period. */
export function serviceShares(appointments, periodTotal, limit = 8) {
  return groupByService(appointments)
    .slice(0, limit)
    .map((s) => ({
      service: s.service || 'Unspecified',
      total: s.total,
      share: periodTotal ? Math.round((s.total / periodTotal) * 1000) / 10 : 0,
    }))
}

export function contactCounts(contacts) {
  const unread = contacts.filter((c) => c.status === 'New').length
  const read = contacts.filter((c) => c.status === 'Read').length
  return { total: unread + read, unread, read }
}

export function blogCounts(blogs) {
  const published = blogs.filter((b) => b.published).length
  return { created: blogs.length, published, drafts: blogs.length - published }
}

export const describe = (range, basis, bounds) => ({
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
