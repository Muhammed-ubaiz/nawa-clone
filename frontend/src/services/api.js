import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { compressImage } from '../utils/image'
import { emitLocalChange } from '../utils/liveSync'
import { apiError, badRequest, notFound, toApiError } from './errors'

/**
 * Data layer for the website and admin panel, backed by Firebase (project nawaayurveda-9b51e).
 *
 *   Auth        Firebase Authentication (email + password); admins/{uid} marks who is an admin
 *   Database    Cloud Firestore: appointments, contacts, blogs, services
 *   Security    firestore.rules (repository root) enforces access and field limits server-side
 *
 * Every function resolves to the same shapes the old REST API returned ({ success, data, ... }) and
 * rejects with an Error carrying { message, status, fields } (see ./errors).
 */

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
export const CONTACT_STATUSES = ['New', 'Read']

/* ------------------------------------------------------------------ helpers */

const iso = (v) => (v instanceof Timestamp ? v.toDate().toISOString() : v)

/** Firestore snapshot → plain object with `_id` and ISO date strings (what the UI expects). */
function fromSnap(snap) {
  const raw = snap.data({ serverTimestamps: 'estimate' })
  const out = { _id: snap.id }
  for (const [k, v] of Object.entries(raw)) out[k] = iso(v)
  return out
}

const time = (v) => (v ? new Date(v).getTime() : 0)
const byNewest = (a, b) => time(b.createdAt) - time(a.createdAt)

/** Estimated reading time based on ~200 words per minute. */
const withReadTime = (blog) => {
  const words = (blog.content || '').split(/\s+/).filter(Boolean).length
  return { ...blog, readTime: `${Math.max(1, Math.round(words / 200))} min read` }
}

function paginate(list, params = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(params.limit, 10) || defaultLimit))
  return {
    data: list.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: list.length, pages: Math.ceil(list.length / limit) || 1 },
  }
}

const textMatcher = (search) => {
  const q = String(search || '').trim().slice(0, 80).toLowerCase()
  return q ? (values) => values.some((v) => String(v || '').toLowerCase().includes(q)) : null
}

const toBool = (v) => v === true || v === 'true' || v === '1' || v === 'on'
const trimmed = (v) => (v === undefined || v === null ? undefined : String(v).trim())

/** Converts a title into a URL-safe slug, e.g. "Body Scrubs & Wraps" -> "body-scrubs-wraps". */
export const slugify = (text = '') =>
  String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

/** A slug unique among `docs`, appending -2, -3 ... if needed; `excludeId` keeps a doc's own slug. */
function uniqueSlug(docs, base, excludeId) {
  const root = slugify(base) || 'item'
  const taken = new Set(docs.filter((d) => d._id !== excludeId).map((d) => d.slug))
  let slug = root
  for (let n = 2; taken.has(slug); n++) slug = `${root}-${n}`
  return slug
}

/** An uploaded File becomes a compressed data URL; an http(s) string is kept as an external image. */
async function imageValue(value) {
  if (typeof File !== 'undefined' && value instanceof File) return compressImage(value)
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return value
  return undefined
}

/**
 * Runs field rules ({ field: (value) => errorMessage | undefined }) and throws a 400 with every
 * failing field. With `partial`, only fields present in `body` are checked (updates).
 */
function validate(body, rules, { partial = false } = {}) {
  const fields = {}
  for (const [field, rule] of Object.entries(rules)) {
    if (partial && body[field] === undefined) continue
    const message = rule(body[field])
    if (message) fields[field] = message
  }
  const first = Object.values(fields)[0]
  if (first) throw badRequest(first, fields)
}

const len = (min, max, message) => (v) => {
  const s = String(v ?? '').trim()
  return s.length < min || s.length > max ? message : undefined
}
const optional = (rule) => (v) => (v === undefined || v === null || String(v).trim() === '' ? undefined : rule(v))
const PHONE = /^\+?[\d\s()-]{7,20}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRule = (v) => (PHONE.test(String(v ?? '').trim()) ? undefined : 'Please enter a valid phone number')
const emailRule = (v) => (EMAIL.test(String(v ?? '').trim()) ? undefined : 'Please enter a valid email address')

