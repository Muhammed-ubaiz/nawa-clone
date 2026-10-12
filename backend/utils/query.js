/**
 * In-memory helpers for the parts of the old MongoDB queries that Firestore cannot do natively
 * (case-insensitive "contains" search across fields, multi-field sorting, skip/limit paging).
 * Documents come from the Firestore models (models/collection.js) already filtered by equality.
 */

const value = (doc, path) => doc?.[path]

const comparable = (v) => (v instanceof Date ? v.getTime() : v)

/**
 * Sorts by a Mongo-style spec, e.g. { date: -1, createdAt: -1 }.
 * Missing values sort first ascending / last descending, like MongoDB.
 */
export function sortBy(docs, spec) {
  const keys = Object.entries(spec)
  return [...docs].sort((a, b) => {
    for (const [k, dir] of keys) {
      const x = comparable(value(a, k))
      const y = comparable(value(b, k))
      if (x === y) continue
      if (x === undefined || x === null) return -dir
      if (y === undefined || y === null) return dir
      if (x < y) return -dir
      if (x > y) return dir
    }
    return 0
  })
}

/** Keeps documents where any of `fields` matches the RegExp. */
export const matchAny = (docs, fields, rx) => docs.filter((d) => fields.some((f) => typeof d[f] === 'string' && rx.test(d[f])))

/** Keeps documents whose `field` (a Date) is within [gte, lt). */
export const inRange = (docs, field, { gte, lt }) =>
  docs.filter((d) => {
    const t = d[field] instanceof Date ? d[field].getTime() : NaN
    return t >= gte.getTime() && t < lt.getTime()
  })

/** skip/limit paging. */
export const paginate = (docs, page, limit) => docs.slice((page - 1) * limit, (page - 1) * limit + limit)

/** Picks the listed fields (plus _id), like Mongoose .select('a b c'). */
export const project = (doc, fields) => Object.fromEntries(['_id', ...fields].filter((f) => doc[f] !== undefined).map((f) => [f, doc[f]]))

/** Removes fields, like Mongoose .select('-content'). */
export const omit = (doc, fields) => Object.fromEntries(Object.entries(doc).filter(([k]) => !fields.includes(k)))

/** Counts documents per value of `field` → { value: count }. */
export function countBy(docs, field) {
  const out = {}
  for (const d of docs) {
    const k = d[field]
    out[k] = (out[k] || 0) + 1
  }
  return out
}
