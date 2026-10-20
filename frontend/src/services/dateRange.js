/**
 * Timezone-aware date ranges for analytics (ported from the former API's utils/dateRange.js).
 *
 * "Today", "this week" etc. are computed in the clinic's timezone so a booking made at
 * 01:00 Abu Dhabi time counts towards that local day, not the previous UTC day.
 *
 * Two bases are supported:
 *   created   — when the request was received (createdAt, a real instant)
 *   scheduled — the patient's preferred visit date (date, stored as UTC midnight of the
 *               chosen calendar day), so it is bucketed in UTC.
 */

export const CLINIC_TZ = 'Asia/Dubai'
export const PERIODS = ['today', 'week', 'month', 'year', 'custom']
export const BASES = ['created', 'scheduled']

const DAY = 86400000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Errors carry an HTTP-like status so callers can treat them like the old API's 400s. */
export const badRequest = (message) => Object.assign(new Error(message), { status: 400, fields: {} })

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TZ,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
})

/** Calendar parts of an instant as seen in the clinic timezone. */
export function zonedParts(date = new Date()) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, H: +p.hour, M: +p.minute, S: +p.second }
}

/** Offset (ms) between the clinic timezone and UTC at a given instant. */
function offsetAt(ms) {
  const p = zonedParts(new Date(ms))
  return Date.UTC(p.y, p.m - 1, p.d, p.H, p.M, p.S) - Math.floor(ms / 1000) * 1000
}

/** UTC instant of local midnight for a calendar date in the clinic timezone (DST-safe). */
function zonedMidnight(y, m, d) {
  const guess = Date.UTC(y, m - 1, d)
  let ts = guess - offsetAt(guess)
  const corrected = guess - offsetAt(ts)
  if (corrected !== ts) ts = corrected
  return new Date(ts)
}

/** Pure calendar arithmetic on {y,m,d} objects (via UTC, no timezone involved). */
const cal = {
  fromUTC: (ms) => {
    const d = new Date(ms)
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
  },
  toUTC: ({ y, m, d }) => Date.UTC(y, m - 1, d),
  addDays: (c, n) => cal.fromUTC(cal.toUTC(c) + n * DAY),
  diffDays: (a, b) => Math.round((cal.toUTC(b) - cal.toUTC(a)) / DAY),
  weekday: (c) => new Date(cal.toUTC(c)).getUTCDay(),
  iso: ({ y, m, d }) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  parse: (s) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
    if (!match) return null
    const c = { y: +match[1], m: +match[2], d: +match[3] }
    const back = cal.fromUTC(cal.toUTC(c))
    return back.y === c.y && back.m === c.m && back.d === c.d ? c : null
  },
}

const fmtDay = (c, withYear = true) => `${c.d} ${MONTHS[c.m - 1]}${withYear ? ` ${c.y}` : ''}`

/** Today's calendar date in the clinic timezone. */
export const clinicToday = () => {
  const p = zonedParts()
  return { y: p.y, m: p.m, d: p.d }
}

/**
 * Resolves a period request into a calendar range.
 * Returns calendar start (inclusive) / end (exclusive), a bucket granularity and a label.
 */