/** Today's date (YYYY-MM-DD) on the visitor's own calendar. */
const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const parseDate = (v) => {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Write failures: a rules rejection on valid-looking input means the data did not pass validation. */
function writeError(err) {
  const e = toApiError(err)
  if (e.status === 403 && !auth.currentUser) return apiError(400, 'Please check the information you entered.')
  if (e.status === 403) return apiError(403, 'The change was rejected. Please check the information and try again.')
  return e
}

/* ------------------------------------------------- admin live collections */

/**
 * The admin panel keeps one realtime listener per collection. The first call loads the collection;
 * later calls are served from memory, so list pages, the dashboard and polling cost no extra reads.
 * Changes from any device update the cache and are announced with emitLocalChange(collection).
 */
const live = new Map()

function liveCollection(name) {
  let entry = live.get(name)
  if (!entry) {
    entry = { docs: [], loaded: false }
    const current = entry
    entry.ready = new Promise((resolve, reject) => {
      current.unsub = onSnapshot(
        collection(db, name),
        (snap) => {
          current.docs = snap.docs.map(fromSnap).sort(byNewest)
          if (current.loaded) emitLocalChange(name)
          current.loaded = true
          resolve()
        },
        (err) => {
          live.delete(name)
          const e = toApiError(err)
          // The account lost admin access (or signed out elsewhere): end the session.
          if (e.status === 401 || e.status === 403) {
            window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'Your session has ended. Please log in again.' } }))
          }
          reject(e)
        },
      )
    })
    live.set(name, entry)
  }
  return entry.ready.then(() => entry.docs)
}

/** Stops every admin listener (on logout). */
function stopLive() {
  live.forEach((e) => e.unsub?.())
  live.clear()
}

const adminData = () =>
  Promise.all(['appointments', 'contacts', 'blogs'].map(liveCollection)).then(([appointments, contacts, blogs]) => ({
    appointments,
    contacts,
    blogs,
  }))

/* ---------------------------------------------------- public cached reads */

const PUBLIC_TTL = 60 * 1000
const publicCache = new Map()

/** Published blogs/services, cached briefly so moving between pages does not re-read them. */
function publishedDocs(name) {
  const hit = publicCache.get(name)
  if (hit && Date.now() - hit.at < PUBLIC_TTL) return hit.promise
  const promise = getDocs(query(collection(db, name), where('published', '==', true)))
    .then((snap) => snap.docs.map(fromSnap))
    .catch((err) => {
      publicCache.delete(name)
      throw toApiError(err)
    })
  publicCache.set(name, { at: Date.now(), promise })
  return promise
}

/* --------------------------------------------------------------------- auth */

let currentAdmin = null

async function loadAdmin(user) {
  const snap = await getDoc(doc(db, 'admins', user.uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return { id: user.uid, name: d.name || user.email, email: d.email || user.email, role: d.role || 'admin', createdAt: iso(d.createdAt) }
}

export const authApi = {
  /** Signs in and confirms the account is an admin. */
  async login({ email, password }) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, String(email).trim().toLowerCase(), String(password))
      const admin = await loadAdmin(user)
      if (!admin) {
        await signOut(auth)
        throw apiError(403, 'This account does not have access to the admin panel.')
      }
      currentAdmin = admin
      return { success: true, admin }
    } catch (err) {
      throw toApiError(err)
    }
  },
  /** The signed-in admin's profile; 401 when signed out, 403 when the account is not an admin. */
  async me() {
    await auth.authStateReady()
    const user = auth.currentUser
    if (!user) throw apiError(401, 'Your session has expired. Please log in again.')
    let admin
    try {
      admin = await loadAdmin(user)
    } catch (err) {
      throw toApiError(err)
    }
    if (!admin) throw apiError(403, 'This account does not have access to the admin panel.')
    currentAdmin = admin
    return { success: true, admin }
  },
  async logout() {
    stopLive()
    currentAdmin = null
    await signOut(auth).catch(() => {})
  },
  /** Subscribes to sign-in / sign-out (including other tabs). Returns an unsubscribe function. */
  onChange: (callback) => onAuthStateChanged(auth, callback),
}

