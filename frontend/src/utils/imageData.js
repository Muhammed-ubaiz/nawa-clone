/**
 * Converts an uploaded image File into a compressed data URL that is stored directly on the
 * Firestore document (the project has no Storage bucket). The security rules accept
 * data:image/(webp|jpeg|png) values up to 800,000 characters, so this keeps well under that.
 */
const MAX_CHARS = 700000
const MAX_EDGE = 1600

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall back to <img> (e.g. formats createImageBitmap cannot read) */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function fileToImageDataUrl(file) {
  let source
  try {
    source = await decode(file)
  } catch {
    throw Object.assign(new Error('This image could not be read. Please choose a JPG, PNG or WEBP file.'), { status: 400, fields: {} })
  }

  let edge = MAX_EDGE
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, edge / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale))
    canvas.height = Math.max(1, Math.round(source.height * scale))
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.82, 0.7, 0.58, 0.46]) {
      let url = canvas.toDataURL('image/webp', quality)
      // Browsers without WebP encoding return PNG; JPEG is far smaller for photos.
      if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality)
      if (url.length <= MAX_CHARS) return url
    }
    edge = Math.round(edge * 0.7)
  }
  throw Object.assign(new Error('This image is too detailed to store. Please choose a smaller image.'), { status: 413, fields: {} })
}
