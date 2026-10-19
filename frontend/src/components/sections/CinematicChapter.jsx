import { ArrowDown } from 'lucide-react'
import { useReveal } from '../../hooks/useReveal'

/**
 * Dark cinematic "chapter" used by the About page (The Nawa Approach, Our Philosophy).
 *
 * The photo sits on the right ~58% and dissolves into forest green on the left, top and
 * bottom, so consecutive dark chapters read as one continuous scene. Left: eyebrow, serif
 * title (pass <em> for italic accents), a lead line and a quieter note. Right/lower: a
 * large serif index with a metadata tag and a short dotted list. A round control
 * (bottom-right) steps to the next section.
 *
 * Phones/tablets: the photo becomes a band at the top fading down into the green, with
 * the copy and index stacked beneath it.
 *
 * Motion (CSS, see .nap* in index.css) when the section enters view: the photo fades in
 * and settles 1.05 → 1; eyebrow, title and copy fade up in turn; the index and list slide
 * in from the right after a short beat. Reduced motion shows everything at rest.
 *
 * Props: id (title id), eyebrow, title (node), lead, note, index, meta,
 * items ([title, text?][]), photo ({ src, srcSet, alt }), position ({ base, lg } object
 * positions), titleScale (desktop title scale for longer lines), bullet ('gold' | 'mint'),
 * mediaMs (photo entrance duration).
 */
