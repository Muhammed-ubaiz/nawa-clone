import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../common/Button'

/**
 * Scroll driver: one passive listener, one rAF per scroll burst, geometry cached
 * (re-measured on resize). Writes --sp (0 → 1 progress) straight onto the section for
 * CSS-only effects (media scale, cue fade) and re-renders only when the chapter changes.
 * Under prefers-reduced-motion it does nothing — the CSS lays every chapter out in flow.
 * Shared with the Services showcase. Returns [ref, active, next, goTo].
 */
export function useStoryProgress(count) {
  const ref = useRef(null)
  const geo = useRef({ top: 0, distance: 1 })
  const [active, setActive] = useState(-1) // -1 until mounted, so chapter 1 animates in

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setActive(0)
      return undefined
    }

    let frame = 0
    const measure = () => {
      geo.current = {
        top: el.getBoundingClientRect().top + window.scrollY,
        distance: Math.max(el.offsetHeight - window.innerHeight, 1),
      }
    }
    const update = () => {
      frame = 0
      const { top, distance } = geo.current
      const p = Math.min(Math.max((window.scrollY - top) / distance, 0), 1)
      el.style.setProperty('--sp', p.toFixed(4))
      setActive(Math.min(count - 1, Math.floor(p * count))) // 0–25% → 1, 25–50% → 2 …
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      onScroll()
    }

    measure()
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
    ro?.observe(el)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      el.style.removeProperty('--sp')
    }
  }, [count])

  // Scroll to the start of the next chapter (or past the story after the last one).
  const next = () => {
    const el = ref.current
    if (!el) return
    const { top, distance } = geo.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const i = Math.max(active, 0) + 1
    const y = i >= count || reduce ? top + el.offsetHeight : top + (distance * i) / count + 2
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
  }

  // Scroll to the start of chapter i (dots / step controls).
  const goTo = (i) => {
    const el = ref.current
    if (!el) return
    const { top, distance } = geo.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: top + (distance * i) / count + 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  return [ref, active, next, goTo]
}

/** Chapter CTAs: cream (forest) or logo-gold (logo) pill, and a quiet underlined secondary. */
function ChapterAction({ to, label, secondary, brand }) {
  if (secondary) {
    return (
      <Link
        to={to}
        className={`rounded-sm py-2 text-[14px] font-semibold tracking-[0.02em] underline underline-offset-[7px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
          brand
            ? 'text-mist decoration-logo-gold/50 hover:text-logo-gold hover:decoration-logo-gold focus-visible:outline-logo-gold'
            : 'text-cream/90 decoration-cream/35 hover:text-white hover:decoration-white focus-visible:outline-cream'
        }`}
      >
        {label}
      </Link>
    )
  }
  return (
    <Button to={to} variant={brand ? 'brand' : 'cream'} className="px-7 py-[15px] sm:px-[30px] sm:py-4">
      {label}
    </Button>
  )
}

/**
 * Scroll-told hero: a tall wrapper holds a sticky 100svh stage; scroll progress picks the
 * chapter while the media (photo or video) stays put. Chapters share one grid cell, so the
 * stage is sized by the longest and nothing shifts; lines cross-fade (out: up 20px, in:
 * from below), reversing when scrolling back. Used by Home (video) and About (photo).
 *
 * layout="split" — phones: media band on top that flexes to the room the copy leaves;
 *                  desktop: media on the right ~2/3, fading leftwards into forest green.
 * layout="full"  — media is full-bleed at every size; copy sits low on phones and
 *                  centred-left on desktop over a left-weighted green gradient.
 *
 * theme="logo" (About, Home) — the palette of the Nawa logo: a deep herbal-green ground and
 * washes, a soft logo-gold glow behind the copy and a hint of leaf green, gold eyebrow/metadata,
 * pale-mint copy and a logo-gold CTA; the stage always ends on solid #08231C so the next
 * section continues it seamlessly. Default theme="forest" keeps the original greens.
 *
 * `data-header-dark` keeps the site Header's links light while it is over the story.
 */
