import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { connectDB, isConnected } from './config/firebase.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import blogRoutes from './routes/blogRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

// Firebase credentials are checked by connectDB() with a clear message (see config/firebase.js).
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

// CORS: allow only configured client origins (comma-separated list).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim())
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(null, false)),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

app.get('/api/health', (_req, res) =>
  res.json({ success: true, status: 'ok', db: isConnected() ? 'connected' : 'disconnected', provider: 'firestore' }),
)

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
    const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}/api`))
    const shutdown = () => server.close(() => process.exit(0))
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })
