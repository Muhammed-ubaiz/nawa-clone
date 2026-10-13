import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Vercel's file system is read-only except /tmp, which is per-instance and temporary: images
// uploaded there do not survive cold starts. Use external storage for durable uploads on Vercel.
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.resolve(__dirname, '..', 'uploads')
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
} catch (err) {
  console.warn(`Upload folder ${UPLOAD_DIR} is not writable: ${err.message}`)
}

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
}
const MAX_SIZE = 3 * 1024 * 1024 // 3 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Never trust the client's filename: generate our own with a safe extension.
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED[file.mimetype]}`),
})

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const extOk = ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)
  if (ALLOWED[file.mimetype] && extOk) return cb(null, true)
  cb(ApiError.badRequest('Only JPG, PNG, WEBP or AVIF images are allowed.'))
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: 1 } })

/** Accepts a single optional image in the given multipart field. */
export const uploadImage = (field) => upload.single(field)

/**
 * Checks the first bytes of the saved file so a renamed non-image
 * (e.g. script.php -> photo.jpg) is rejected even if headers lie.
 */
export async function verifyImageSignature(req, _res, next) {
  if (!req.file) return next()
  const fd = await fs.promises.open(req.file.path, 'r')
  const buf = Buffer.alloc(12)
  await fd.read(buf, 0, 12, 0)
  await fd.close()

  const hex = buf.toString('hex')
  const ascii = buf.toString('latin1')
  const valid =
    hex.startsWith('ffd8ff') || // JPEG
    hex.startsWith('89504e47') || // PNG
    (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') ||
    ascii.slice(4, 12).startsWith('ftypavi') // AVIF

  if (!valid) {
    await fs.promises.unlink(req.file.path).catch(() => {})
    return next(ApiError.badRequest('The uploaded file is not a valid image.'))
  }
  next()
}
