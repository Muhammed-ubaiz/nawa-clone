/**
 * Resizes and re-encodes an uploaded image in the browser, returning a data URL small enough to be
 * stored inside a Firestore document (documents are limited to 1 MiB in total).
 *
 * Decoding through a canvas also strips metadata (EXIF location etc.) and guarantees the stored
 * value is a real image, whatever the original file claimed to be.
 */
const MAX_DATA_URL = 700 * 1024 // characters; leaves room for the rest of the document

function decode(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })
}

export async function compressImage(file, { maxWidth = 1600 } = {}) {
  let source
  try {
    source = await decode(file)
  } catch {
    throw Object.assign(new Error('The selected file is not a valid image.'), { status: 400, fields: {} })
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // Browsers without WebP encoding (older Safari) fall back to JPEG automatically below.
  let width = Math.min(maxWidth, source.width)
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = width
    canvas.height = Math.round((source.height * width) / source.width)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.82, 0.7, 0.58]) {
      let url = canvas.toDataURL('image/webp', quality)
      if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality)
      if (url.length <= MAX_DATA_URL) {
        source.close?.()
        return url
      }
    }
    width = Math.round(width * 0.75)
  }
  source.close?.()
  throw Object.assign(new Error('This image is too detailed to store. Please choose a smaller image.'), { status: 413, fields: {} })
}
