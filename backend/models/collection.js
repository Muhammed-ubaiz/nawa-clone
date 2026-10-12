import { FieldValue, Timestamp, db } from '../config/firebase.js'

/**
 * A small Firestore "model" layer that keeps the API's behaviour identical to the old Mongoose
 * models, so controllers and the frontend did not have to change shape:
 *
 *   - schema rules (type, trim, lowercase, required, minlength, maxlength, match, enum, default)
 *     raise a Mongoose-style ValidationError → errorMiddleware still answers 400 with field errors;
 *   - `unique` fields are checked before writes → 409 "A record with this <field> already exists.";
 *   - documents are returned as plain objects with `_id` (the Firestore document id), JS Dates
 *     instead of Timestamps, hidden fields (e.g. password) removed and optional virtuals added;
 *   - `timestamps` maintains createdAt / updatedAt.
 *
 * Firestore has no regex search or aggregation pipelines, so list endpoints load the matching
 * documents (equality filters run in Firestore) and filter / sort / paginate in code — see
 * utils/query.js. That is ample for a clinic's volumes; counts use Firestore's count() aggregate.
 */

/** Mongoose-compatible validation error (errorMiddleware reads `name` and `errors`). */
class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

const conflict = (field) => Object.assign(new Error(`A record with this ${field} already exists.`), { statusCode: 409 })

/** Converts Firestore Timestamps (also nested) back to JS Dates. */
function revive(value) {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(revive)
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, revive(v)]))
  }
  return value
}

/** Casts and validates one value against its rule. Returns [value, errorMessage]. */
function castValue(path, rule, input) {
  let v = input
  switch (rule.type) {
    case 'string':
      if (typeof v !== 'string') v = String(v)
      if (rule.trim) v = v.trim()
      if (rule.lowercase) v = v.toLowerCase()
      if (v === '') return [undefined, null] // empty strings count as "not provided" (as in Mongoose)
      if (rule.minlength && v.length < rule.minlength) return [v, `${path} must be at least ${rule.minlength} characters.`]
      if (rule.maxlength && v.length > rule.maxlength) return [v, `${path} must be ${rule.maxlength} characters or fewer.`]
      if (rule.match && !rule.match[0].test(v)) return [v, rule.match[1] || `${path} is invalid.`]
      if (rule.enum && !rule.enum.includes(v)) return [v, `\`${v}\` is not a valid value for ${path}.`]
      return [v, null]
    case 'number': {
      const n = Number(v)
      return Number.isFinite(n) ? [n, null] : [v, `${path} must be a number.`]
    }
    case 'boolean':
      return [v === true || v === 'true' || v === 1 || v === '1', null]
    case 'date': {
      const d = v instanceof Date ? v : v instanceof Timestamp ? v.toDate() : new Date(v)
      return Number.isNaN(d.getTime()) ? [v, `${path} must be a valid date.`] : [d, null]
    }
    case 'stringArray':
      if (!Array.isArray(v)) return [v, `${path} must be a list.`]
      return [v.map((s) => String(s).trim()).filter(Boolean), null]
    case 'objectArray': {
      if (!Array.isArray(v)) return [v, `${path} must be a list.`]
      const out = []
      for (const [i, item] of v.entries()) {
        const row = {}
        for (const [k, sub] of Object.entries(rule.of)) {
          const raw = item?.[k]
          if (raw === undefined || raw === null || raw === '') {
            if (sub.required) return [v, `${path}.${i}.${k} is required.`]
            continue
          }
          const [cv, err] = castValue(`${path}.${i}.${k}`, sub, raw)
          if (err) return [v, err]
          if (cv !== undefined) row[k] = cv
          else if (sub.required) return [v, `${path}.${i}.${k} is required.`]
        }
        out.push(row)
      }
      return [out, null]
    }
    default:
      return [v, null]
  }
}

/**
 * Defines a collection-backed model.
 *   fields:     { name: { type, required, trim, lowercase, minlength, maxlength, match, enum, default, unique } }
 *   timestamps: { createdAt: boolean, updatedAt: boolean }
 *   hidden:     fields never returned unless { withHidden: true }
 *   virtuals:   { name: (doc) => value } computed on output
 *   idAlias:    also expose `id` (Mongoose toJSON virtuals)
 */