export default function CinematicChapter({
  id,
  eyebrow,
  title,
  lead,
  note,
  index,
  meta,
  items = [],
  photo,
  position = { base: '50% 50%', lg: '50% 50%' },
  titleScale = 1,
  bullet = 'gold',
  mediaMs = 1200,
  theme = 'forest',
}) {
  const logo = theme === 'logo'
  // Brand canvas (#08231C) + gold/mint accents, or the original forest palette.
  const t = logo
    ? {
        bg: 'bg-herbal-base',
        tint: 'bg-herbal-base/25',
        left: 'from-herbal-base via-herbal-base/40',
        top: 'from-herbal-base',
        bottom: 'from-herbal-base',
        eyebrow: 'text-logo-gold',
        eyebrowLine: 'bg-logo-gold',
        lead: 'text-mist',
        note: 'text-mist/80',
        index: 'italic text-logo-gold',
        rule: 'border-logo-gold/35',
        meta: 'text-logo-gold/80',
        label: 'text-white',
        text: 'text-mist/65',
        dot: 'bg-logo-gold',
        pool: 'bg-herbal-base/60',
        control:
          'bg-herbal-base border border-logo-gold/40 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:bg-logo-gold hover:text-herbal-base hover:border-logo-gold hover:shadow-[0_0_28px_rgba(221,168,59,0.45)] focus-visible:outline-logo-gold',
      }
    : {
        bg: 'bg-forest-deep',
        tint: 'bg-forest-deep/25',
        left: 'from-forest-deep via-forest-deep/40',
        top: 'from-forest-deep',
        bottom: 'from-forest-deep',
        eyebrow: 'text-cream/80',
        eyebrowLine: 'bg-cream/50',
        lead: 'text-cream/85',
        note: 'text-cream/60',
        index: 'text-cream/90',
        rule: 'border-cream/25',
        meta: 'text-cream/55',
        label: 'text-cream/85',
        text: 'text-cream/55',
        dot: bullet === 'mint' ? 'bg-secondary' : 'bg-accent',
        pool: 'bg-forest-deep/60',
        control:
          'bg-white text-forest-deep shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:bg-cream focus-visible:outline-cream',
      }
  const [ref, visible] = useReveal({ threshold: 0.2, rootMargin: '0px 0px -80px 0px' })

  const toNext = () => {
    const next = ref.current?.nextElementSibling
    if (!next) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: next.getBoundingClientRect().top + window.scrollY - 70, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={ref}
      className={`nap nap--${theme} relative isolate flex flex-col overflow-hidden ${t.bg} text-white lg:min-h-[85vh] lg:justify-center ${visible ? 'is-visible' : ''}`}
      style={{ '--nap-pos': position.base, '--nap-pos-lg': position.lg, '--nap-title-scale': titleScale, '--nap-title-scale-sm': (1 + titleScale) / 2, '--nap-media-ms': `${mediaMs}ms` }}
      aria-labelledby={id}
    >
      {/* Photo: top band on phones/tablets, right ~58% on desktop; dissolved into the green.
          overflow-hidden keeps the 1.05 entrance zoom inside the area the left fade covers. */}
      <div aria-hidden="true" className="nap-photo relative -z-20 aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[58%]">
        <div className="nap-media h-full w-full">
          <img src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 1024px) 58vw, 100vw" alt="" loading="lazy" decoding="async" className="nap-img h-full w-full object-cover" />
        </div>
        {/* Gentle tint so every chapter photo sits in the same low light */}
        <div className={`absolute inset-0 ${t.tint}`} />
      </div>

      {/* Desktop edge fades: left (strongest), top and bottom — no hard photo edge anywhere */}
      <div aria-hidden="true" className={`absolute inset-y-0 right-0 -z-10 hidden w-[58%] bg-gradient-to-r ${t.left} via-35% to-transparent lg:block`} />
      {/* Logo theme: brand light — gold behind the copy, leaf green low. Painted ABOVE the left
          fade (so it never stops at the photo's edge — that made a vertical seam) but BELOW the
          top and bottom fades, so the chapter still starts and ends on solid #08231C. */}
      {logo && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 22% 48%, rgba(221,168,59,0.09), transparent 40%), radial-gradient(circle at 18% 85%, rgba(24,121,90,0.16), transparent 42%)',
          }}
        />
      )}
      <div aria-hidden="true" className={`absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b ${t.top} to-transparent`} />
      <div aria-hidden="true" className={`absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t ${t.bottom} to-transparent ${logo ? '' : 'hidden lg:block'}`} />

      <div className="container-x relative -mt-20 pb-24 sm:-mt-28 md:pb-28 lg:mt-0 lg:py-36">
        <div className="grid gap-y-14 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          {/* Copy */}
          <div className="lg:col-span-6">
            <p className={`nap-item flex items-center gap-4 text-[11px] font-semibold uppercase leading-none tracking-[0.24em] sm:text-[12px] ${t.eyebrow}`} style={{ '--i': 0 }}>
              <span aria-hidden="true" className={`h-px w-10 sm:w-14 ${t.eyebrowLine}`} />
              {eyebrow}
            </p>
            <h2 id={id} className="nap-title nap-item mt-7 font-serif font-medium !text-white sm:mt-8 lg:mt-10" style={{ '--i': 1 }}>
              {title}
            </h2>
            {lead && (
              <p className={`nap-item mt-7 max-w-xl text-[17px] leading-[1.7] sm:mt-8 sm:text-[18px] lg:mt-10 ${t.lead}`} style={{ '--i': 2 }}>
                {lead}
              </p>
            )}
            {note && (
              <p className={`nap-item mt-5 max-w-xl text-[15px] leading-[1.8] sm:text-[16px] ${t.note}`} style={{ '--i': 3 }}>
                {note}
              </p>
            )}
          </div>

          {/* Index + list: plain type, one hairline. On desktop it sits over the photo, so a soft
              blurred pool of the section green (not a panel) keeps the small type legible. */}
          <div className="lg:col-span-4 lg:col-start-9 lg:pb-2">
            <div className="relative max-w-[320px]">
              <span aria-hidden="true" className={`pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 hidden rounded-full blur-3xl lg:block ${t.pool}`} />
              <div className={`nap-slide flex items-end justify-between gap-6 border-b pb-4 ${t.rule}`} style={{ '--i': 0 }}>
                <span className={`font-serif text-[40px] font-medium leading-[0.8] sm:text-[48px] ${t.index}`}>{index}</span>
                <span className={`text-right text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] ${t.meta}`}>{meta}</span>
              </div>
              <ul className="mt-6 space-y-5">
                {items.map(([label, text], i) => (
                  <li key={label} className="nap-slide" style={{ '--i': i + 1 }}>
                    <span className={`flex items-center gap-3 text-[11.5px] font-semibold uppercase leading-none tracking-[0.22em] sm:text-[12px] ${t.label}`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
                      {label}
                    </span>
                    {text && <span className={`mt-2 block pl-[18px] text-[13.5px] leading-snug ${t.text}`}>{text}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next-section control */}
      <button
        type="button"
        onClick={toNext}
        aria-label="Continue to the next section"
        className={`absolute bottom-6 right-4 grid h-10 w-10 place-items-center rounded-full transition-[translate,background-color,color,border-color,box-shadow] duration-500 ease-premium hover:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 sm:right-6 lg:bottom-10 lg:right-10 ${t.control}`}
      >
        <ArrowDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </section>
  )
}