export function resolvePeriod({ period = 'month', month, year, from, to } = {}) {
  if (!PERIODS.includes(period)) throw badRequest(`period must be one of: ${PERIODS.join(', ')}`)
  const today = clinicToday()
  const yr = year !== undefined && year !== '' && year !== null ? Number(year) : today.y
  if (!Number.isInteger(yr) || yr < 2000 || yr > 2100) throw badRequest('year must be between 2000 and 2100')

  let start
  let end
  let granularity
  let label

  switch (period) {
    case 'today':
      start = today
      end = cal.addDays(today, 1)
      granularity = 'hour'
      label = `Today, ${fmtDay(today)}`
      break
    case 'week': {
      // Weeks start on Monday.
      const back = (cal.weekday(today) + 6) % 7
      start = cal.addDays(today, -back)
      end = cal.addDays(start, 7)
      granularity = 'day'
      const last = cal.addDays(end, -1)
      label = `This week, ${fmtDay(start, start.y !== last.y)} – ${fmtDay(last)}`
      break
    }
    case 'month': {
      const mo = month !== undefined && month !== '' && month !== null ? Number(month) : today.m
      if (!Number.isInteger(mo) || mo < 1 || mo > 12) throw badRequest('month must be between 1 and 12')
      start = { y: yr, m: mo, d: 1 }
      end = mo === 12 ? { y: yr + 1, m: 1, d: 1 } : { y: yr, m: mo + 1, d: 1 }
      granularity = 'day'
      label = `${MONTHS_LONG[mo - 1]} ${yr}`
      break
    }
    case 'year':
      start = { y: yr, m: 1, d: 1 }
      end = { y: yr + 1, m: 1, d: 1 }
      granularity = 'month'
      label = String(yr)
      break
    case 'custom': {
      const f = cal.parse(from)
      const t = cal.parse(to)
      if (!f || !t) throw badRequest('from and to must be valid dates (YYYY-MM-DD)')
      if (cal.diffDays(f, t) < 0) throw badRequest('from must be on or before to')
      if (cal.diffDays(f, t) > 366 * 5) throw badRequest('Custom ranges are limited to 5 years')
      start = f
      end = cal.addDays(t, 1)
      granularity = cal.diffDays(start, end) <= 62 ? 'day' : 'month'
      label = f.y === t.y && f.m === t.m && f.d === t.d ? fmtDay(f) : `${fmtDay(f)} – ${fmtDay(t)}`
      break
    }
    default:
      break
  }

  return { period, start, end, granularity, label, month: period === 'month' ? start.m : undefined, year: start.y }
}

/** Converts a calendar range into Date boundaries for the chosen basis. */
export function boundsFor(range, basis = 'created') {
  if (basis === 'scheduled') {
    return { gte: new Date(cal.toUTC(range.start)), lt: new Date(cal.toUTC(range.end)), timezone: 'UTC' }
  }
  return {
    gte: zonedMidnight(range.start.y, range.start.m, range.start.d),
    lt: zonedMidnight(range.end.y, range.end.m, range.end.d),
    timezone: CLINIC_TZ,
  }
}

/** Bucket key of an instant for a granularity, in the bounds' timezone (replaces Mongo $dateToString). */
export function bucketKeyOf(ms, granularity, timezone) {
  const p = timezone === 'UTC' ? (({ y, m, d }) => ({ y, m, d, H: new Date(ms).getUTCHours() }))(cal.fromUTC(ms)) : zonedParts(new Date(ms))
  if (granularity === 'hour') return String(p.H).padStart(2, '0')
  if (granularity === 'month') return `${p.y}-${String(p.m).padStart(2, '0')}`
  return cal.iso(p)
}

/** Every bucket in the range, so empty hours/days/months still appear on charts. */
export function bucketKeys(range) {
  if (range.granularity === 'hour') {
    return Array.from({ length: 24 }, (_, h) => ({
      key: String(h).padStart(2, '0'),
      label: `${String(h % 12 || 12).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`,
    }))
  }
  if (range.granularity === 'month') {
    const keys = []
    let c = { y: range.start.y, m: range.start.m, d: 1 }
    while (cal.toUTC(c) < cal.toUTC(range.end)) {
      const multiYear = range.start.y !== cal.addDays(range.end, -1).y
      keys.push({ key: `${c.y}-${String(c.m).padStart(2, '0')}`, label: multiYear ? `${MONTHS[c.m - 1]} ${String(c.y).slice(2)}` : MONTHS[c.m - 1] })
      c = c.m === 12 ? { y: c.y + 1, m: 1, d: 1 } : { y: c.y, m: c.m + 1, d: 1 }
    }
    return keys
  }
  const days = cal.diffDays(range.start, range.end)
  return Array.from({ length: days }, (_, i) => {
    const c = cal.addDays(range.start, i)
    const label = range.period === 'month' ? String(c.d) : range.period === 'week' ? `${WEEKDAYS[cal.weekday(c)]} ${c.d}` : fmtDay(c, false)
    return { key: cal.iso(c), label }
  })
}

/** Parses "10:00 AM" / "14:30" into an hour bucket key ("10", "14"); null if unknown. */
export function hourKeyFromTime(time) {
  const match = /^(\d{1,2})(?::\d{2})?\s*(AM|PM)?$/i.exec(String(time || '').trim())
  if (!match) return null
  let h = Number(match[1])
  const ap = match[2]?.toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h >= 0 && h < 24 ? String(h).padStart(2, '0') : null
}

export const calendar = cal
