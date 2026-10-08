import { useEffect, useRef, useState } from 'react'

const easeOutCubic = (t) => 1 - (1 - t) ** 3

/**
 * Counts from 0 to the number in `value` (e.g. "1000+" → 0…1000 then "+"; commas kept) once, the first time
 * it scrolls into view. Reduced motion shows the final value at once. The final value reserves
 * the width (invisible layer underneath) so the count never shifts the layout.
 */
export default function CountUp({ value, duration = 2000, className = '' }) {
  const [, digits = '0', suffix = ''] = String(value).match(/^([\d,]+)(.*)$/) || [null, '0', String(value)]
  const target = Number(digits.replace(/,/g, ''))
  // Keep thousands separators only when the source value used them ("10,000+" vs "1000+").
  const format = (n) => (digits.includes(',') ? n.toLocaleString('en-US') : String(n))
  const ref = useRef(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setCurrent(target)
      return undefined
    }
    let frame
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1)
          setCurrent(Math.round(easeOutCubic(t) * target))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return (
    <span ref={ref} className={`inline-grid tabular-nums ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {format(target)}
        {suffix}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1">
        {format(current)}
        {suffix}
      </span>
    </span>
  )
}
