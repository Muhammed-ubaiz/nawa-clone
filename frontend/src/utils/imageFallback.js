/** Local image shown when a blog cover fails to load (bundled with the site, so it cannot 404). */
export const FALLBACK_IMAGE = '/images/why-choose-us.webp'

/** onError handler for <img>: swaps in the fallback once (never loops if the fallback fails too). */
export function handleImageError(event) {
  const img = event.currentTarget
  if (img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.removeAttribute('srcset')
  img.src = FALLBACK_IMAGE
}
