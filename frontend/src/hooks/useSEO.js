import { useEffect } from 'react'
import { siteUrl } from '../data/site'

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

/** Sets the document title, description, canonical URL and Open Graph basics per page. */
export function useSEO({ title, description, image }) {
  useEffect(() => {
    const full = title ? `${title} | Nawa Ayurveda` : 'Nawa Ayurveda'
    document.title = full
    setMeta('property', 'og:title', full)
    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
    }
    if (image) setMeta('property', 'og:image', image)
    // One canonical address per page: the production domain, without query strings or a trailing slash.
    const url = `${siteUrl}${window.location.pathname.replace(/\/+$/, '') || '/'}`
    setCanonical(url)
    setMeta('property', 'og:url', url)
  }, [title, description, image])
}

/** Keeps the current page out of search results while it is mounted (not-found pages). */
export function useNoIndex() {
  useEffect(() => {
    setMeta('name', 'robots', 'noindex')
    return () => document.head.querySelector('meta[name="robots"]')?.remove()
  }, [])
}
