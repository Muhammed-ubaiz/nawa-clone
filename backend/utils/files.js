import fs from 'node:fs/promises'
import path from 'node:path'
import { UPLOAD_DIR } from '../middleware/uploadMiddleware.js'

/** Public URL path stored in the DB for an uploaded file. */
export const toPublicPath = (file) => (file ? `/uploads/${file.filename}` : undefined)

/** Removes a previously uploaded file. Ignores external URLs and missing files. */
export async function removeUpload(publicPath) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return
  const name = path.basename(publicPath) // prevents path traversal
  try {
    await fs.unlink(path.join(UPLOAD_DIR, name))
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Could not remove upload:', err.message)
  }
}
