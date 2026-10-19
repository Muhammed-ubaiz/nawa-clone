import { useEffect, useRef } from 'react'

/**
 * Subtle scroll parallax: moves the element by `speed` × scroll distance
 * (e.g. 0.12 → 12 px per 100 px scrolled), optionally fading it.
 *
 * Performance: writes transform/opacity straight to the DOM (no React re-render),
 * throttled to requestAnimationFrame, passive listener, and only runs while the
 * element is on screen. Disabled below `minWidth`, on touch-first devices and for
 * prefers-reduced-motion, so phones keep native-smooth scrolling.
 */
export function useParallax({ speed = 0.12, fade = 0, minWidth = 1024 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const mq = (q) => window.matchMedia?.(q).matches
    if (mq('(prefers-reduced-motion: reduce)') || !mq(`(min-width: ${minWidth}px)`) || !mq('(pointer: fine)')) return undefined

    let frame = 0
    let active = true
    const update = () => {
      frame = 0
      const y = window.scrollY
      el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`
      if (fade) el.style.opacity = String(Math.max(0, 1 - (y / window.innerHeight) * fade))
    }
    const onScroll = () => {
      if (active && !frame) frame = requestAnimationFrame(update)
    }
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            active = entry.isIntersecting
            if (active) onScroll()
          })
        : null
    io?.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      el.style.transform = ''
      el.style.opacity = ''
    }
  }, [speed, fade, minWidth])

  return ref
}
