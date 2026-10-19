import { useEffect } from 'react'

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sets the document title, description and Open Graph basics per page. */
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
    setMeta('property', 'og:url', window.location.href)
  }, [title, description, image])
}
