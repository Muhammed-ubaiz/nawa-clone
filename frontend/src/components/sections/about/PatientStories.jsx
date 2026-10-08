import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
import { stats, testimonials } from '../../../data/content'
import Reveal from '../../common/Reveal'
import { ChapterEyebrow, ChapterGlow } from './ChapterParts'

const initials = (name) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .replace(/[^A-Z]/gi, '')
    .slice(0, 2)

// The site's published rating (data/content.js → stats), so the badge never disagrees with it.
const rating = stats.find((s) => /rating/i.test(s.label))

/**
 * Review card in the logo palette: deep-green glass with a leaf frame that warms to gold, a gold
 * quote mark, the review in white serif italic, and an author row (gold
 * monogram ring, white name, mint treatment, gold location) over a leaf rule.
 */
function StoryCard({ t }) {
  return (
    <figure className="group flex h-full flex-col rounded-2xl border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-6 backdrop-blur-md transition-[border-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-1 hover:border-logo-gold/50 hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.75)] sm:p-7">
      <span aria-hidden="true" className="font-serif text-[56px] leading-[0.6] text-logo-gold">&ldquo;</span>
      <blockquote className="mt-4 flex-1 font-serif text-[18px] font-normal italic leading-[1.5] text-white/90">{t.text}</blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-leaf/35 pt-5 transition-colors duration-500 group-hover:border-logo-gold/40">
        <span className="flex min-w-0 items-center gap-4">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-logo-gold/45 bg-leaf/15 font-serif text-[15px] italic text-logo-gold">
            {initials(t.name)}
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-white">{t.name}</span>
            {t.treatment && <span className="mt-1 block truncate text-[12px] text-mist">{t.treatment}</span>}
          </span>
        </span>
        <span className="shrink-0 text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-logo-gold/75">{t.location}</span>
      </figcaption>
    </figure>
  )
}

/**
 * About — "Patient Stories". Dark section: header with a gold-star rating pill (from the
 * site's own stats), then a scroll-snap carousel of compact glass review cards (≈1.1 per view on
 * phones, 2 on tablets, 3 on desktop) with round previous/next controls. Swipe, trackpad
 * and keyboard (Tab into a card, arrows on the buttons) all work; buttons disable at the ends.
 */
export default function PatientStories() {
  const trackRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const max = el.scrollWidth - el.clientWidth
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const step = (dir) => {
    const el = trackRef.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 24
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' })
  }

  const navBtn =
    'grid h-11 w-11 place-items-center rounded-full border border-logo-gold/50 text-logo-gold transition-[background-color,border-color,color,opacity] duration-300 hover:border-logo-gold hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold disabled:pointer-events-none disabled:opacity-30'

  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-20 text-white md:py-24 lg:py-28" aria-labelledby="reviews-title">
      <ChapterGlow
        spots={[
          { x: '75%', y: '30%', size: '60vw', color: 'rgba(24,121,90,0.16)' },
          { x: '15%', y: '80%', size: '45vw', color: 'rgba(221,168,59,0.07)' },
        ]}
      />
      <div className="container-x">
        <Reveal variant="group" className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <ChapterEyebrow index="07" className="r-item" style={{ '--d': '0ms' }}>
              Words of Restoration
            </ChapterEyebrow>
            <h2 id="reviews-title" className="mt-6 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[44px] lg:text-[52px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  Stories of Renewal &amp; <em className="font-normal italic text-logo-gold">Lasting</em> Balance
                </span>
              </span>
            </h2>
          </div>
          {rating && (
            <p className="r-item inline-flex items-center gap-3 self-start rounded-full border border-logo-gold/40 bg-[#0c2f24]/50 px-5 py-2.5 backdrop-blur-sm lg:self-end" style={{ '--d': '260ms' }}>
              <span className="flex gap-0.5 text-logo-gold" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              <span className="text-[12.5px] font-semibold tracking-[0.02em] text-white">
                {rating.value} <span className="font-normal text-mist">{rating.label}</span>
              </span>
            </p>
          )}
        </Reveal>

        <Reveal delay={150} className="relative mt-10 lg:mt-14">
          <ul
            ref={trackRef}
            id="stories-track"
            aria-label="Patient reviews"
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:gap-6 lg:px-0"
          >
            {testimonials.map((t) => (
              <li key={t.name} className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc((100%-48px)/3)]">
                <StoryCard t={t} />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" className={navBtn} onClick={() => step(-1)} disabled={edges.start} aria-controls="stories-track" aria-label="Previous review">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" className={navBtn} onClick={() => step(1)} disabled={edges.end} aria-controls="stories-track" aria-label="Next review">
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