export function defineModel(collectionName, { fields, timestamps = { createdAt: true, updatedAt: true }, hidden = [], virtuals = {}, idAlias = false }) {
  const col = () => db().collection(collectionName)
  const uniqueFields = Object.entries(fields).filter(([, r]) => r.unique).map(([k]) => k)

  /** Validates input. `partial` = update (only provided keys; required means "cannot be cleared"). */
  function clean(input, { partial = false } = {}) {
    const out = {}
    const errors = {}
    for (const [path, rule] of Object.entries(fields)) {
      const has = Object.prototype.hasOwnProperty.call(input, path)
      if (partial && !has) continue
      const raw = input[path]
      if (raw === undefined || raw === null) {
        if (partial && has && raw === undefined && !rule.required) out[path] = FieldValue.delete() // explicit unset
        else if (!partial && rule.default !== undefined) out[path] = typeof rule.default === 'function' ? rule.default() : rule.default
        else if (rule.required) errors[path] = { path, message: rule.requiredMessage || `${path} is required.` }
        continue
      }
      const [value, err] = castValue(path, rule, raw)
      if (err) {
        errors[path] = { path, message: err }
        continue
      }
      if (value === undefined) {
        if (rule.required) errors[path] = { path, message: rule.requiredMessage || `${path} is required.` }
        else if (partial) out[path] = FieldValue.delete()
        else if (rule.default !== undefined) out[path] = typeof rule.default === 'function' ? rule.default() : rule.default
        continue
      }
      out[path] = value
    }
    if (Object.keys(errors).length) throw new ValidationError(errors)
    return out
  }

  /** Firestore snapshot → API object. */
  function toObject(snap, { withHidden = false } = {}) {
    if (!snap?.exists) return null
    const data = revive(snap.data())
    if (!withHidden) hidden.forEach((h) => delete data[h])
    const obj = { _id: snap.id, ...(idAlias ? { id: snap.id } : {}), ...data }
    for (const [name, fn] of Object.entries(virtuals)) obj[name] = fn(obj)
    return obj
  }

  /** Applies equality filters ({ field: value }) to a query. */
  function whereEq(filter = {}) {
    let q = col()
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined) q = q.where(k, '==', v)
    }
    return q
  }

  async function assertUnique(data, excludeId) {
    for (const field of uniqueFields) {
      if (data[field] === undefined || data[field] instanceof FieldValue) continue
      // eslint-disable-next-line no-await-in-loop
      const snap = await col().where(field, '==', data[field]).limit(2).get()
      if (snap.docs.some((d) => d.id !== excludeId)) throw conflict(field)
    }
  }

  /** Firestore ids cannot contain "/" and must be non-empty. */
  const validId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 1500 && !id.includes('/')

  return {
    collectionName,
    collection: col,
    clean,

    async create(input, { id } = {}) {
      const data = clean(input)
      await assertUnique(data)
      const now = new Date()
      if (timestamps.createdAt && !data.createdAt) data.createdAt = now
      if (timestamps.updatedAt && !data.updatedAt) data.updatedAt = now
      const ref = id ? col().doc(id) : col().doc()
      await ref.set(data)
      return toObject(await ref.get())
    },

    async findById(id, opts) {
      if (!validId(id)) return null
      return toObject(await col().doc(id).get(), opts)
    },

    async findOne(filter, opts) {
      const snap = await whereEq(filter).limit(1).get()
      return snap.empty ? null : toObject(snap.docs[0], opts)
    },

    /** All documents matching equality filters (sort/paginate with utils/query.js). */
    async find(filter = {}, opts) {
      const snap = await whereEq(filter).get()
      return snap.docs.map((d) => toObject(d, opts))
    },

    /** Server-side count (Firestore aggregation, no documents read). */
    async count(filter = {}) {
      const snap = await whereEq(filter).count().get()
      return snap.data().count
    },

    async exists(filter, excludeId) {
      const snap = await whereEq(filter).limit(2).get()
      return snap.docs.some((d) => d.id !== excludeId)
    },

    /** Partial update; returns the updated document or null when it does not exist. */
    async update(id, input, opts) {
      if (!validId(id)) return null
      const ref = col().doc(id)
      const current = await ref.get()
      if (!current.exists) return null
      const data = clean(input, { partial: true })
      await assertUnique(data, id)
      if (timestamps.updatedAt) data.updatedAt = new Date()
      if (Object.keys(data).length) await ref.update(data)
      return toObject(await ref.get(), opts)
    },

    /** Deletes and returns the removed document (null when it did not exist). */
    async delete(id) {
      if (!validId(id)) return null
      const ref = col().doc(id)
      const snap = await ref.get()
      if (!snap.exists) return null
      await ref.delete()
      return toObject(snap)
    },

    toObject,
  }
}