/* ------------------------------------------------------------- appointments */

const APPOINTMENT_FIELDS = ['name', 'phone', 'email', 'date', 'time', 'service', 'message']

const appointmentRules = (isCreate) => ({
  name: len(2, 100, 'Please enter your full name'),
  phone: phoneRule,
  email: optional(emailRule),
  date: (v) => {
    const d = parseDate(v)
    if (!d) return 'Please choose a valid date'
    if (isCreate && String(v).slice(0, 10) < localToday()) return 'Please choose a date from today onward'
    return undefined
  },
  time: optional(len(0, 20, 'Please choose a valid time')),
  service: len(2, 120, 'Please select a service'),
  message: optional(len(0, 2000, 'Message is too long')),
})

/** Trimmed appointment fields; empty optional fields are removed (deleteField on update). */
function appointmentData(body, { forUpdate = false } = {}) {
  const data = {}
  for (const k of APPOINTMENT_FIELDS) {
    if (body[k] === undefined) continue
    if (k === 'date') {
      // The chosen calendar day is stored at UTC midnight (as before), e.g. 2026-03-07T00:00:00Z.
      data.date = Timestamp.fromDate(new Date(`${String(body.date).slice(0, 10)}T00:00:00Z`))
      continue
    }
    const v = trimmed(body[k])
    if (v) data[k] = k === 'email' ? v.toLowerCase() : v
    else if (forUpdate && ['email', 'time', 'message'].includes(k)) data[k] = deleteField()
  }
  return data
}

