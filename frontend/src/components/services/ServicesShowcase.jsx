import { servicesShowcasePhotos } from '../../data/images'
import { useStoryProgress } from '../sections/StoryHero'

const SLIDES = [
  {
    key: 'purification',
    eyebrow: 'Holistic Purification',
    title: 'Panchakarma & Deep Cellular Detox',
    text: 'Time-tested classical therapies designed to eliminate accumulated toxins, revitalize metabolic agni, and restore balance across your tri-doshas.',
    position: '38% 45%',
  },
  {
    key: 'rejuvenation',
    eyebrow: 'Rejuvenation Therapy',
    title: 'Rasayana & Vital Energy Restoration',
    text: 'Customized herbal elixirs, medicated steam baths, and synchronized abhyanga to slow degeneration, enhance immunity, and foster vitality.',
    position: '55% 50%',
  },
  {
    key: 'clinical',
    eyebrow: 'Specialized Clinical Care',
    title: 'Targeted Relief for Chronic Ailments',
    text: 'Expert Vaidya-guided treatments for chronic spine, joint pain, stress-induced insomnia, and lifestyle-related metabolic disorders.',
    position: '50% 40%',
  },
]

const pad = (n) => String(n).padStart(2, '0')

/**
 * Services — pinned "signature care" showcase, built in the Services hero's visual language
 * (one full screen, #08231C canvas, photo dissolving in from the right, large serif headings,
 * left-aligned copy). A 300vh track holds a sticky 100svh stage; scroll progress picks the slide
 * (0–33% → 01, 34–66% → 02, 67–100% → 03) via the shared story scroll engine.
 *
 * Motion (CSS, see .svs* in index.css): outgoing copy fades and drifts up 20px; incoming copy
 * fades up after a short delay (0.6s ease-out); photographs cross-fade while the incoming one
 * settles 1.04 → 1. Foot: "SERVICES / 0n" with a rolling numeral, and three gold/leaf dashes
 * that jump to their slide. It opens the Services page (the header sits clear over it via
 * data-header-dark) and ends on solid #08231C, so the page below continues without a seam.
 * Reduced motion: the three slides stack in flow.
 */
export default function ServicesShowcase() {
  const [ref, active, , goTo] = useStoryProgress(SLIDES.length)
  const shown = Math.max(active, 0)

  return (
    <section ref={ref} className="svs relative bg-herbal-base" aria-label="Signature care" data-header-dark="">
      {/* The showcase opens the Services page: its page title for assistive tech */}
      <h1 className="sr-only">Ayurvedic Services at Nawa Ayurveda</h1>
      <div className="svs-stage sticky top-0 isolate flex w-full flex-col overflow-hidden text-white">
        {/* Photographs: full bleed on phones, the right ~68% on desktop; cross-faded per slide */}
        <div aria-hidden="true" className="absolute inset-0 -z-20 lg:left-auto lg:w-[68%]">
          {SLIDES.map((s, i) => {
            const photo = servicesShowcasePhotos[s.key]
            return (
              <img
                key={s.key}
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(min-width: 1024px) 68vw, 100vw"
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`svs-img absolute inset-0 h-full w-full object-cover ${i === shown ? 'is-active' : ''}`}
                style={{ objectPosition: s.position }}
              />
            )
          })}
        </div>
        {/* Dissolve: even wash on phones; on desktop #08231C 30% → clear 80% from the left */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-herbal-base/70 lg:bg-herbal-base/20" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-[linear-gradient(to_right,#08231C_30%,transparent_80%)] lg:block" />
        {/* Brand light: gold behind the copy, leaf green low. Painted BEFORE the edge fades below,
            so they cover it and the stage always starts and ends on solid #08231C (no band). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 18% 45%, rgba(221,168,59,0.10), transparent 40%), radial-gradient(circle at 30% 80%, rgba(24,121,90,0.16), transparent 42%)',
          }}
        />
        {/* Solid #08231C at the top and a long fade at the foot: seamless with both neighbours */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-herbal-base to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[45%] bg-[linear-gradient(to_bottom,transparent,rgba(8,35,28,0.7)_60%,#08231C_100%)]" />

        {/* Slides (inactive ones are visibility:hidden, so out of the tab order and a11y tree) */}
        <div className="container-x relative flex flex-1 items-center pt-[96px] sm:pt-[110px] lg:pt-[120px]">
          <div className="svs-panels grid w-full lg:w-[60%] xl:w-[56%]">
            {SLIDES.map((s, i) => {
              const state = i === shown && active >= 0 ? 'is-active' : i < shown ? 'is-before' : 'is-after'
              return (
                <article key={s.key} className={`svs-panel ${state} [grid-area:1/1] self-center`} aria-hidden={state !== 'is-active' || undefined}>
                  <p className="svs-item flex items-center gap-3 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-logo-gold sm:text-[12px]" style={{ '--i': 0 }}>
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-logo-gold" />
                    <span className="tabular-nums">{pad(i + 1)}</span>
                    <span aria-hidden="true">/</span>
                    {s.eyebrow}
                  </p>
                  <h2
                    className="svs-item mt-5 font-serif text-[38px] font-medium leading-[1.03] !text-white sm:mt-6 sm:text-[56px] lg:text-[72px] xl:text-[80px] [@media(max-height:760px)]:lg:text-[60px]"
                    style={{ '--i': 1 }}
                  >
                    {s.title}
                  </h2>
                  <p className="svs-item mt-5 max-w-xl text-[15px] font-light leading-relaxed text-mist sm:mt-6 sm:text-[17px] lg:text-[18px]" style={{ '--i': 2 }}>
                    {s.text}
                  </p>
                </article>
              )
            })}
          </div>
        </div>

        {/* Foot: step tracker (rolling numeral) and three dashes */}
        <div className="container-x relative flex items-center justify-between gap-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 sm:pb-9 lg:pb-12">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-mist/70 sm:text-[12px]">
            Services <span aria-hidden="true">/</span>
            <span className="svs-roll relative inline-block h-[1em] overflow-hidden tabular-nums text-logo-gold" aria-hidden="true">
              <span className="svs-roll-strip block" style={{ '--n': shown }}>
                {SLIDES.map((s, i) => (
                  <span key={s.key} className="block h-[1em]">
                    {pad(i + 1)}
                  </span>
                ))}
              </span>
            </span>
            <span className="sr-only">
              {pad(shown + 1)} of {pad(SLIDES.length)}
            </span>
          </p>
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${s.title}`}
                aria-current={i === shown ? 'step' : undefined}
                className="group grid h-8 place-items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold"
              >
                <span
                  className={`block h-[2px] transition-[width,background-color] duration-500 ease-premium ${
                    i === shown ? 'w-12 bg-logo-gold' : 'w-7 bg-leaf/30 group-hover:bg-leaf/70'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
