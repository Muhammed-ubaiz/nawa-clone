import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { fileToImageDataUrl } from '../utils/imageData'
import {
  APPOINTMENT_STATUSES,
  blogCounts,
  contactCounts,
  describe,
  serviceShares,
  statusCounts,
  timeline,
  topServices,
} from './analytics'
import { BASES, CLINIC_TZ, badRequest, boundsFor, calendar, clinicToday, resolvePeriod } from './dateRange'

/*
 * Data layer backed directly by Firebase (Firestore + Authentication).
 *
 * Every export keeps the request/response shape of the former REST API
 * ({ success, data, pagination, ... }, ids as `_id`, dates as ISO strings) so pages and
 * components are unchanged. Access control lives in /firestore.rules.
 */

// ------------------------------------------------------------------ errors

const DEFAULT_MESSAGES = {
  400: 'Please check the information you entered.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'The requested item could not be found.',
  409: 'This item already exists.',
  413: 'The file is too large.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
}

const FIREBASE_STATUS = {
  'permission-denied': 403,
  unauthenticated: 401,
  'not-found': 404,
  'already-exists': 409,
  'resource-exhausted': 429,
  unavailable: 0,
  'deadline-exceeded': 0,
  'invalid-argument': 400,
  'failed-precondition': 400,
  'auth/invalid-credential': 401,
  'auth/invalid-email': 401,
  'auth/user-not-found': 401,
  'auth/wrong-password': 401,
  'auth/user-disabled': 403,
  'auth/too-many-requests': 429,
  'auth/network-request-failed': 0,
}

/** Error with the same fields the REST client exposed: message, status (0 = network), fields. */
const apiError = (status, message, fields = {}) =>
  Object.assign(new Error(message || DEFAULT_MESSAGES[status] || DEFAULT_MESSAGES[500]), { status, fields })

const notFound = (message) => apiError(404, message)

/** Normalises Firebase failures into apiError; errors we raised ourselves pass through. */
function normalizeError(err) {
  if (!(err instanceof FirebaseError)) return err?.status !== undefined ? err : apiError(500, import.meta.env.DEV ? err?.message : undefined)
  let status = FIREBASE_STATUS[err.code] ?? 500
  // Firestore reports a missing sign-in as permission-denied.
  if (status === 403 && !auth.currentUser) status = 401
  if (import.meta.env.DEV) console.warn('[firebase]', err.code, err.message)
  const message =
    status === 0
      ? 'Cannot reach the server. Please check your connection and try again.'
      : status === 401 && err.code.startsWith('auth/')
        ? 'Invalid email or password.'
        : DEFAULT_MESSAGES[status] || DEFAULT_MESSAGES[500]
  return apiError(status, message)
}

/** Wraps an async implementation so every rejection is normalised. */
const call =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      throw normalizeError(err)
    }
  }

/** Throws a 400 with { field: message } like the API's validation middleware. */
function assertValid(errors) {
  const entries = Object.entries(errors).filter(([, msg]) => msg)
  if (entries.length) throw apiError(400, entries[0][1], Object.fromEntries(entries))
}

// ---------------------------------------------------------------- helpers

/** Firestore Timestamps -> ISO strings, recursively (mirrors the JSON the API returned). */
function plain(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(plain)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]))
  return value
}

const fromDoc = (snap) => ({ _id: snap.id, ...plain(snap.data()) })

const readTime = (content = '') => `${Math.max(1, Math.round(String(content).split(/\s+/).filter(Boolean).length / 200))} min read`
const blogFromDoc = (snap) => {
  const b = fromDoc(snap)
  return { ...b, id: b._id, readTime: readTime(b.content) }
}

const byNewest = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')
const byOldest = (a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')

const toBool = (v) => v === true || v === 'true' || v === '1' || v === 'on'
const toInt = (v, fallback) => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? fallback : n
}

/** Page/limit handling identical to the API (limits clamped, pages >= 1). */
function paginate(items, page, limit) {
  const total = items.length
  return {
    data: items.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  }
}

const ci = (q) => {
  const needle = String(q || '').trim().slice(0, 80).toLowerCase()
  return needle ? (v) => String(v || '').toLowerCase().includes(needle) : null
}

