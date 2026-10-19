import { Link } from 'react-router-dom'
import { ChevronRight, Leaf } from 'lucide-react'
import { servicesHeroPhoto } from '../../data/images'
import Button from '../common/Button'

// Signature therapies from the clinic's own treatment menu (data/services.js).
const RIBBON = [
  'Abhyanga',
  'Shirodhara',
  'Kizhi',
  'Udvartana',
  'Nasya',
  'Takradhara',
  'Kumkumadi Glow Facial',
  'Mukha Lepam',
  'Marma Face Massage',
  'Bhringraj Hair Pack',
  'Herbal Body Scrub',
  'Shiro Abhyanga',
]

const HIGHLIGHTS = ['Tailored to your constitution', 'Classical herbs & oils', 'Experienced practitioners']

/** One run of the ribbon: names separated by small gold leaves. Rendered twice for a seamless loop. */
function RibbonRun({ hidden = false }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {RIBBON.map((name) => (
        <li key={name} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-serif text-[22px] font-normal italic leading-none text-white/85 sm:px-8 sm:text-[28px] lg:text-[34px]">
            {name}
          </span>
          <Leaf className="h-4 w-4 shrink-0 fill-current text-logo-gold sm:h-5 sm:w-5" strokeWidth={1.25} aria-hidden="true" />
        </li>
      ))}
    </ul>
  )
}

/**
 * Services hero, in the Nawa logo palette. Exactly one screen tall (100svh, like the Home hero)
 * and still: nothing drifts with scroll and the content always fits inside it — on short screens
 * the type tightens and the secondary bits (breadcrumb, highlights) step aside, so nothing ever
 * spills below the fold. A full-bleed, low-lit face-massage photograph settles slowly from 1.08 on load;
 * deep #08231C washes hold the copy on the left
 * (an even wash on phones) and a long fade at the foot hands over to the page on pure #08231C.
 * Copy rises in sequence: breadcrumb, gold eyebrow, serif headline (italic gold accent), lead,
 * gold CTA + quiet link, three highlights. A ribbon of signature therapies scrolls endlessly
 * along the bottom (pauses on hover; static under reduced motion).
 * `data-header-dark` lets the site header sit clear over it at the top of the page.
 */
export default function ServicesHero() {
  return (
    <section className="svh relative isolate flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-herbal-base text-white" aria-labelledby="services-hero-title" data-header-dark="">
      {/* Photograph */}
      <div aria-hidden="true" className="svh-media absolute inset-0 -z-20">
        {/* The face sits on the right, clear of the copy; the amber glow warms the wash behind it */}
        <img
          src={servicesHeroPhoto.src}
          srcSet={servicesHeroPhoto.srcSet}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[62%_45%]"
        />
      </div>
      {/* Washes: even on phones; left-weighted on desktop; a deep foot into the page */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-herbal-base/70 lg:bg-herbal-base/25" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-herbal-base from-10% via-herbal-base/75 via-45% to-transparent lg:block" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-herbal-base/80 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[45%] bg-gradient-to-t from-herbal-base from-20% via-herbal-base/70 to-transparent" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 18% 42%, rgba(221,168,59,0.10), transparent 40%), radial-gradient(circle at 30% 95%, rgba(24,121,90,0.18), transparent 45%)',
        }}
      />

      {/* Copy */}
      <div className="container-x relative flex min-h-0 flex-1 items-center pb-6 pt-[96px] sm:pb-8 sm:pt-[110px] lg:pt-[120px]">
        <div className="max-w-[680px]">
          <nav aria-label="Breadcrumb" className="svh-in [@media(max-height:680px)]:hidden" style={{ '--d': '150ms' }}>
            <ol className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/70">
              <li>
                <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-logo-gold focus-visible:outline-logo-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-logo-gold">
                Services
              </li>
            </ol>
          </nav>

          <p className="svh-in mt-6 flex items-center gap-4 leading-none sm:mt-8 [@media(max-height:680px)]:mt-0" style={{ '--d': '300ms' }}>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Our Services</span>
          </p>

          <h1
            id="services-hero-title"
            className="svh-in mt-5 font-serif text-[38px] font-medium leading-[1.03] !text-white sm:mt-6 sm:text-[56px] lg:text-[72px] xl:text-[80px] [@media(max-height:760px)]:lg:text-[60px]"
            style={{ '--d': '450ms' }}
          >
            Authentic Ayurvedic <em className="font-normal italic text-logo-gold">Therapies</em>, Tailored to You
          </h1>

          <p className="svh-in mt-5 max-w-xl text-[15px] font-light leading-relaxed text-mist sm:mt-6 sm:text-[17px] lg:text-[18px]" style={{ '--d': '650ms' }}>
            From classical oil therapies to restorative facials and hair rituals — every treatment is tailored to your
            constitution and delivered with care by our experienced practitioners.
          </p>

          <div className="svh-in mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 lg:mt-9" style={{ '--d': '800ms' }}>
            <Button to="/appointment" variant="brand">
              Book an Appointment
            </Button>
            <a
              href="#all-services"
              className="rounded-sm py-2 text-[14px] font-semibold tracking-[0.02em] text-mist underline decoration-logo-gold/50 underline-offset-[7px] transition-colors duration-300 hover:text-logo-gold hover:decoration-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
            >
              Explore all treatments
            </a>
          </div>

          <ul className="svh-in mt-8 hidden flex-wrap gap-x-8 gap-y-3 sm:flex lg:mt-10 [@media(max-height:820px)]:hidden" style={{ '--d': '950ms' }}>
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-[13px] font-medium leading-snug text-mist">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-logo-gold" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scrolling ribbon of signature therapies (decorative; the full menu is below) */}
      <div aria-hidden="true" className="svh-in svh-ribbon relative shrink-0 border-y border-leaf/30 py-4 sm:py-5" style={{ '--d': '1100ms' }}>
        <div className="svh-track flex w-max">
          <RibbonRun />
          <RibbonRun hidden />
        </div>
      </div>
    </section>
  )
}