export const appointmentsApi = {
  /** Public booking form. */
  async create(payload) {
    validate(payload, appointmentRules(true))
    try {
      const ref = await addDoc(collection(db, 'appointments'), {
        ...appointmentData(payload),
        status: 'Pending', // never accepted from the form
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return {
        success: true,
        message: 'Appointment request received. Our team will contact you shortly.',
        appointment: { id: ref.id, status: 'Pending' },
      }
    } catch (err) {
      throw writeError(err)
    }
  },
  /** Admin list: ?status=&search=&page=&limit= */
  async list(params = {}) {
    const docs = await liveCollection('appointments')
    const status = APPOINTMENT_STATUSES.includes(params.status) ? params.status : ''
    const match = textMatcher(params.search)
    const filtered = docs.filter((a) => (!status || a.status === status) && (!match || match([a.name, a.phone, a.email, a.service])))
    return { success: true, ...paginate(filtered, params) }
  },
  async get(id) {
    const found = (await liveCollection('appointments')).find((a) => a._id === id)
    if (!found) throw notFound('Appointment not found')
    return { success: true, data: found }
  },
  /** Admin: update status and/or details. */
  async update(id, payload) {
    validate(payload, appointmentRules(false), { partial: true })
    if (payload.status !== undefined && !APPOINTMENT_STATUSES.includes(payload.status)) {
      throw badRequest(`Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`, { status: 'Invalid status' })
    }
    const ref = doc(db, 'appointments', id)
    try {
      await updateDoc(ref, {
        ...appointmentData(payload, { forUpdate: true }),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        updatedAt: serverTimestamp(),
      })
      return { success: true, message: 'Appointment updated', data: fromSnap(await getDoc(ref)) }
    } catch (err) {
      throw writeError(err)
    }
  },
  async remove(id) {
    try {
      await deleteDoc(doc(db, 'appointments', id))
      return { success: true, message: 'Appointment deleted' }
    } catch (err) {
      throw writeError(err)
    }
  },
}

/* ------------------------------------------------------------------ contacts */

const contactRules = {
  name: len(2, 100, 'Please enter your name'),
  email: emailRule,
  phone: optional(phoneRule),
  message: len(10, 3000, 'Message must be 10–3000 characters'),
}

export const contactsApi = {
  /** Public contact form and newsletter signup. */
  async create(payload) {
    validate(payload, contactRules)
    const phone = trimmed(payload.phone)
    try {
      await addDoc(collection(db, 'contacts'), {
        name: trimmed(payload.name),
        email: trimmed(payload.email).toLowerCase(),
        ...(phone ? { phone } : {}),
        message: trimmed(payload.message),
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, message: 'Thank you! Your message has been sent.' }
    } catch (err) {
      throw writeError(err)
    }
  },
  /** Admin list: ?status=&search=&page=&limit= */
  async list(params = {}) {
    const docs = await liveCollection('contacts')
    const status = CONTACT_STATUSES.includes(params.status) ? params.status : ''
    const match = textMatcher(params.search)
    const filtered = docs.filter((c) => (!status || c.status === status) && (!match || match([c.name, c.email, c.phone, c.message])))
    return { success: true, ...paginate(filtered, params) }
  },
  async get(id) {
    const found = (await liveCollection('contacts')).find((c) => c._id === id)
    if (!found) throw notFound('Message not found')
    return { success: true, data: found }
  },
  /** Admin: mark as read / unread. */
  async setStatus(id, status) {
    if (!CONTACT_STATUSES.includes(status)) throw badRequest(`Status must be one of: ${CONTACT_STATUSES.join(', ')}`)
    const ref = doc(db, 'contacts', id)
    try {
      await updateDoc(ref, { status, updatedAt: serverTimestamp() })
      return { success: true, message: `Marked as ${status.toLowerCase()}`, data: fromSnap(await getDoc(ref)) }
    } catch (err) {
      throw writeError(err)
    }
  },
  async remove(id) {
    try {
      await deleteDoc(doc(db, 'contacts', id))
      return { success: true, message: 'Message deleted' }
    } catch (err) {
      throw writeError(err)
    }
  },
}

/* --------------------------------------------------------------------- blogs */

const blogRules = {
  title: len(3, 180, 'Title must be 3–180 characters'),
  content: (v) => (String(v ?? '').trim().length < 20 ? 'Content must be at least 20 characters' : undefined),
  excerpt: optional(len(0, 400, 'Excerpt must be 400 characters or fewer')),
  category: optional(len(0, 60, 'Category must be 60 characters or fewer')),
  author: optional(len(0, 80, 'Author must be 80 characters or fewer')),
  slug: optional(len(0, 120, 'Slug must be 120 characters or fewer')),
}

function blogData(values) {
  const data = {}
  for (const k of ['title', 'excerpt', 'content', 'category', 'author']) {
    if (values[k] !== undefined) data[k] = String(values[k]).trim()
  }
  if (values.published !== undefined) data.published = toBool(values.published)
  return data
}

export const blogsApi = {
  /**
   * ?category=&search=&page=&limit=&all=
   * Public: published posts only. A signed-in admin can pass all=true to include drafts.
   */
  async list(params = {}) {
    const includeDrafts = toBool(params.all) && !!currentAdmin
    const docs = includeDrafts ? await liveCollection('blogs') : await publishedDocs('blogs')
    const category = String(params.category || '').trim()
    const search = String(params.search || '').trim().slice(0, 80).toLowerCase()
    const filtered = docs
      .filter((b) => (!category || category === 'All' || b.category === category) && (!search || b.title.toLowerCase().includes(search)))
      .sort(byNewest)
    const categories = [...new Set(docs.map((b) => b.category).filter(Boolean))].sort()
    const page = paginate(filtered, params, { defaultLimit: 12, maxLimit: 50 })
    return { success: true, data: page.data.map(withReadTime), categories, pagination: page.pagination }
  },
  /** Published article by slug (admins may preview drafts) plus up to 3 related posts. */
  async getBySlug(slug) {
    const key = String(slug).toLowerCase()
    const published = await publishedDocs('blogs')
    let blog = published.find((b) => b.slug === key)
    if (!blog && currentAdmin) blog = (await liveCollection('blogs')).find((b) => b.slug === key)
    if (!blog) throw notFound('Article not found')

    // Prefer same-category posts, then fill up with the most recent others.
    const others = published.filter((b) => b._id !== blog._id).sort(byNewest)
    const related = [...others.filter((b) => b.category === blog.category), ...others.filter((b) => b.category !== blog.category)].slice(0, 3)
    return { success: true, data: withReadTime(blog), related: related.map(withReadTime) }
  },
  /** Admin: used by the edit form. */
  async getById(id) {
    try {
      const snap = await getDoc(doc(db, 'blogs', id))
      if (!snap.exists()) throw notFound('Article not found')
      return { success: true, data: withReadTime(fromSnap(snap)) }
    } catch (err) {
      throw toApiError(err)
    }
  },
  /** Admin: values may include a featuredImage File. */
  async create(values) {
    validate(values, blogRules)
    const all = await liveCollection('blogs')
    const data = {
      category: 'Wellness',
      author: 'Nawa Ayurveda Team',
      published: false,
      ...blogData(values),
      slug: uniqueSlug(all, values.slug || values.title),
      featuredImage: await imageValue(values.featuredImage),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    if (!data.category) data.category = 'Wellness'
    if (!data.author) data.author = 'Nawa Ayurveda Team'
    try {
      const ref = await addDoc(collection(db, 'blogs'), data)
      publicCache.delete('blogs')
      return { success: true, message: 'Article created', data: withReadTime(fromSnap(await getDoc(ref))) }
    } catch (err) {
      throw writeError(err)
    }
  },
  /** Admin: partial update; removeImage=true clears the featured image. */
  async update(id, values) {
    validate(values, blogRules, { partial: true })
    const all = await liveCollection('blogs')
    const current = all.find((b) => b._id === id)
    if (!current) throw notFound('Article not found')

    const data = blogData(values)
    // Slugs stay stable (published URLs) unless the admin edits the slug explicitly.
    const newSlug = String(values.slug || '').trim()
    if (newSlug && newSlug !== current.slug) data.slug = uniqueSlug(all, newSlug, id)
    const image = await imageValue(values.featuredImage)
    if (image) data.featuredImage = image
    else if (toBool(values.removeImage)) data.featuredImage = deleteField()

    const ref = doc(db, 'blogs', id)
    try {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
      publicCache.delete('blogs')
      return { success: true, message: 'Article updated', data: withReadTime(fromSnap(await getDoc(ref))) }
    } catch (err) {
      throw writeError(err)
    }
  },
  setPublished: (id, published) => blogsApi.update(id, { published }),
  async remove(id) {
    try {
      await deleteDoc(doc(db, 'blogs', id))
      publicCache.delete('blogs')
      return { success: true, message: 'Article deleted' }
    } catch (err) {
      throw writeError(err)
    }
  },
}

/* ------------------------------------------------------------------ services */

const serviceRules = {
  name: len(2, 120, 'Name must be 2–120 characters'),
  shortDescription: optional(len(0, 300, 'Short description must be 300 characters or fewer')),
  description: optional(len(0, 5000, 'Description must be 5000 characters or fewer')),
  slug: optional(len(0, 120, 'Slug must be 120 characters or fewer')),
  order: (v) => (v === undefined || v === '' || Number.isFinite(Number(v)) ? undefined : 'Order must be a number'),
}

function serviceData(values) {
  const data = {}
  for (const k of ['name', 'shortDescription', 'description']) {
    if (values[k] !== undefined) data[k] = String(values[k]).trim()
  }
  if (values.published !== undefined) data.published = toBool(values.published)
  if (values.order !== undefined) data.order = Number(values.order) || 0
  if (Array.isArray(values.benefits)) {
    data.benefits = values.benefits.map((b) => String(b).trim()).filter(Boolean).slice(0, 20)
  }
  if (Array.isArray(values.process)) {
    data.process = values.process
      .map((p) => ({ title: String(p?.title || '').trim().slice(0, 80), text: String(p?.text || '').trim().slice(0, 400) }))
      .filter((p) => p.title)
      .slice(0, 20)
  }
  return data
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || time(a.createdAt) - time(b.createdAt)

export const servicesApi = {
  /** Published services in display order; a signed-in admin can pass all=true. */
  async list(params = {}) {
    const docs = toBool(params.all) && currentAdmin ? await liveCollection('services') : await publishedDocs('services')
    return { success: true, data: [...docs].sort(byOrder) }
  },
  async getBySlug(slug) {
    const key = String(slug).toLowerCase()
    let service = (await publishedDocs('services')).find((s) => s.slug === key)
    if (!service && currentAdmin) service = (await liveCollection('services')).find((s) => s.slug === key)
    if (!service) throw notFound('Service not found')
    return { success: true, data: service }
  },
  /** Admin: values may include an image File. */
  async create(values) {
    validate(values, serviceRules)
    const all = await liveCollection('services')
    const data = {
      benefits: [],
      process: [],
      published: true,
      order: 0,
      ...serviceData(values),
      slug: uniqueSlug(all, values.slug || values.name),
      image: await imageValue(values.image),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    try {
      const ref = await addDoc(collection(db, 'services'), data)
      publicCache.delete('services')
      return { success: true, message: 'Service created', data: fromSnap(await getDoc(ref)) }
    } catch (err) {
      throw writeError(err)
    }
  },
  async update(id, values) {
    validate(values, serviceRules, { partial: true })
    const all = await liveCollection('services')
    const current = all.find((s) => s._id === id)
    if (!current) throw notFound('Service not found')

    const data = serviceData(values)
    const newSlug = String(values.slug || '').trim()
    if (newSlug && newSlug !== current.slug) data.slug = uniqueSlug(all, newSlug, id)
    const image = await imageValue(values.image)
    if (image) data.image = image

    const ref = doc(db, 'services', id)
    try {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
      publicCache.delete('services')
      return { success: true, message: 'Service updated', data: fromSnap(await getDoc(ref)) }
    } catch (err) {
      throw writeError(err)
    }
  },
  setPublished: (id, published) => servicesApi.update(id, { published }),
  async remove(id) {
    try {
      await deleteDoc(doc(db, 'services', id))
      publicCache.delete('services')
      return { success: true, message: 'Service deleted' }
    } catch (err) {
      throw writeError(err)
    }
  },
}

/* ---------------------------------------------------------------- dashboard */

export const dashboardApi = {
  /** Headline counts plus recent activity (sidebar badges). */
  async get() {
    const [{ appointments, contacts, blogs }, services] = await Promise.all([adminData(), liveCollection('services')])
    const count = (status) => appointments.filter((a) => a.status === status).length
    return {
      success: true,
      data: {
        stats: {
          totalAppointments: appointments.length,
          pendingAppointments: count('Pending'),
          confirmedAppointments: count('Confirmed'),
          completedAppointments: count('Completed'),
          cancelledAppointments: count('Cancelled'),
          totalBlogs: blogs.length,
          publishedBlogs: blogs.filter((b) => b.published).length,
          totalContacts: contacts.length,
          newContacts: contacts.filter((c) => c.status === 'New').length,
          totalServices: services.length,
        },
        recentAppointments: appointments.slice(0, 5),
        recentBlogs: blogs.slice(0, 5).map(({ _id, title, slug, category, published, createdAt }) => ({ _id, title, slug, category, published, createdAt })),
      },
    }
  },
}

/* ---------------------------------------------------------------- analytics */

/**
 * Analytics. `filter` = { period, month, year, from, to, basis }.
 * Computed in the browser from the live collections (see ./analytics), loaded on demand so the
 * public website never downloads this code.
 */
const periodParams = ({ period, month, year, from, to, basis }) => {
  const p = { basis }
  if (period === 'month') Object.assign(p, { month, year })
  if (period === 'year') Object.assign(p, { year })
  if (period === 'custom') Object.assign(p, { from, to })
  return p
}

async function analytics(fn) {
  const [mod, data] = await Promise.all([import('./analytics/index.js'), adminData()])
  return { success: true, data: fn(mod, data) }
}

export const analyticsApi = {
  overview: () => analytics((a, data) => a.overview(data)),
  summary: (filter) => analytics((a, data) => a.periodSummary(filter.period, periodParams(filter), data)),
  services: (filter) => analytics((a, data) => a.servicesAnalytics({ period: filter.period, ...periodParams(filter) }, data)),
  /**
   * Appointment report by scheduled date.
   * params: { period: all|today|week|month|year|custom, month, year, from, to, search, status, service, page, limit, export }
   */
  appointments: (params = {}) => analytics((a, data) => a.appointmentsAnalytics(params, data)),
}
