import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, Clock, Phone } from 'lucide-react'
import { serviceProcess } from '../data/services'
import { site } from '../data/site'
import { useServices } from '../context/ServicesContext'
import { servicesApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useSEO } from '../hooks/useSEO'
import { mediaUrl } from '../utils/format'
import { serviceHeroFallback, serviceHeroPhotos } from '../data/images'
import StoryHero from '../components/sections/StoryHero'
import PageLoader from '../components/common/PageLoader'
import ServiceGrid from '../components/services/ServiceGrid'
import Button from '../components/common/Button'
import { ErrorState } from '../components/common/StatusMessage'
import FAQSection from '../components/faq/FAQ'
import CTASection from '../components/sections/CTASection'
import Reveal from '../components/common/Reveal'
import NotFound from './NotFound'

/** Logo-palette eyebrow: thin gold line + tracked gold label (`center` adds a trailing line). */
function Eyebrow({ children, center = false, className = '', style }) {
  return (
    <p className={`flex items-center gap-4 leading-none ${center ? 'justify-center' : ''} ${className}`} style={style}>
      <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">{children}</span>
      {center && <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />}
    </p>
  )
}

/** Soft leaf/gold section light, masked off the section edges (.edge-fade) so sections join seamlessly. */
function Glow({ spots }) {
  return (
    <div
      aria-hidden="true"
      className="edge-fade pointer-events-none absolute inset-0 -z-10"
      style={{ background: spots.join(', ') }}
    />
  )
}

/** Short first sentence of a paragraph (for a chapter line). */
const firstSentence = (text = '') => {
  const m = text.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : text).trim()
}

/**
 * Hero chapters built from the service's own data, so every service page tells its story:
 * the service → about it → how it helps → the next step. Chapters with no data are skipped.
 */
function serviceChapters(service) {
  const about = service.description?.split(/\n{2,}/)[0]
  const benefits = service.benefits?.slice(0, 3)
  return [
    {
      eyebrow: 'Ayurvedic Treatment',
      title: service.name,
      text: service.shortDescription,
    },
    about && {
      eyebrow: 'The Treatment',
      title: 'Rooted in Classical Practice',
      text: firstSentence(about),
    },
    benefits?.length > 0 && {
      eyebrow: 'How It Helps',
      title: 'Benefits You Can Feel',
      text: benefits.join(' · '),
    },
    {
      eyebrow: 'Your Next Step',
      title: 'Begin Your Treatment',
      text: 'Book a consultation and our practitioners will shape every session around you.',
      actions: [{ to: '/appointment', label: 'Book This Treatment' }],
    },
  ].filter(Boolean)
}

