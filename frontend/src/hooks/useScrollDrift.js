import { useEffect } from 'react'

/**
 * Barely-there parallax driver. While the element crosses the viewport it writes
 * --bp on it, from −1 (just entering at the bottom) to 1 (just leaving at the top);
 * CSS turns that into a few pixels of drift (e.g. translateY(calc(var(--bp) * -12px))).
 * One passive listener + one rAF per scroll burst, idle while off screen, and a no-op
 * under prefers-reduced-motion (--bp stays unset, so everything sits at rest).
 */
export function useScrollDrift(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame = 0
    let inView = false
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = (vh - r.top) / (vh + r.height) // 0 entering → 1 leaving
      el.style.setProperty('--bp', (Math.min(Math.max(p, 0), 1) * 2 - 1).toFixed(3))
    }
    const onScroll = () => {
      if (inView && !frame) frame = requestAnimationFrame(update)
    }
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([e]) => {
            inView = e.isIntersecting
            if (inView) onScroll()
          })
        : null
    if (io) io.observe(el)
    else inView = true
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      el.style.removeProperty('--bp')
    }
  }, [ref])
}