/** Converts a "YYYY-MM-DD" (or ISO) date into the stored Timestamp at UTC midnight of that day. */
function dateToTimestamp(value) {
  const day = calendar.parse(String(value || '').slice(0, 10))
  return day ? Timestamp.fromMillis(calendar.toUTC(day)) : null
}

const ts = (date) => Timestamp.fromDate(date)

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

/** Slug unique within the collection, appending -2, -3 ... (admin-only: reads drafts too). */
async function uniqueSlug(name, base, excludeId) {
  const root = slugify(base) || 'item'
  let slug = root
  for (let n = 2; ; n++) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await getDocs(query(collection(db, name), where('slug', '==', slug), limitTo(2)))
    if (!snap.docs.some((d) => d.id !== excludeId)) return slug
    slug = `${root}-${n}`
  }
}

/** Image field: a newly chosen File is compressed to a data URL; an https URL is kept as-is. */
async function readImage(value) {
  if (typeof File !== 'undefined' && value instanceof File) return fileToImageDataUrl(value)
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return value
  return undefined
}

const isAdminSignedIn = () => !!auth.currentUser

// ------------------------------------------------------------- validation

const PHONE_RX = /^\+?[\d\s()-]{7,20}$/
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const str = (v) => (v === undefined || v === null ? '' : String(v).trim())
const len = (v, min, max) => v.length >= min && v.length <= max

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function appointmentData(payload, partial) {
  const has = (k) => payload[k] !== undefined
  const out = {}
  const errors = {}
  const need = (k) => !partial || has(k)

  if (need('name')) {
    out.name = str(payload.name)
    if (!len(out.name, 2, 100)) errors.name = 'Please enter your full name'
  }
  if (need('phone')) {
    out.phone = str(payload.phone)
    if (!PHONE_RX.test(out.phone)) errors.phone = 'Please enter a valid phone number'
  }
  if (has('email')) {
    const email = str(payload.email).toLowerCase()
    if (email && (!EMAIL_RX.test(email) || email.length > 120)) errors.email = 'Please enter a valid email address'
    out.email = email || null
  }
  if (need('date')) {
    const date = dateToTimestamp(payload.date)
    if (!date) errors.date = 'Please choose a valid date'
    else if (!partial && String(payload.date).slice(0, 10) < todayISO()) errors.date = 'Please choose a date from today onward'
    out.date = date
  }
  if (has('time')) {
    out.time = str(payload.time).slice(0, 20) || null
  }
  if (need('service')) {
    out.service = str(payload.service)
    if (!len(out.service, 2, 120)) errors.service = 'Please select a service'
  }
  if (has('message')) {
    const message = str(payload.message)
    if (message.length > 2000) errors.message = 'Message is too long'
    out.message = message || null
  }
  if (has('status')) {
    out.status = String(payload.status)
    if (!APPOINTMENT_STATUSES.includes(out.status)) errors.status = `Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`
  }
  assertValid(errors)
  return out
}

/** Drops empty optional fields: new documents must omit them; updates delete them. */
function withoutNulls(data, removeWith) {
  return Object.fromEntries(
    Object.entries(data)
      .map(([k, v]) => [k, v === null ? removeWith : v])
      .filter(([, v]) => v !== undefined),
  )
}

// ------------------------------------------------------------------- auth

async function loadAdmin(user) {
  const snap = await getDoc(doc(db, 'admins', user.uid))
  if (!snap.exists()) return null
  const a = plain(snap.data())
  return { id: user.uid, name: a.name, email: a.email || user.email, role: a.role, createdAt: a.createdAt }
}

export const authApi = {
  /** Signs in with Firebase Authentication; only accounts with an admins/{uid} profile may continue. */
  login: call(async ({ email, password }) => {
    const { user } = await signInWithEmailAndPassword(auth, String(email || '').trim().toLowerCase(), String(password || ''))
    const admin = await loadAdmin(user)
    if (!admin) {
      await signOut(auth)
      throw apiError(403, 'This account does not have admin access.')
    }
    return { success: true, admin }
  }),
  me: call(async () => {
    if (!auth.currentUser) throw apiError(401, 'Please log in to continue.')
    const admin = await loadAdmin(auth.currentUser)
    if (!admin) throw apiError(401, 'Account no longer exists.')
    return { success: true, admin }
  }),
  logout: () => signOut(auth),
}

