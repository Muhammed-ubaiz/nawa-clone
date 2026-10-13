import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import blogRoutes from './routes/blogRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

// The database URI may be named MONGODB_URI (preferred) or MONGO_URI; config/db.js reads either.
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.error('Missing required environment variable MONGODB_URI. See .env.example.')
  process.exit(1)
}
for (const key of ['JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable ${key}. See .env.example.`)
    process.exit(1)
  }
}
if (process.env.JWT_SECRET.length < 32) console.warn('Warning: JWT_SECRET should be at least 32 characters long.')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

// CORS: local dev frontends plus the production frontend(s) in CLIENT_URL (comma-separated).
// Trailing slashes are ignored, since browsers send the Origin without one.
const normalizeOrigin = (o) => o.trim().replace(/\/+$/, '')
const allowedOrigins = new Set(
  ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', ...(process.env.CLIENT_URL || '').split(',')]
    .map(normalizeOrigin)
    .filter(Boolean),
)
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowedOrigins.has(origin) ? cb(null, true) : cb(null, false)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  }),
)

// Basic security headers (no extra dependency).
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// Uploaded images (blog/service). Served as static files with long caching.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
)

// Health checks: hosting platforms ping /api/health; / answers too instead of a 404 when the URL is opened.
const health = (_req, res) =>
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
app.get('/', health)
app.get('/api/health', health)

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 5000

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`API listening on port ${PORT}`))
    const shutdown = () => server.close(() => mongoose.connection.close(false).then(() => process.exit(0)))
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })
