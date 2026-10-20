import { useEffect } from 'react'
import { shareImage, siteUrl } from '../data/site'

const BRAND = 'Nawa Ayurveda'
const DESCRIPTION_MAX = 160

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Search snippets show ~160 characters; cut longer text (e.g. article excerpts) at a word boundary. */
const clip = (text) => {
  const t = String(text).replace(/\s+/g, ' ').trim()
  if (t.length <= DESCRIPTION_MAX) return t
  return `${t.slice(0, DESCRIPTION_MAX - 1).replace(/\s+\S*$/, '')}…`
}

/** Images must be absolute URLs for link previews (site-relative paths are resolved against siteUrl). */
const absolute = (src) => (/^https?:\/\//.test(src) ? src : `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}`)

/**
 * Sets the per-page title, description, canonical URL, Open Graph and Twitter/X card tags.
 * The build pre-renders public pages, so these values are also in each page's served HTML.
 */
export function useSEO({ title, description, image }) {
  useEffect(() => {
    const full = title ? `${title} | ${BRAND}` : BRAND
    // One canonical address per page: the production domain, no query string or trailing slash.
    const url = `${siteUrl}${window.location.pathname.replace(/\/+$/, '') || '/'}`
    const img = absolute(image || shareImage)

    document.title = full
    setCanonical(url)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)
    setMeta('name', 'twitter:title', full)
    setMeta('name', 'twitter:image', img)
    if (description) {
      const d = clip(description)
      setMeta('name', 'description', d)
      setMeta('property', 'og:description', d)
      setMeta('name', 'twitter:description', d)
    }
  }, [title, description, image])
}

/** Keeps the current page out of search results while it is mounted (not-found pages). */
export function useNoIndex() {
  useEffect(() => {
    setMeta('name', 'robots', 'noindex')
    return () => document.head.querySelector('meta[name="robots"]')?.remove()
  }, [])
}