// ---------------------------------------------------------- appointments

const appointmentsCol = () => collection(db, 'appointments')

async function allAppointments(order = 'createdAt') {
  const snap = await getDocs(query(appointmentsCol(), orderBy(order, 'desc')))
  return snap.docs.map(fromDoc)
}

/** Appointments whose `field` (createdAt | date) falls inside the bounds. */
async function appointmentsIn(field, bounds) {
  const snap = await getDocs(query(appointmentsCol(), where(field, '>=', ts(bounds.gte)), where(field, '<', ts(bounds.lt))))
  return snap.docs.map(fromDoc)
}

const countWhere = async (col, ...constraints) => (await getCountFromServer(query(collection(db, col), ...constraints))).data().count
const countIn = (col, field, bounds) => countWhere(col, where(field, '>=', ts(bounds.gte)), where(field, '<', ts(bounds.lt)))

export const appointmentsApi = {
  create: call(async (payload) => {
    const data = withoutNulls(appointmentData(payload, false))
    const ref = await addDoc(appointmentsCol(), { ...data, status: 'Pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return {
      success: true,
      message: 'Appointment request received. Our team will contact you shortly.',
      appointment: { id: ref.id, status: 'Pending' },
    }
  }),
  list: call(async (params = {}) => {
    const page = Math.max(1, toInt(params.page, 1))
    const limit = Math.min(100, Math.max(1, toInt(params.limit, 20)))
    const status = String(params.status || '')
    const match = ci(params.search)
    let items = await allAppointments()
    if (APPOINTMENT_STATUSES.includes(status)) items = items.filter((a) => a.status === status)
    if (match) items = items.filter((a) => match(a.name) || match(a.phone) || match(a.email) || match(a.service))
    return { success: true, ...paginate(items, page, limit) }
  }),
  get: call(async (id) => {
    const snap = await getDoc(doc(db, 'appointments', id))
    if (!snap.exists()) throw notFound('Appointment not found')
    return { success: true, data: fromDoc(snap) }
  }),
  update: call(async (id, payload) => {
    const ref = doc(db, 'appointments', id)
    const data = withoutNulls(appointmentData(payload, true), deleteField())
    if (!(await getDoc(ref)).exists()) throw notFound('Appointment not found')
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return { success: true, message: 'Appointment updated', data: fromDoc(await getDoc(ref)) }
  }),
  remove: call(async (id) => {
    const ref = doc(db, 'appointments', id)
    if (!(await getDoc(ref)).exists()) throw notFound('Appointment not found')
    await deleteDoc(ref)
    return { success: true, message: 'Appointment deleted' }
  }),
}

// ------------------------------------------------------------------ blogs

const blogsCol = () => collection(db, 'blogs')

/** Published posts for everyone; every post (drafts too) when an admin asks for all. */
async function loadBlogs(includeDrafts) {
  const snap = await getDocs(includeDrafts ? blogsCol() : query(blogsCol(), where('published', '==', true)))
  return snap.docs.map(blogFromDoc).sort(byNewest)
}

const withoutContent = ({ content: _content, ...rest }) => rest

function blogData(values, partial) {
  const errors = {}
  const out = {}
  const has = (k) => values[k] !== undefined
  if (!partial || has('title')) {
    out.title = str(values.title)
    if (!len(out.title, 3, 180)) errors.title = 'Title must be 3–180 characters'
  }
  if (!partial || has('content')) {
    out.content = str(values.content)
    if (out.content.length < 20) errors.content = 'Content must be at least 20 characters'
  }
  if (has('excerpt')) {
    out.excerpt = str(values.excerpt)
    if (out.excerpt.length > 400) errors.excerpt = 'Excerpt must be 400 characters or fewer'
  }
  if (has('category')) out.category = str(values.category).slice(0, 60)
  if (has('author')) out.author = str(values.author).slice(0, 80)
  if (has('published')) out.published = toBool(values.published)
  if (has('slug') && str(values.slug).length > 120) errors.slug = 'Slug must be 120 characters or fewer'
  assertValid(errors)
  return out
}

export const blogsApi = {
  /** params: { category, search, page, limit, all } — same semantics as GET /api/blogs. */
  list: call(async (params = {}) => {
    const page = Math.max(1, toInt(params.page, 1))
    const limit = Math.min(50, Math.max(1, toInt(params.limit, 12)))
    const includeDrafts = isAdminSignedIn() && toBool(params.all)
    const posts = await loadBlogs(includeDrafts)

    const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))].sort()
    const category = String(params.category || '').trim()
    const match = ci(params.search)
    let items = posts
    if (category && category !== 'All') items = items.filter((p) => p.category === category)
    if (match) items = items.filter((p) => match(p.title))
    const { data, pagination } = paginate(items, page, limit)
    return { success: true, data: includeDrafts ? data : data.map(withoutContent), categories, pagination }
  }),
  /** Single published post (admins may preview drafts) plus up to 3 related posts. */
  getBySlug: call(async (slug) => {
    const s = String(slug || '').toLowerCase()
    const constraints = [where('slug', '==', s)]
    if (!isAdminSignedIn()) constraints.push(where('published', '==', true))
    const snap = await getDocs(query(blogsCol(), ...constraints, limitTo(1)))
    if (snap.empty) throw notFound('Article not found')
    const post = blogFromDoc(snap.docs[0])

    // Prefer same-category posts, then fill up with the most recent others.
    const others = (await loadBlogs(false)).filter((p) => p._id !== post._id)
    const same = others.filter((p) => p.category === post.category).slice(0, 3)
    const rest = same.length < 3 ? others.filter((p) => p.category !== post.category).slice(0, 3 - same.length) : []
    return { success: true, data: post, related: [...same, ...rest].map(withoutContent) }
  }),
  getById: call(async (id) => {
    const snap = await getDoc(doc(db, 'blogs', id))
    if (!snap.exists()) throw notFound('Article not found')
    return { success: true, data: blogFromDoc(snap) }
  }),
  create: call(async (values) => {
    const data = blogData(values, false)
    data.slug = await uniqueSlug('blogs', values.slug || data.title)
    const image = await readImage(values.featuredImage)
    const ref = await addDoc(blogsCol(), {
      excerpt: '',
      category: 'Wellness',
      author: 'Nawa Ayurveda Team',
      published: false,
      ...data,
      ...(image ? { featuredImage: image } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { success: true, message: 'Article created', data: blogFromDoc(await getDoc(ref)) }
  }),
  update: call(async (id, values) => {
    const ref = doc(db, 'blogs', id)
    const current = await getDoc(ref)
    if (!current.exists()) throw notFound('Article not found')

    const data = blogData(values, true)
    // Slugs stay stable (published URLs) unless the admin edits the slug explicitly.
    const newSlug = str(values.slug)
    if (newSlug && newSlug !== current.data().slug) data.slug = await uniqueSlug('blogs', newSlug, id)

    const image = await readImage(values.featuredImage)
    if (image) data.featuredImage = image
    else if (toBool(values.removeImage)) data.featuredImage = deleteField()

    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return { success: true, message: 'Article updated', data: blogFromDoc(await getDoc(ref)) }
  }),
  setPublished: (id, published) => blogsApi.update(id, { published }),
  remove: call(async (id) => {
    const ref = doc(db, 'blogs', id)
    if (!(await getDoc(ref)).exists()) throw notFound('Article not found')
    await deleteDoc(ref)
    return { success: true, message: 'Article deleted' }
  }),
}

// --------------------------------------------------------------- services

const servicesCol = () => collection(db, 'services')
const serviceOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || byOldest(a, b)

function serviceData(values, partial) {
  const errors = {}
  const out = {}
  const has = (k) => values[k] !== undefined
  if (!partial || has('name')) {
    out.name = str(values.name)
    if (!len(out.name, 2, 120)) errors.name = 'Name must be 2–120 characters'
  }
  if (has('shortDescription')) {
    out.shortDescription = str(values.shortDescription)
    if (out.shortDescription.length > 300) errors.shortDescription = 'Short description must be 300 characters or fewer'
  }
  if (has('description')) {
    out.description = str(values.description)
    if (out.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer'
  }
  if (has('published')) out.published = toBool(values.published)
  if (has('order')) out.order = Number(values.order) || 0
  if (has('benefits')) {
    out.benefits = (Array.isArray(values.benefits) ? values.benefits : []).map((b) => str(b)).filter(Boolean).slice(0, 20)
  }
  if (has('process')) {
    out.process = (Array.isArray(values.process) ? values.process : [])
      .map((p) => ({ title: str(p?.title).slice(0, 80), text: str(p?.text).slice(0, 400) }))
      .filter((p) => p.title)
      .slice(0, 20)
  }
  if (has('slug') && str(values.slug).length > 120) errors.slug = 'Slug must be 120 characters or fewer'
  assertValid(errors)
  return out
}

export const servicesApi = {
  /** Published services; admins can pass { all: true }. */
  list: call(async (params = {}) => {
    const all = isAdminSignedIn() && toBool(params.all)
    const snap = await getDocs(all ? servicesCol() : query(servicesCol(), where('published', '==', true)))
    return { success: true, data: snap.docs.map(fromDoc).sort(serviceOrder) }
  }),
  getBySlug: call(async (slug) => {
    const constraints = [where('slug', '==', String(slug || '').toLowerCase())]
    if (!isAdminSignedIn()) constraints.push(where('published', '==', true))
    const snap = await getDocs(query(servicesCol(), ...constraints, limitTo(1)))
    if (snap.empty) throw notFound('Service not found')
    return { success: true, data: fromDoc(snap.docs[0]) }
  }),
  create: call(async (values) => {
    const data = serviceData(values, false)
    data.slug = await uniqueSlug('services', values.slug || data.name)
    const image = await readImage(values.image)
    const ref = await addDoc(servicesCol(), {
      shortDescription: '',
      description: '',
      benefits: [],
      process: [],
      published: true,
      order: 0,
      ...data,
      ...(image ? { image } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { success: true, message: 'Service created', data: fromDoc(await getDoc(ref)) }
  }),
  update: call(async (id, values) => {
    const ref = doc(db, 'services', id)
    const current = await getDoc(ref)
    if (!current.exists()) throw notFound('Service not found')
    const data = serviceData(values, true)
    const newSlug = str(values.slug)
    if (newSlug && newSlug !== current.data().slug) data.slug = await uniqueSlug('services', newSlug, id)
    const image = await readImage(values.image)
    if (image) data.image = image
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return { success: true, message: 'Service updated', data: fromDoc(await getDoc(ref)) }
  }),
  setPublished: (id, published) => servicesApi.update(id, { published }),
  remove: call(async (id) => {
    const ref = doc(db, 'services', id)
    if (!(await getDoc(ref)).exists()) throw notFound('Service not found')
    await deleteDoc(ref)
    return { success: true, message: 'Service deleted' }
  }),
}

// --------------------------------------------------------------- contacts

const CONTACT_STATUSES = ['New', 'Read']
const contactsCol = () => collection(db, 'contacts')

export const contactsApi = {
  create: call(async (payload) => {
    const errors = {}
    const name = str(payload.name)
    const email = str(payload.email).toLowerCase()
    const phone = str(payload.phone)
    const message = str(payload.message)
    if (!len(name, 2, 100)) errors.name = 'Please enter your name'
    if (!EMAIL_RX.test(email) || email.length > 120) errors.email = 'Please enter a valid email address'
    if (phone && !PHONE_RX.test(phone)) errors.phone = 'Please enter a valid phone number'
    if (!len(message, 10, 3000)) errors.message = 'Message must be 10–3000 characters'
    assertValid(errors)
    await addDoc(contactsCol(), {
      name,
      email,
      ...(phone ? { phone } : {}),
      message,
      status: 'New',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { success: true, message: 'Thank you! Your message has been sent.' }
  }),
  list: call(async (params = {}) => {
    const page = Math.max(1, toInt(params.page, 1))
    const limit = Math.min(100, Math.max(1, toInt(params.limit, 20)))
    const status = String(params.status || '')
    const match = ci(params.search)
    const snap = await getDocs(query(contactsCol(), orderBy('createdAt', 'desc')))
    let items = snap.docs.map(fromDoc)
    if (CONTACT_STATUSES.includes(status)) items = items.filter((c) => c.status === status)
    if (match) items = items.filter((c) => match(c.name) || match(c.email) || match(c.phone) || match(c.message))
    return { success: true, ...paginate(items, page, limit) }
  }),
  get: call(async (id) => {
    const snap = await getDoc(doc(db, 'contacts', id))
    if (!snap.exists()) throw notFound('Message not found')
    return { success: true, data: fromDoc(snap) }
  }),
  setStatus: call(async (id, status) => {
    if (!CONTACT_STATUSES.includes(status)) throw apiError(400, `Status must be one of: ${CONTACT_STATUSES.join(', ')}`)
    const ref = doc(db, 'contacts', id)
    if (!(await getDoc(ref)).exists()) throw notFound('Message not found')
    await updateDoc(ref, { status, updatedAt: serverTimestamp() })
    return { success: true, message: `Marked as ${status.toLowerCase()}`, data: fromDoc(await getDoc(ref)) }
  }),
  remove: call(async (id) => {
    const ref = doc(db, 'contacts', id)
    if (!(await getDoc(ref)).exists()) throw notFound('Message not found')
    await deleteDoc(ref)
    return { success: true, message: 'Message deleted' }
  }),
}

// -------------------------------------------------------------- dashboard

const recent = async (col, n) => (await getDocs(query(collection(db, col), orderBy('createdAt', 'desc'), limitTo(n)))).docs.map(fromDoc)

export const dashboardApi = {
  /** Headline counts plus recent activity (sidebar badges). */
  get: call(async () => {
    const [byStatus, totalAppointments, totalBlogs, publishedBlogs, totalContacts, newContacts, totalServices, recentAppointments, recentBlogs] =
      await Promise.all([
        Promise.all(APPOINTMENT_STATUSES.map((s) => countWhere('appointments', where('status', '==', s)))),
        countWhere('appointments'),
        countWhere('blogs'),
        countWhere('blogs', where('published', '==', true)),
        countWhere('contacts'),
        countWhere('contacts', where('status', '==', 'New')),
        countWhere('services'),
        recent('appointments', 5),
        recent('blogs', 5),
      ])
    const [pending, confirmed, completed, cancelled] = byStatus
    return {
      success: true,
      data: {
        stats: {
          totalAppointments,
          pendingAppointments: pending,
          confirmedAppointments: confirmed,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
          totalBlogs,
          publishedBlogs,
          totalContacts,
          newContacts,
          totalServices,
        },
        recentAppointments,
        recentBlogs: recentBlogs.map(({ _id, title, slug, category, published, createdAt }) => ({ _id, title, slug, category, published, createdAt })),
      },
    }
  }),
}

// -------------------------------------------------------------- analytics

/** Reads basis + range from a dashboard filter ({ period, month, year, from, to, basis }). */
function readRange(filter = {}, forcedPeriod) {
  const basis = String(filter.basis || 'created')
  if (!BASES.includes(basis)) throw badRequest(`basis must be one of: ${BASES.join(', ')}`)
  const range = resolvePeriod({ period: forcedPeriod || String(filter.period || 'month'), month: filter.month, year: filter.year, from: filter.from, to: filter.to })
  return { range, basis, bounds: boundsFor(range, basis) }
}

const apptField = (basis) => (basis === 'scheduled' ? 'date' : 'createdAt')
const createdIn = async (col, bounds) =>
  (await getDocs(query(collection(db, col), where('createdAt', '>=', ts(bounds.gte)), where('createdAt', '<', ts(bounds.lt))))).docs.map(fromDoc)

/** Everything the dashboard needs for one period. */
async function buildSummary(range, basis) {
  const bounds = boundsFor(range, basis)
  // Contacts and blogs only have a creation date, so they always use the clinic timezone.
  const createdBounds = boundsFor(range, 'created')
  const [appointments, contacts, blogs] = await Promise.all([
    appointmentsIn(apptField(basis), bounds),
    createdIn('contacts', createdBounds),
    createdIn('blogs', createdBounds),
  ])
  return {
    range: describe(range, basis, bounds),
    appointments: statusCounts(appointments),
    timeline: timeline(range, basis, bounds, appointments),
    services: topServices(appointments),
    contacts: contactCounts(contacts),
    blogs: blogCounts(blogs),
    _records: appointments,
  }
}

const REPORT_PERIODS = ['all', 'today', 'week', 'month', 'year', 'custom']
const EXPORT_CAP = 10000

/** Name / phone search; digit-only queries also match numbers stored with spaces or dashes. */
function searchMatcher(raw) {
  const q = String(raw || '').trim().slice(0, 60)
  if (!q) return null
  const lower = q.toLowerCase()
  const digits = q.replace(/\D/g, '')
  const digitSearch = digits.length >= 3 && /^[\d\s()+-]+$/.test(q)
  return (a) =>
    String(a.name || '').toLowerCase().includes(lower) ||
    (digitSearch ? String(a.phone || '').replace(/\D/g, '').includes(digits) : String(a.phone || '').toLowerCase().includes(lower))
}

const scheduledSort = (a, b) => (a.date || '').localeCompare(b.date || '') || byOldest(a, b)

export const analyticsApi = {
  /** Period-independent figures: today's cards, contact and blog analytics, recent activity. */
  overview: call(async () => {
    const today = clinicToday()
    const todayRange = resolvePeriod({ period: 'today' })
    const tb = boundsFor(todayRange)
    const mb = boundsFor(resolvePeriod({ period: 'month', month: today.m, year: today.y }))
    const yb = boundsFor(resolvePeriod({ period: 'year', year: today.y }))
    const tbScheduled = boundsFor(todayRange, 'scheduled')

    const [received, scheduled, contactsToday, contactsMonth, contactsYear, unread, read, blogsTotal, blogsPublished, blogsMonth, blogsYear, recentAppointments, recentContacts] =
      await Promise.all([
        appointmentsIn('createdAt', tb),
        appointmentsIn('date', tbScheduled),
        countIn('contacts', 'createdAt', tb),
        countIn('contacts', 'createdAt', mb),
        countIn('contacts', 'createdAt', yb),
        countWhere('contacts', where('status', '==', 'New')),
        countWhere('contacts', where('status', '==', 'Read')),
        countWhere('blogs'),
        countWhere('blogs', where('published', '==', true)),
        countIn('blogs', 'createdAt', mb),
        countIn('blogs', 'createdAt', yb),
        recent('appointments', 10),
        recent('contacts', 8),
      ])

    return {
      success: true,
      data: {
        timezone: CLINIC_TZ,
        today: { label: todayRange.label, received: statusCounts(received), scheduled: statusCounts(scheduled), contacts: contactsToday },
        contacts: { today: contactsToday, month: contactsMonth, year: contactsYear, total: unread + read, unread, read },
        blogs: { total: blogsTotal, published: blogsPublished, drafts: blogsTotal - blogsPublished, month: blogsMonth, year: blogsYear },
        recentAppointments,
        recentContacts,
      },
    }
  }),

  /** Summary for /today, /week, /month, /year, /custom (filter.period). */
  summary: call(async (filter) => {
    const { range, basis } = readRange(filter, filter?.period)
    const { _records, ...summary } = await buildSummary(range, basis)
    return { success: true, data: summary }
  }),

  services: call(async (filter, params = {}) => {
    const { range, basis, bounds } = readRange(filter)
    const limit = Math.min(50, Math.max(1, toInt(params.limit, 10)))
    const appointments = await appointmentsIn(apptField(basis), bounds)
    return { success: true, data: { range: describe(range, basis, bounds), services: topServices(appointments, limit) } }
  }),

  /**
   * Appointment report by scheduled date.
   * params: { period: all|today|week|month|year|custom, month, year, from, to, search, status, service, page, limit, export }
   * `stats` describe the whole period; `records`/`pagination` respect search, status and service.
   */
  appointments: call(async (params = {}) => {
    const period = String(params.period || 'all')
    if (!REPORT_PERIODS.includes(period)) throw badRequest(`period must be one of: ${REPORT_PERIODS.join(', ')}`)
    const status = String(params.status || '')
    if (status && !APPOINTMENT_STATUSES.includes(status)) throw badRequest(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`)
    const isExport = params.export === true || params.export === 'true' || params.export === '1'
    const page = Math.max(1, toInt(params.page, 1))
    const limit = Math.min(100, Math.max(1, toInt(params.limit, 20)))

    let rangeInfo = { period: 'all', label: 'All appointments', fromDate: null, toDate: null }
    let periodBounds = null
    if (period !== 'all') {
      const range = resolvePeriod({ period, month: params.month, year: params.year, from: params.from, to: params.to })
      periodBounds = boundsFor(range, 'scheduled')
      rangeInfo = {
        period,
        label: range.label,
        fromDate: calendar.iso(range.start),
        toDate: calendar.iso(calendar.addDays(range.end, -1)),
        month: range.month,
        year: range.year,
      }
    }

    const today = clinicToday()
    const schedBounds = (p) => boundsFor(resolvePeriod(p), 'scheduled')
    const [inPeriod, allTime, todayCount, monthCount, yearCount] = await Promise.all([
      periodBounds ? appointmentsIn('date', periodBounds) : allAppointments(),
      countWhere('appointments'),
      countIn('appointments', 'date', schedBounds({ period: 'today' })),
      countIn('appointments', 'date', schedBounds({ period: 'month', month: today.m, year: today.y })),
      countIn('appointments', 'date', schedBounds({ period: 'year', year: today.y })),
    ])

    const stats = statusCounts(inPeriod)
    const service = String(params.service || '').trim().slice(0, 120)
    const search = searchMatcher(params.search)
    const matching = inPeriod.filter((a) => (!status || a.status === status) && (!service || a.service === service) && (!search || search(a)))
    matching.sort(isExport ? scheduledSort : (a, b) => scheduledSort(b, a))

    const pick = ({ _id, name, phone, email, service: s, date, time, status: st, createdAt }) => ({ _id, name, phone, email, service: s, date, time, status: st, createdAt })
    const records = (isExport ? matching.slice(0, EXPORT_CAP) : matching.slice((page - 1) * limit, page * limit)).map(pick)

    return {
      success: true,
      data: {
        range: { ...rangeInfo, basis: 'scheduled', timezone: CLINIC_TZ, today: calendar.iso(today) },
        stats,
        services: serviceShares(inPeriod, stats.total),
        overview: { allTime, today: todayCount, month: monthCount, year: yearCount },
        filters: { search: String(params.search || ''), status, service },
        records,
        pagination: isExport
          ? { page: 1, limit: records.length, total: matching.length, pages: 1, truncated: matching.length > records.length }
          : { page, limit, total: matching.length, pages: Math.ceil(matching.length / limit) || 1 },
        generatedAt: new Date().toISOString(),
      },
    }
  }),

  /** Builds the analytics PDF for the filter in the browser and saves it. Returns the file name. */
  downloadReport: call(async (filter) => {
    const { range, basis } = readRange(filter)
    const [{ _records, ...summary }, pdf, admin] = await Promise.all([
      buildSummary(range, basis),
      import('../utils/analyticsReportPdf'), // jsPDF loads only when needed
      auth.currentUser ? loadAdmin(auth.currentUser).catch(() => null) : null,
    ])
    const appointments = [..._records].sort(basis === 'scheduled' ? (a, b) => scheduledSort(a, b) || (a.time || '').localeCompare(b.time || '') : byOldest).slice(0, 500)
    const { doc: pdfDoc, filename } = pdf.buildAnalyticsReport({ summary, appointments, truncated: summary.appointments.total > appointments.length, generatedBy: admin?.name })
    pdfDoc.save(filename)
    return filename
  }),
}
