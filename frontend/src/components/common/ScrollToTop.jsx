import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

/** Resets scroll position on route change (keeps #hash links working). */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

/** Floating "back to top" button that appears after scrolling. */
export default function ScrollToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    // Hidden near the bottom, where the footer has its own back-to-top control.
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 320
      setShow(window.scrollY > 600 && !nearBottom)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-logo-gold/50 bg-herbal-base/80 text-logo-gold shadow-[0_14px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md transition-[transform,opacity,background-color,color,border-color] duration-500 ease-premium hover:-translate-y-1 hover:border-logo-gold hover:bg-logo-gold hover:text-herbal-base active:scale-95 md:bottom-8 md:right-8 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