export default function StoryHero({ chapters, media, layout = 'split', label, footer, cue = false, theme = 'forest', className = '' }) {
  const [ref, active, next] = useStoryProgress(chapters.length)
  const shown = Math.max(active, 0)
  const split = layout === 'split'
  const logo = theme === 'logo'

  useEffect(() => {
    window.dispatchEvent(new Event('scroll')) // let the Header pick up data-header-dark at once
  }, [])

  return (
    <section
      ref={ref}
      className={`story-hero story-hero--${layout} story-hero--${theme} relative ${logo ? 'bg-herbal-base' : 'bg-forest-deep'} ${className}`}
      aria-label={label}
      data-header-dark=""
    >
      <div
        className="story-stage sticky top-0 isolate flex flex-col overflow-hidden text-white"
        style={
          logo
            ? { background: 'radial-gradient(circle at 20% 30%, #0c3327 0%, #08231C 70%, #08231C 100%)' }
            : undefined
        }
      >
        {/* The one visual: never swapped; only a barely-there 1 → 1.03 scale across the story */}
        <div
          className={
            split
              ? 'story-media relative -z-20 min-h-[140px] w-full flex-1 overflow-hidden lg:absolute lg:inset-y-0 lg:right-0 lg:min-h-0 lg:w-[70%] xl:w-[64%]'
              : 'story-media absolute inset-0 -z-20 overflow-hidden'
          }
        >
          <div className="story-media-scale h-full w-full">{media}</div>
        </div>

        {split && logo ? (
          <>
            {/* Logo theme. Phones: light herbal tint. Desktop: deep herbal green → clear from the left
                (multi-stop), a deep foot, then the brand light: logo gold behind the copy, leaf green low. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-herbal/25 lg:bg-herbal/10" />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-herbal from-8% via-herbal/70 via-40% to-transparent to-75% lg:block"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-gradient-to-t from-herbal-base/90 to-transparent lg:block" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(circle at 18% 34%, rgba(221, 168, 59, 0.12), transparent 42%), radial-gradient(circle at 34% 88%, rgba(24, 121, 90, 0.14), transparent 46%)',
              }}
            />
            {/* Seam: the stage always ends on solid #08231C, the colour Behind the Practice starts on */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-herbal-base" />
          </>
        ) : logo ? (
          <>
            {/* Logo theme, full bleed — a light forest veil that keeps the film visible.
                Overall: a 15–25% deep-green tint (colour cohesion). Phones: a deeper foot behind the
                copy. Desktop: a soft left-weighted veil behind the copy, nearly clear on the right. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-herbal/25 lg:bg-herbal/15" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[62%] bg-gradient-to-t from-herbal-base/90 via-herbal/50 to-transparent lg:hidden" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-[linear-gradient(to_right,rgba(8,35,28,0.82)_0%,rgba(8,35,28,0.55)_32%,rgba(8,35,28,0.12)_62%,transparent_80%)] lg:block" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(circle at 18% 45%, rgba(221, 168, 59, 0.10), transparent 40%), radial-gradient(circle at 30% 92%, rgba(24, 121, 90, 0.16), transparent 45%)',
              }}
            />
            {/* Seam: the stage always ends on solid #08231C, the colour the next section starts on */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-herbal-base" />
          </>
        ) : split ? (
          <>
            {/* Phones: firm tint. Desktop: #0F2622 → #1A3832 → clear from the left, plus a soft foot */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest-deep/20 lg:bg-forest-deep/10" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-forest-deep from-10% via-forest/75 via-45% to-transparent lg:block" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-gradient-to-t from-forest-deep/85 to-transparent lg:block" />
          </>
        ) : (
          <>
            {/* Phones: even wash + a deeper foot behind the copy. Desktop: strongest behind the copy, clear on the right */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest-deep/35 lg:hidden" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[70%] bg-gradient-to-t from-forest-deep/90 via-forest-deep/55 to-transparent lg:hidden" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-forest-deep/85 via-forest/50 via-45% to-transparent lg:block" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-gradient-to-t from-forest-deep/70 to-transparent lg:block" />
          </>
        )}
        <div aria-hidden="true" className={`absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b to-transparent ${logo ? 'from-herbal/80' : 'from-forest-deep/70'}`} />

        <div
          className={`container-x relative flex flex-col lg:mt-0 lg:flex-1 lg:pt-[120px] ${
            split ? '-mt-12 sm:-mt-16' : 'flex-1 pt-[90px] sm:pt-[104px]'
          }`}
        >
          {/* Inactive chapters are visibility:hidden (out of the tab order and the accessibility
              tree); under reduced motion the CSS shows them all in flow. */}
          <div className={`flex pb-7 sm:pb-10 lg:flex-1 lg:items-center lg:pb-12 ${split ? '' : 'flex-1 items-end'}`}>
            <div className={`story-panels grid w-full ${split ? 'lg:w-[60%] xl:w-[56%]' : 'lg:w-[64%] xl:w-[60%]'}`}>
              {chapters.map((c, i) => {
                const Heading = i === 0 ? 'h1' : 'h2'
                const state = i === shown && active >= 0 ? 'is-active' : i < shown ? 'is-before' : 'is-after'
                return (
                  <div key={c.eyebrow} className={`story-panel ${state} [grid-area:1/1] self-center`}>
                    <p
                      className={`sp-item flex items-center gap-3 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] sm:text-[11.5px] ${logo ? 'text-logo-gold' : 'text-cream/75'}`}
                      style={{ '--i': 0 }}
                    >
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${logo ? 'bg-leaf' : 'bg-accent'}`} />
                      {c.eyebrow}
                    </p>
                    <Heading className="story-title sp-item mt-4 font-serif font-medium !text-white sm:mt-5 lg:mt-6" style={{ '--i': 1 }}>
                      {Array.isArray(c.title)
                        ? c.title.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))
                        : c.title}
                    </Heading>
                    <p className={`sp-item mt-4 max-w-[540px] text-[15px] leading-[1.7] ${logo ? 'text-mist' : 'text-cream/85'} sm:mt-5 sm:text-[16px] lg:mt-6 lg:text-[17px] lg:leading-[1.75]`} style={{ '--i': 2 }}>
                      {c.text}
                    </p>
                    {c.actions?.length > 0 && (
                      <div className="sp-item mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-9" style={{ '--i': 3 }}>
                        {c.actions.map((a) => (
                          <ChapterAction key={a.label} {...a} brand={logo} />
                        ))}
                      </div>
                    )}
                    {c.extra && (
                      <div className="sp-item mt-7 lg:mt-9" style={{ '--i': 4 }}>
                        {c.extra}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Foot: page-specific content left (breadcrumb / scroll cue), chapter progress right */}
          <div
            className={`flex items-center justify-between gap-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:pb-8 sm:pt-5 lg:pb-10 lg:pt-6 ${
              logo ? '' : 'border-t border-cream/15'
            }`}
          >
            <div className="flex items-center">
              {cue ? (
                <button
                  type="button"
                  onClick={next}
                  className={`story-cue group flex items-center gap-3 whitespace-nowrap rounded-full py-1 pr-2 text-[10.5px] font-semibold uppercase leading-none tracking-[0.24em] transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-[11px] ${logo ? 'text-mist/70 hover:text-logo-gold focus-visible:outline-logo-gold' : 'text-cream/65 hover:text-white focus-visible:outline-cream'}`}
                >
                  <span aria-hidden="true" className={`hero-cue-line relative block h-7 w-px overflow-hidden ${logo ? 'bg-leaf/60' : 'bg-cream/25'}`} />
                  {active >= chapters.length - 1 ? 'Continue' : 'Scroll to explore'}
                </button>
              ) : (
                footer
              )}
            </div>
            <div aria-hidden="true" className={`story-progress flex items-center gap-3 text-[10.5px] font-semibold leading-none tracking-[0.16em] sm:text-[11.5px] ${logo ? 'text-mist/60' : 'text-cream/55'}`}>
              <span className={`w-5 text-right tabular-nums ${logo ? 'text-logo-gold' : 'text-cream/90'}`}>{String(shown + 1).padStart(2, '0')}</span>
              <span className="flex gap-1.5">
                {chapters.map((c, i) => (
                  <span key={c.eyebrow} className={`h-px w-5 transition-colors duration-500 sm:w-8 ${i <= shown ? (logo ? 'bg-logo-gold' : 'bg-accent') : logo ? 'bg-leaf/50' : 'bg-cream/25'}`} />
                ))}
              </span>
              <span className="tabular-nums">{String(chapters.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
