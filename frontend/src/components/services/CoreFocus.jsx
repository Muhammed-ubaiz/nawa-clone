import { useId, useState } from 'react'
import { heritagePhoto, servicesHeroPhoto, spacePhotos } from '../../data/images'
import { useReveal } from '../../hooks/useReveal'

const FOCUS = [
  {
    title: 'Root-Cause Diagnosis',
    sub: 'Nadi Pariksha & Dosha Balance',
    text: 'Discovering intrinsic metabolic imbalances rather than suppressing temporary symptoms.',
    tags: ['Pulse Diagnosis', 'Prakriti Mapping'],
    photo: servicesHeroPhoto,
    position: '62% 45%',
  },
  {
    title: 'Classical Botanical Formulations',
    sub: 'Kashayams, Arishtams & Tailams',
    text: 'Pharmacopoeia-grade herbal decoctions, fermented arishtams, and cold-pressed medicated tailams.',
    tags: ['100% Organic Herbs', 'Artisanal Preparation'],
    photo: heritagePhoto,
    position: '45% 50%',
  },
  {
    title: 'Sustainable Long-Term Healing',
    sub: 'Dinacharya, Pathya & Practice',
    text: 'Daily regimen (Dinacharya), tailored dietary protocols (Pathya), and guided restorative practices.',
    tags: ['Lifestyle Harmony', 'Preventative Care'],
    photo: spacePhotos.room,
    position: '50% 50%',
  },
]

const pad = (n) => String(n).padStart(2, '0')

/**
 * Services — "Our Core Focus": an editorial accordion beside an image portal, in the Nawa logo
 * palette (#08231C canvas, leaf #18795A, gold #DDA83B, mint #C2DDD4).
 *
 * Left: three focus items. Hovering, focusing or clicking one makes it active: a gold rule
 * grows down its left edge, a leaf-green glass wash fills it and its description and tags
 * unfold (grid-rows 0fr → 1fr). Inactive items sit muted between thin leaf dividers.
 * Right: an organic capsule frame (offset gold outline behind it) whose photograph cross-fades
 * to the active item (opacity + 1.03 → 1), sinking into the canvas at its base, with a glass
 * "Authentic Vaidya Precision" badge and the active item's caption.
 * Phones: the portal sits above a stacked tap-to-open accordion.
 *
 * Entrance (CSS, .cf* in index.css): header, portal and items rise in a 1.2s stagger.
 * Glows are masked off the section edges (.edge-fade), so it continues its neighbours seamlessly.
 */
export default function CoreFocus() {
  const [active, setActive] = useState(0)
  const [ref, visible] = useReveal({ threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
  const uid = useId()
  const current = FOCUS[active]

  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-24 md:py-28 lg:py-36" aria-labelledby="core-focus-title">
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgba(24,121,90,0.15), transparent 45%), radial-gradient(circle at 88% 82%, rgba(221,168,59,0.08), transparent 45%)',
        }}
      />

      <div ref={ref} className={`cf container-x ${visible ? 'is-visible' : ''}`}>
        {/* Header */}
        <div className="max-w-3xl">
          <p className="cf-in flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Our Core Focus</span>
          </p>
          <h2
            id="core-focus-title"
            className="cf-in mt-7 font-serif text-[40px] font-medium leading-[1.04] !text-white sm:text-[52px] lg:text-[64px]"
            style={{ '--d': '150ms' }}
          >
            Three Pillars of <em className="font-normal italic text-logo-gold">Authentic</em>, <em className="font-normal italic text-logo-gold">Restorative</em> Care
          </h2>
          <p className="cf-in mt-7 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '300ms' }}>
            Every treatment at Nawa rests on three commitments: understanding the root cause, medicines made the classical
            way, and healing that lasts long after your visit.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          {/* Image portal (first on phones) */}
          <div className="cf-in relative mx-auto w-full max-w-[400px] lg:order-2 lg:col-span-5 lg:max-w-none" style={{ '--d': '400ms' }}>
            {/* Offset layered outline behind the capsule */}
            <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] border border-logo-gold/25 sm:translate-x-5 sm:translate-y-5" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-leaf/40 bg-[#0c2f24] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
              {FOCUS.map((f, i) => (
                <img
                  key={f.title}
                  src={f.photo.src}
                  srcSet={f.photo.srcSet}
                  sizes="(min-width: 1024px) 40vw, 400px"
                  alt={i === active ? f.photo.alt : ''}
                  aria-hidden={i === active ? undefined : true}
                  loading="lazy"
                  decoding="async"
                  className={`cf-img absolute inset-0 h-full w-full object-cover ${i === active ? 'is-active' : ''}`}
                  style={{ objectPosition: f.position }}
                />
              ))}
              {/* Sinks into the canvas at the base */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-herbal-base via-transparent to-transparent" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/15" />

              {/* Glass badge */}
              <p className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/80 px-4 py-2 text-xs font-medium text-logo-gold backdrop-blur-md sm:left-6 sm:top-6">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-gold" />
                Authentic Vaidya Precision
              </p>

              {/* Active caption */}
              <div aria-hidden="true" className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                <p key={active} className="cf-caption flex items-baseline gap-3">
                  <span className="font-serif text-[22px] italic text-logo-gold">{pad(active + 1)}</span>
                  <span className="font-serif text-[22px] leading-tight text-white sm:text-[24px]">{current.title}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Focus selectors */}
          <ul className="border-t border-leaf/25 lg:order-1 lg:col-span-7">
            {FOCUS.map((f, i) => {
              const on = i === active
              const panelId = `${uid}-panel-${i}`
              const btnId = `${uid}-btn-${i}`
              return (
                <li key={f.title} className="cf-in border-b border-leaf/25" style={{ '--d': `${500 + i * 150}ms` }}>
                  {/* Entrance lives on the <li>; active/muted styling on this inner layer */}
                  <div
                    className={`relative transition-[background-color,opacity] duration-500 ease-premium ${
                      on ? 'bg-leaf/20 opacity-100 backdrop-blur-sm' : 'opacity-60 hover:opacity-90'
                    }`}
                    onMouseEnter={() => setActive(i)}
                  >
                    {/* Gold rule down the left edge of the active item */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-[2px] origin-top bg-logo-gold transition-transform duration-700 ease-premium ${on ? 'scale-y-100' : 'scale-y-0'}`}
                    />
                    <h3>
                      <button
                        id={btnId}
                        type="button"
                        aria-expanded={on}
                        aria-controls={panelId}
                        onClick={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-4 px-5 py-6 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-logo-gold sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:px-7 sm:py-7"
                      >
                        <span aria-hidden="true" className="font-serif text-[40px] font-light leading-none text-logo-gold sm:text-[48px]">
                          {pad(i + 1)}
                        </span>
                        <span>
                          <span className="block font-serif text-[24px] font-medium leading-tight text-white sm:text-[30px]">{f.title}</span>
                          <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70">{f.sub}</span>
                        </span>
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className={`grid transition-[grid-template-rows,opacity] duration-700 ease-premium ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-7 pl-[calc(3.5rem+1rem+1.25rem)] pr-5 sm:pl-[calc(4.5rem+1rem+1.75rem)] sm:pr-7">
                          <p className="max-w-md text-[15px] leading-[1.75] text-mist sm:text-[16px]">{f.text}</p>
                          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Key focus">
                            {f.tags.map((t) => (
                              <li
                                key={t}
                                className="rounded-full border border-logo-gold/35 px-3 py-1.5 text-[10.5px] font-semibold uppercase leading-none tracking-[0.18em] text-logo-gold"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