export default function ServiceDetails() {
  const { slug } = useParams()
  const { services, fromApi } = useServices()

  const { data, loading, error, reload } = useApi(
    (signal) =>
      servicesApi.getBySlug(slug, { signal }).catch((err) => {
        // If the API is down, fall back to the bundled copy so the page still renders.
        const local = services.find((s) => s.slug === slug)
        if (err.status === 0 && local) return { data: local }
        throw err
      }),
    [slug],
  )
  const service = data?.data

  useSEO({
    title: service ? `${service.name} in Abu Dhabi` : loading ? 'Services' : 'Service not found',
    description: service?.shortDescription,
    image: mediaUrl(service?.image),
  })

  if (loading) return <PageLoader />
  if (error?.status === 404) return <NotFound />
  if (error)
    return (
      <div className="container-x pb-20 pt-40">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    )

  const related = services.filter((s) => s.slug !== slug).slice(0, 3)
  const image = mediaUrl(service.image)
  const heroPhoto = serviceHeroPhotos[slug] || serviceHeroFallback

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for the whole page.
  return (
    <div className="theme-logo">
      {/* Hero: the About page's split story hero (logo theme) — photo dissolving in from the right,
          scroll-told chapters from the service's data, breadcrumb and chapter progress at the foot */}
      <StoryHero
        label={service.name}
        layout="split"
        theme="logo"
        chapters={serviceChapters(service)}
        media={
          <img
            src={heroPhoto.src}
            srcSet={heroPhoto.srcSet}
            sizes="(min-width: 1280px) 64vw, (min-width: 1024px) 70vw, 100vw"
            alt={heroPhoto.alt}
            fetchPriority="high"
            decoding="async"
            className="about-hero-media h-full w-full object-cover object-[50%_45%] lg:object-[45%_50%]"
          />
        }
        footer={
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/55 sm:text-[11.5px]">
              <li>
                <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-logo-gold">/</li>
              <li>
                <Link to="/services" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                  Services
                </Link>
              </li>
              <li aria-hidden="true" className="text-logo-gold">/</li>
              <li aria-current="page" className="text-mist/90">{service.name}</li>
            </ol>
          </nav>
        }
      />

      {/* Overview, treatment details, benefits + sidebar */}
      <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-24 lg:py-28" aria-labelledby="overview-title">
        <Glow spots={['radial-gradient(circle at 15% 20%, rgba(24,121,90,0.15), transparent 40%)', 'radial-gradient(circle at 85% 60%, rgba(221,168,59,0.07), transparent 40%)']} />
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          <div>
            {image && (
              <Reveal className="relative overflow-hidden rounded-[30px] border border-leaf/35 bg-[#0c2f24] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
                <img src={image} alt={service.name} className="aspect-[16/10] w-full object-cover saturate-[0.85]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_50%,rgba(8,35,28,0.5)_100%)]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-herbal-base/70 to-transparent" />
              </Reveal>
            )}
            <Reveal className={image ? 'mt-14' : ''}>
              <Eyebrow>Overview</Eyebrow>
              <h2 id="overview-title" className="mt-6 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[46px] lg:text-[52px]">
                About <em className="font-normal italic text-logo-gold">{service.name}</em>
              </h2>
              {service.description
                ?.split(/\n{2,}/)
                .map((para, i) => (
                  <p key={i} className="mt-5 max-w-2xl text-[16px] leading-[1.85] text-mist md:text-[17px]">
                    {para}
                  </p>
                ))}
            </Reveal>

            {service.process?.length > 0 && (
              <div className="mt-16">
                <Eyebrow>Treatment Details</Eyebrow>
                <h2 className="mt-6 font-serif text-[32px] font-medium leading-tight !text-white md:text-[40px]">
                  What the <em className="font-normal italic text-logo-gold">Treatment</em> Includes
                </h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {service.process.map((t, i) => (
                    <Reveal
                      key={t.title + i}
                      delay={i * 80}
                      className="group relative overflow-hidden rounded-[22px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-6 transition-[border-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-1 hover:border-logo-gold/50 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)] sm:p-7"
                    >
                      <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 select-none font-serif text-[44px] font-light leading-none text-logo-gold/20 transition-colors duration-300 group-hover:text-logo-gold/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="relative pr-12 font-serif text-[23px] font-medium leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold">{t.title}</h3>
                      {t.text && <p className="relative mt-3 text-[15px] leading-relaxed text-mist">{t.text}</p>}
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {service.benefits?.length > 0 && (
              <Reveal className="relative mt-16 overflow-hidden rounded-[30px] border border-leaf/35 bg-gradient-to-br from-[#0e3a2c]/70 via-[#0c2f24]/50 to-herbal-base/40 p-8 md:p-10">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full"
                  style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.12), transparent)' }}
                />
                <Eyebrow className="relative">Benefits</Eyebrow>
                <h2 className="relative mt-6 font-serif text-[32px] font-medium leading-tight !text-white md:text-[40px]">
                  How It <em className="font-normal italic text-logo-gold">Helps</em>
                </h2>
                <ul className="relative mt-8 grid gap-x-8 gap-y-5 border-t border-leaf/30 pt-8 sm:grid-cols-2">
                  {service.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[15px] font-medium leading-snug text-white">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-logo-gold" strokeWidth={1.75} aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[28px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-7 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-logo-gold">All Services</p>
              <ul className="mt-5 space-y-2">
                {services.map((s) => {
                  const current = s.slug === slug
                  return (
                    <li key={s._id || s.slug}>
                      <Link
                        to={`/services/${s.slug}`}
                        aria-current={current ? 'page' : undefined}
                        className={`group flex items-center justify-between gap-3 rounded-full border px-5 py-3 text-[14px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold ${
                          current
                            ? 'border-logo-gold bg-logo-gold text-herbal-base'
                            : 'border-leaf/30 bg-leaf/10 text-mist hover:border-logo-gold/60 hover:text-logo-gold'
                        }`}
                      >
                        {s.name}
                        <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="relative mt-6 overflow-hidden rounded-[28px] border border-logo-gold/30 bg-gradient-to-br from-[#0e3a2c] to-herbal-base p-7 text-white">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full"
                style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.16), transparent)' }}
              />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.25em] text-logo-gold">Your next step</p>
              <h2 className="relative mt-3 font-serif text-[30px] font-medium leading-tight !text-white">
                Ready to <em className="font-normal italic text-logo-gold">begin?</em>
              </h2>
              <p className="relative mt-3 text-[14px] leading-relaxed text-mist">Speak to our team or request an appointment online.</p>
              <ul className="relative mt-5 space-y-3 border-t border-leaf/30 pt-5 text-[14px]">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                  <a href={site.phoneHref} className="font-semibold text-white transition-colors hover:text-logo-gold">
                    {site.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-mist">
                  <Clock className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                  {site.hours}
                </li>
              </ul>
              <Button to="/appointment" state={{ service: service.name }} variant="brand" className="relative mt-6 w-full">
                Book Appointment
              </Button>
            </div>
            {!fromApi && <p className="sr-only">Showing offline service information.</p>}
          </aside>
        </div>
      </section>

      {/* Your treatment journey */}
      <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-24 lg:py-28" aria-labelledby="process-title">
        <Glow spots={['radial-gradient(circle at 50% 20%, rgba(24,121,90,0.15), transparent 45%)', 'radial-gradient(circle at 90% 80%, rgba(221,168,59,0.07), transparent 40%)']} />
        <div className="container-x">
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow center>How It Works</Eyebrow>
            <h2 id="process-title" className="mt-7 font-serif text-[38px] font-medium leading-[1.05] !text-white sm:text-[50px] lg:text-[58px]">
              Your Treatment <em className="font-normal italic text-logo-gold">Journey</em>
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6">
            {serviceProcess.map((p, i) => (
              <Reveal
                as="li"
                key={p.step}
                delay={i * 100}
                className="group relative overflow-hidden rounded-[22px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-7 transition-[border-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-1.5 hover:border-logo-gold/50 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)]"
              >
                <span className="font-serif text-[52px] font-light italic leading-none text-logo-gold">{p.step}</span>
                <span aria-hidden="true" className="mt-5 block h-px w-10 bg-leaf/60 transition-[width,background-color] duration-500 ease-premium group-hover:w-16 group-hover:bg-logo-gold" />
                <h3 className="mt-5 font-serif text-[24px] font-medium leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">{p.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <div className="bg-herbal-base pt-6">
        <CTASection />
      </div>

      {/* Helpful answers: the Home page's editorial FAQ (numbered list beside the oil-drop drawing) */}
      <FAQSection
        variant="editorial"
        heading={{
          eyebrow: 'Helpful Answers for You',
          title: (
            <>
              Frequently Asked <em className="font-normal italic text-logo-gold">Questions</em>
            </>
          ),
          text: 'Everything you may want to know before your first visit — and our team is always happy to help with anything else.',
        }}
      />

      {related.length > 0 && (
        <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-24 lg:py-28" aria-labelledby="related-title">
          <Glow spots={['radial-gradient(circle at 12% 25%, rgba(24,121,90,0.15), transparent 40%)', 'radial-gradient(circle at 88% 70%, rgba(221,168,59,0.07), transparent 40%)']} />
          <div className="container-x">
            <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Eyebrow>Explore More</Eyebrow>
                <h2 id="related-title" className="mt-7 font-serif text-[38px] font-medium leading-[1.05] !text-white sm:text-[50px] lg:text-[58px]">
                  Related <em className="font-normal italic text-logo-gold">Services</em>
                </h2>
              </div>
              <Button to="/services" variant="brand" className="self-start md:self-auto">
                View All Services
              </Button>
            </Reveal>
            <ServiceGrid services={related} variant="logo" className="mt-14 lg:mt-16" />
          </div>
        </section>
      )}
    </div>
  )
}
