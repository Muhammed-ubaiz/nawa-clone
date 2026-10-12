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

/**
 * Returns a slug that is unique within the Firestore `Model`, appending -2, -3 ... if needed.
 * `excludeId` lets a document keep its own slug when updating.
 */
export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'item'
  let slug = root
  let n = 2
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug }, excludeId)) {
    slug = `${root}-${n++}`
  }
  return slug
}

/** Escapes user input before using it inside a RegExp. */
export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
