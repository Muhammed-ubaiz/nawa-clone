import { useEffect, useRef, useState } from 'react'

/**
 * Performance-first background video for the home hero.
 *
 * - The poster (the loop's exact first frame, ~40 KB) paints immediately, so the
 *   switch to video is invisible and nothing blocks the first render.
 * - Video sources are attached only after the page has loaded and the browser is
 *   idle, with preload="metadata", so the video never competes with the page.
 * - Phones get a light 360p file; capable desktops get WebM (smaller) with an
 *   H.264 MP4 fallback.
 * - Data-saver, very slow connections (2G) and prefers-reduced-motion keep the
 *   poster only — mobile performance is never sacrificed to force playback.
 * - Playback pauses while the hero is off screen or the tab is hidden (no decode
 *   cost while scrolling the rest of the page) and resumes without restarting.
 */
function shouldSkipVideo() {
  if (typeof window === 'undefined') return true
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true
  const c = navigator.connection
  if (c?.saveData) return true
  if (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)) return true
  return false
}

const whenIdle = (cb) => {
  const run = () => (window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200))
  if (document.readyState === 'complete') {
    run()
    return () => {}
  }
  window.addEventListener('load', run, { once: true })
  return () => window.removeEventListener('load', run)
}

export default function HeroVideo({ webm, mp4, mobile, poster, className = '', objectPosition = '50% 50%' }) {
  const videoRef = useRef(null)
  const wrapRef = useRef(null)
  const [sources, setSources] = useState(null) // attached after load/idle
  const [playing, setPlaying] = useState(false)
  const [disabled, setDisabled] = useState(false)

  // 1. Decide whether (and which) video to load — after the page is ready.
  useEffect(() => {
    if (shouldSkipVideo()) {
      setDisabled(true)
      return undefined
    }
    return whenIdle(() => {
      const isSmall = window.matchMedia?.('(max-width: 767px)').matches
      setSources(isSmall ? [{ src: mobile, type: 'video/mp4' }] : [{ src: webm, type: 'video/webm' }, { src: mp4, type: 'video/mp4' }])
    })
  }, [webm, mp4, mobile])

  // 2. Once sources exist: play when visible, pause when off screen or tab hidden.
  useEffect(() => {
    const el = videoRef.current
    if (!el || !sources) return undefined
    el.muted = true // React does not reliably emit the attribute; mobile autoplay requires it
    el.defaultMuted = true

    let inView = true
    const tryPlay = () => {
      if (!inView || document.hidden) return
      const p = el.play()
      // Only a real autoplay refusal keeps the poster. An AbortError just means this start was
      // interrupted by a pause (scrolled off screen, tab hidden, effect re-run) — the next
      // tryPlay() resumes it, so it must not switch the video off for good.
      if (p?.catch) p.catch((err) => err?.name === 'NotAllowedError' && setDisabled(true))
    }
    const pause = () => el.pause()

    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting
              if (inView) tryPlay()
              else pause()
            },
            { threshold: 0.05 },
          )
        : null
    if (io && wrapRef.current) io.observe(wrapRef.current)

    const onVisibility = () => (document.hidden ? pause() : tryPlay())
    document.addEventListener('visibilitychange', onVisibility)
    tryPlay()

    return () => {
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      pause()
    }
  }, [sources])

  return (
    <div ref={wrapRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Poster: first frame of the loop — paints instantly, also the fallback */}
      <img src={poster} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />
      {sources && !disabled && (
        <video
          ref={videoRef}
          style={{ objectPosition }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${playing ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          disablePictureInPicture
          disableRemotePlayback
          onPlaying={() => setPlaying(true)}
          onError={() => setDisabled(true)}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}
    </div>
  )
}
