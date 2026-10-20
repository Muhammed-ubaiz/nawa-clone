import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Leaf, Star } from 'lucide-react'
import { heroVideo, images } from '../data/images'
import HeroVideo from '../components/common/HeroVideo'
import { useServices } from '../context/ServicesContext'
import { featuredPrograms } from '../data/programs'
import { blogsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { whyChooseUs } from '../data/content'
import { shareImage, site } from '../data/site'
import { useSEO } from '../hooks/useSEO'
import Button from '../components/common/Button'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from 'react-router-dom'
import { mediaUrl } from '../utils/format'
import ProgramCard from '../components/programs/ProgramCard'
import HomeBlogEditorial, { HomeBlogEditorialSkeleton } from '../components/blog/HomeBlogEditorial'
import { EmptyState, ErrorState } from '../components/common/StatusMessage'
import FAQSection from '../components/faq/FAQ'
import TeamSection from '../components/sections/TeamSection'
import CTASection from '../components/sections/CTASection'
import Reveal from '../components/common/Reveal'
import CountUp from '../components/common/CountUp'
import StoryHero from '../components/sections/StoryHero'

// Opening story: four chapters over the one hero video (see StoryHero).
const HERO_CHAPTERS = [
  {
    eyebrow: 'Nawa Ayurveda',
    title: ['Ancient Wisdom.', 'A More Balanced You.'],
    text: 'Discover authentic Ayurvedic care designed to restore balance, support wellbeing, and nurture the whole you.',
    actions: [
      { to: '/services', label: 'Explore Our Treatments' },
      { to: '/appointment', label: 'Book an Appointment', secondary: true },
    ],
    // Existing social proof; dropped on short screens so the stage never clips.
    extra: (
      <div className="flex items-center gap-3 [@media(max-height:760px)]:hidden">
        <div className="flex -space-x-3">
          {[images.client1, images.client2, images.client3].map((src) => (
            <img key={src} src={src} alt="" className="h-10 w-10 rounded-full border-2 border-white/80 object-cover" />
          ))}
        </div>
        <div className="leading-tight">
          <div className="flex gap-0.5 text-accent" aria-label="Rated 5 out of 5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            ))}
          </div>
          <p className="mt-1 text-[13px] font-semibold text-white">Trusted by 1000+ patients</p>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Our Approach',
    title: 'Healing Beyond Treatment',
    text: 'We look beyond symptoms to understand the individual, creating a thoughtful path towards lasting balance and wellbeing.',
  },
  {
    eyebrow: 'Personalized Ayurveda',
    title: 'Care That Begins With You',
    text: 'Every person is different. Our approach combines traditional Ayurvedic principles with personalized care shaped around your needs.',
    actions: [{ to: '/about', label: 'Discover Our Approach' }],
  },
  {
    eyebrow: 'Your Wellness Journey',
    title: 'Begin Your Journey Towards Balance',
    text: 'Step into a calmer, healthier way of living with authentic Ayurvedic care and mindful wellness.',
    actions: [{ to: '/appointment', label: 'Book an Appointment' }],
  },
]

/** Home opening: the scroll-told story over the hero video (full-bleed, plays continuously). */
function Hero() {
  return (
    <StoryHero
      label="Nawa Ayurvedic Medical Centre"
      layout="full"
      theme="logo"
      cue
      chapters={HERO_CHAPTERS}
      media={
        // Decorative video: poster first, sources attach after load; pauses only when off screen.
        <div aria-hidden="true" className="hero-film relative h-full w-full">
          <HeroVideo webm={heroVideo.webm} mp4={heroVideo.mp4} mobile={heroVideo.mobile} poster={heroVideo.poster} />
        </div>
      }
    />
  )
}

/** Reveals the arch photo once when it scrolls into view (opacity + a short horizontal slide). */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, visible]
}

/** Gold leaf mark used as the section's small ornament. */
function LeafMark({ className = '' }) {
  return <Leaf className={`fill-current text-accent ${className}`} strokeWidth={1.25} aria-hidden="true" />
}

/**
 * Side item in the logo palette: gold numeral, white serif title, a short leaf rule and mint
 * copy. `align="right"` mirrors it toward the arch on desktop.
 */
function WhoItem({ title, text, index, align = 'left' }) {
  const right = align === 'right'
  return (
    <div className={`group ${right ? 'xl:text-right' : ''}`}>
      <p aria-hidden="true" className="font-serif text-[20px] italic leading-none text-logo-gold">
        {String(index).padStart(2, '0')}
      </p>
      <h3 className="mt-3 font-serif text-[26px] font-medium leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold md:text-[28px]">
        {title}
      </h3>
      <span
        aria-hidden="true"
        className={`mt-4 block h-px w-10 bg-leaf/60 transition-[width,background-color] duration-500 ease-premium group-hover:w-16 group-hover:bg-logo-gold ${right ? 'xl:ml-auto' : ''}`}
      />
      <p className={`mt-4 max-w-[380px] text-[15px] leading-[1.75] text-mist md:text-[16px] ${right ? 'xl:ml-auto' : ''}`}>{text}</p>
    </div>
  )
}

// Existing site copy only: the Who-we-are description and card titles, and the section's
// "Facial Treatment" / "Relaxing Massage" labels with their existing service descriptions.
const WHO_LEFT = [
  {
    title: 'Personalised plans',
    text: 'Every guest receives a personal consultation, a treatment plan built around their constitution, and therapies delivered by experienced practitioners in a calm, welcoming space.',
  },
  {
    title: 'Authentic herbs & oils',
    text: 'We combine classical Ayurvedic knowledge with a modern clinical approach. Prepared using classical methods.',
  },
]
const WHO_RIGHT = [
  { title: 'Facial Treatment', text: 'Botanical facials using herbs, oils and gentle massage for a clear, glowing complexion.' },
  { title: 'Relaxing Massage', text: 'Full-body warm oil massage that nourishes tissues, calms the nervous system and improves circulation.' },
]

function WhoWeAre() {
  const sectionRef = useRef(null)
  const [photoRef, photoIn] = useInView()

  const scrollToNext = () => {
    const next = sectionRef.current?.nextElementSibling
    if (!next) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: next.getBoundingClientRect().top + window.scrollY - 70, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section ref={sectionRef} className="relative isolate overflow-x-clip bg-herbal-base py-16 md:py-20 lg:py-24" aria-labelledby="who-title">
      {/* Logo-palette light: leaf green behind the arch, gold low right; masked off the section edges */}
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(24,121,90,0.18), transparent 38%), radial-gradient(circle at 12% 80%, rgba(24,121,90,0.10), transparent 35%), radial-gradient(circle at 88% 78%, rgba(221,168,59,0.07), transparent 35%)',
        }}
      />
      <div className="mx-auto grid w-full max-w-[1640px] items-start gap-12 xl:items-center px-4 sm:px-6 md:grid-cols-2 md:gap-x-12 md:gap-y-14 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)] xl:gap-x-16 2xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)_minmax(0,1fr)] 2xl:gap-x-[104px]">
        {/* Centre arch: ornament, label, heading, CTA, then the photo filling the base */}
        <div className="mx-auto w-full max-w-[520px] md:col-span-2 xl:order-2 xl:col-span-1 xl:max-w-none">
          <div className="relative overflow-hidden rounded-b-[28px] rounded-t-[999px] border border-leaf/40 bg-gradient-to-b from-[#0e3a2c] via-[#0c2f24] to-herbal-base text-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
            {/* Fine gold arch line inside the frame, and a warm glow at the crown */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-b-[20px] rounded-t-[999px] border border-logo-gold/20 sm:inset-4" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
              style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(221,168,59,0.14), transparent 60%)' }}
            />
            <Reveal className="relative flex flex-col items-center px-8 pb-10 pt-20 text-center sm:px-12 sm:pt-24 xl:pb-14 xl:pt-28">
              <LeafMark className="h-8 w-8" />
              <p className="mt-10 flex items-center gap-3 text-[12px] font-semibold uppercase leading-none tracking-[0.25em] text-logo-gold">
                <span aria-hidden="true" className="h-px w-8 bg-logo-gold/70" />
                Who we are
                <span aria-hidden="true" className="h-px w-8 bg-logo-gold/70" />
              </p>
              <h2 id="who-title" className="mt-7 max-w-[400px] font-serif text-[42px] font-medium leading-[1.08] text-white sm:text-[51px] xl:text-[62px]">
                Professional Care, Inspired by <em className="font-normal italic text-logo-gold">Nature</em>
              </h2>
              <p className="mt-5 max-w-[340px] text-[15px] leading-[1.7] text-mist">
                Authentic Ayurveda in the heart of Abu Dhabi — personal, unhurried and rooted in classical practice.
              </p>
              <Button to="/about" variant="brand" size="sm" className="mt-8">
                Learn More
              </Button>
            </Reveal>
            <div ref={photoRef} className={`who-photo relative border-t border-leaf/30 ${photoIn ? 'is-visible' : ''}`}>
              <img
                src={images.whoWeAre}
                alt="Therapist pouring warm herbal oil during an Ayurvedic massage"
                loading="lazy"
                decoding="async"
                width="1000"
                height="667"
                className="aspect-[16/9] w-full object-cover object-[45%_50%] xl:aspect-[600/320]"
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/85 to-transparent" />
              <button
                type="button"
                onClick={scrollToNext}
                className="absolute bottom-4 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-logo-gold/50 bg-herbal-base/60 text-logo-gold backdrop-blur-sm transition-[translate,background-color,color] duration-500 ease-premium hover:translate-y-1 hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-logo-gold"
                aria-label="Scroll to the next section"
              >
                <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Left column (right-aligned toward the arch on desktop) */}
        <Reveal delay={120} className="flex flex-col gap-12 xl:order-1 xl:gap-14 xl:self-end xl:pb-[72px]">
          {WHO_LEFT.map((item, i) => (
            <WhoItem key={item.title} {...item} index={i + 1} align="right" />
          ))}
          {/* Badge: gold leaf circle + a two-line label/value (wraps cleanly in any column width) */}
          <p className="flex items-center gap-4 xl:justify-end xl:text-right">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-logo-gold/40 xl:order-2">
              <LeafMark className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col xl:order-1">
              <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-mist/70">Experience</span>
              <span className="mt-1.5 font-serif text-[18px] font-medium leading-none text-logo-gold md:text-[19px]">10+ Years</span>
            </span>
          </p>
        </Reveal>

        {/* Right column */}
        <Reveal delay={240} className="flex flex-col gap-12 xl:order-3 xl:gap-14 xl:self-end xl:pb-[72px]">
          {WHO_RIGHT.map((item, i) => (
            <WhoItem key={item.title} {...item} index={WHO_LEFT.length + i + 1} />
          ))}
          {/* Badge: gold leaf circle + "Call us anytime" over the number (never overflows its column) */}
          <a
            href={site.phoneHref}
            className="group flex items-center gap-4 self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-logo-gold/40 transition-colors duration-300 group-hover:bg-logo-gold/15">
              <LeafMark className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-mist/70">Call us anytime</span>
              <span className="mt-1.5 whitespace-nowrap font-serif text-[18px] font-medium leading-none tracking-[0.01em] text-white transition-colors duration-300 group-hover:text-logo-gold md:text-[19px]">
                {site.phone}
              </span>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  )
}

function ServicesSection() {
  const { services } = useServices()
  // Feature the four signature categories when present, otherwise the first four.
  const featured = ['body-scrubs-wraps', 'facial-shine-bright', 'ayurvedic-therapies', 'hair-packs']
  const picked = featured.map((slug) => services.find((s) => s.slug === slug)).filter(Boolean)
  const homeServices = (picked.length === 4 ? picked : services).slice(0, 4)
  return (
    <section className="svc-section relative isolate overflow-hidden section-y" aria-labelledby="services-title">
      {/* Logo-palette light, masked off the section edges so it continues its neighbours seamlessly */}
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 12% 20%, rgba(24,121,90,0.15), transparent 40%), radial-gradient(circle at 88% 75%, rgba(221,168,59,0.07), transparent 40%)',
        }}
      />
      <div className="container-x">
        {/* Heading: gold-line eyebrow, white serif title with a gold italic accent, mint lead; gold CTA */}
        <Reveal variant="group" className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Our Services</span>
            </p>
            <h2 id="services-title" className="mt-7 font-serif text-[40px] font-medium leading-[1.05] text-white sm:text-[52px] lg:text-[62px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '90ms' }}>
                  Nawa Ayurveda <em className="font-normal italic text-logo-gold">Wellness</em> Therapies
                </span>
              </span>
            </h2>
            <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '220ms' }}>
              Classical oil therapies, botanical facials and herbal hair rituals — each one tailored to your constitution.
            </p>
          </div>
          <div className="r-item shrink-0" style={{ '--d': '300ms' }}>
            <Button to="/services" variant="brand">
              View All Services
            </Button>
          </div>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-[440px] gap-x-6 gap-y-14 sm:max-w-none sm:grid-cols-2 lg:mt-20 xl:grid-cols-4">
          {homeServices.map((s, i) => (
            <Reveal key={s._id || s.slug} delay={i * 100}>
              <HomeServiceCard service={s} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Home-only service card in the logo palette: rounded-top photo (warm herbal tint, deep foot,
 * leaf-green frame warming to gold) with a gold number badge and a notched title tab rising out
 * of its base; serif title warming to gold, a leaf rule, mint copy and a gold "Explore" cue.
 */
function HomeServiceCard({ service, index = 0 }) {
  const { slug, name, shortDescription, image } = service
  return (
    <Link
      to={`/services/${slug}`}
      className="group flex h-full flex-col rounded-[28px] transition-transform duration-500 ease-premium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold md:hover:-translate-y-1.5"
      aria-label={`${name} — learn more`}
    >
      <div className="relative aspect-[20/19] overflow-hidden rounded-t-[28px] bg-[#0c2f24] ring-1 ring-inset ring-leaf/35 transition-shadow duration-500 group-hover:ring-logo-gold/50">
        {image && (
          <img
            src={mediaUrl(image)}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover saturate-[0.85] transition-transform duration-[900ms] ease-premium md:group-hover:scale-[1.05]"
          />
        )}
        {/* Warm herbal tint, darker edges and a deep foot toward the title tab */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_45%,rgba(8,35,28,0.5)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/80 to-transparent" />
        <span aria-hidden="true" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-logo-gold/50 bg-herbal-base/60 font-serif text-[16px] italic text-logo-gold backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="svc-tab w-[78%] px-3 pb-1 pt-4 text-center sm:w-[84%] 2xl:w-[72%]">
          <h3 className="truncate font-serif text-[23px] font-medium leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold lg:text-[25px]">
            {name}
          </h3>
        </div>
      </div>
      <span aria-hidden="true" className="mx-auto mt-4 block h-px w-10 bg-leaf/60 transition-[width,background-color] duration-500 ease-premium group-hover:w-16 group-hover:bg-logo-gold" />
      {shortDescription && (
        <p className="mx-auto mt-4 line-clamp-3 max-w-[330px] px-3 text-center text-[15px] leading-[1.75] text-mist lg:text-[16px]">
          {shortDescription}
        </p>
      )}
      <span className="mx-auto mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-logo-gold">
        Explore
        <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

function ProgramsSection() {
  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-28 lg:py-32" aria-labelledby="programs-title">
      {/* Logo-palette light, masked off the section edges so it continues its neighbours seamlessly */}
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, rgba(24,121,90,0.16), transparent 42%), radial-gradient(circle at 10% 75%, rgba(24,121,90,0.10), transparent 38%), radial-gradient(circle at 90% 70%, rgba(221,168,59,0.07), transparent 38%)',
        }}
      />
      <div className="container-x">
        {/* Centred heading: gold-line eyebrow, white serif title with a gold italic accent, mint lead */}
        <Reveal variant="group" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Our Programs</span>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
          </p>
          <h2 id="programs-title" className="mt-7 font-serif text-[40px] font-medium leading-[1.05] text-white sm:text-[52px] lg:text-[62px]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Our Specialized <em className="font-normal italic text-logo-gold">Ayurvedic</em> Care Programs
              </span>
            </span>
          </h2>
          <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '280ms' }}>
            Structured, multi-day Ayurvedic programs designed around your goals and guided by our practitioners from start to finish.
          </p>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-[460px] gap-6 md:max-w-none md:grid-cols-2 lg:mt-20 xl:grid-cols-4">
          {featuredPrograms.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProgramCard program={p} index={i} variant="editorial" />
            </Reveal>
          ))}
        </div>
        <Reveal delay={200} className="mt-12 flex justify-center lg:mt-14">
          <Button to="/programs" variant="brand">View All Programs</Button>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * One benefit in the logo palette: its own icon in a gold-ringed glass circle (gently swaying),
 * a gold numeral, white serif title warming to gold, a leaf rule and mint copy.
 * `align="right"` mirrors it toward the photo on desktop.
 */
function WhyItem({ icon: Icon = Leaf, title, text, index, align = 'left', delay, leafDelay = 0 }) {
  const right = align === 'right'
  return (
    <Reveal delay={delay} className={`group ${right ? 'xl:text-right' : ''}`}>
      <div className={`flex items-center gap-5 ${right ? 'xl:justify-end' : ''}`}>
        {/* Wrapper carries the continuous sway; the circle fills gold on hover. */}
        <span className={`leaf-icon inline-flex shrink-0 ${right ? 'xl:order-2' : ''}`} style={{ animationDelay: `${leafDelay}s` }}>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-logo-gold/45 bg-leaf/15 text-logo-gold transition-[background-color,color,border-color] duration-500 ease-premium group-hover:border-logo-gold group-hover:bg-logo-gold group-hover:text-herbal-base">
            <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
          </span>
        </span>
        <div className={right ? 'xl:order-1' : ''}>
          <p aria-hidden="true" className="font-serif text-[18px] italic leading-none text-logo-gold">
            {String(index).padStart(2, '0')}
          </p>
          <h3 className="mt-2 font-serif text-[26px] font-medium leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold md:text-[28px]">
            {title}
          </h3>
        </div>
      </div>
      <span
        aria-hidden="true"
        className={`mt-5 block h-px w-10 bg-leaf/60 transition-[width,background-color] duration-500 ease-premium group-hover:w-16 group-hover:bg-logo-gold ${right ? 'xl:ml-auto' : ''}`}
      />
      <p className={`mt-5 max-w-[380px] text-[16px] leading-[1.75] text-mist md:text-[17px] ${right ? 'xl:ml-auto' : ''}`}>{text}</p>
    </Reveal>
  )
}

function WhyChooseUs() {
  const [photoRef, photoIn] = useInView()
  const left = whyChooseUs.slice(0, 2)
  const right = whyChooseUs.slice(2, 4)
  return (
    <section className="why-section relative isolate overflow-x-clip bg-herbal-base pb-16 pt-20 md:pb-24 md:pt-28 lg:pt-32" aria-labelledby="why-title">
      {/* Logo-palette light behind the arch, masked off the section edges (no seam) */}
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, rgba(24,121,90,0.18), transparent 40%), radial-gradient(circle at 12% 30%, rgba(221,168,59,0.06), transparent 35%), radial-gradient(circle at 88% 70%, rgba(24,121,90,0.10), transparent 35%)',
        }}
      />
      {/* Outer faint leaf-green arch framing the whole section */}
      <div aria-hidden="true" className="why-arch-line left-1/2 top-4 hidden h-full w-[min(1300px,78vw)] -translate-x-1/2 lg:block" />

      <div className="relative mx-auto w-full max-w-[1640px] px-4 sm:px-6 lg:px-8">
        {/* Centred heading: gold-line eyebrow, white serif title with a gold italic accent, mint lead */}
        <Reveal variant="group" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Why Choose Us</span>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
          </p>
          <h2 id="why-title" className="mt-7 font-serif text-[40px] font-medium leading-[1.05] text-white sm:text-[52px] lg:text-[62px]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Why Choose <em className="font-normal italic text-logo-gold">Nawa</em> Ayurvedic Medical Centre
              </span>
            </span>
          </h2>
          <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '280ms' }}>
            Thoughtful care at every step — from your first call to your final session, and long after.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-x-12 md:gap-y-14 lg:mt-[120px] xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)_minmax(0,1fr)] xl:gap-x-16 2xl:grid-cols-[minmax(0,1fr)_minmax(0,530px)_minmax(0,1fr)]">
          {/* Centre arch photo with an inner arch line around it */}
          <div className="relative mx-auto w-full max-w-[430px] md:col-span-2 xl:order-2 xl:col-span-1 xl:max-w-none">
            <div aria-hidden="true" className="why-arch-line why-arch-line--gold -inset-x-[70px] -top-[70px] bottom-0 hidden lg:block" />
            <div
              ref={photoRef}
              className={`why-photo relative overflow-hidden rounded-b-[24px] rounded-t-[999px] border border-leaf/40 bg-[#0c2f24] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.75)] ${photoIn ? 'is-visible' : ''}`}
            >
              {/* Clinic-supplied photo (public/images/why-choose-us.webp). To be replaced by the
                  matching video, with a sound toggle, once the file is provided. */}
              <img
                src="/images/why-choose-us.webp"
                alt="Hands grinding fresh herbs in a stone mortar beside a lit candle"
                loading="lazy"
                decoding="async"
                width="736"
                height="1308"
                className="aspect-[4/5] w-full object-cover object-[50%_45%] saturate-[0.9] xl:aspect-[640/830]"
              />
              {/* Warm herbal tint, darker edges and a deep foot */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_45%,rgba(8,35,28,0.55)_100%)]" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-herbal-base/80 to-transparent" />
            </div>
          </div>

          {/* Left benefits (mirrored toward the photo on desktop) */}
          <div className="flex flex-col gap-12 xl:order-1 xl:gap-[100px] xl:self-end xl:pb-[90px]">
            {left.map((item, i) => (
              <WhyItem key={item.title} {...item} index={i + 1} align="right" delay={150 + i * 120} leafDelay={i * 0.6} />
            ))}
          </div>

          {/* Right benefits */}
          <div className="flex flex-col gap-12 xl:order-3 xl:gap-[100px] xl:self-end xl:pb-[90px]">
            {right.map((item, i) => (
              <WhyItem key={item.title} {...item} index={left.length + i + 1} delay={270 + i * 120} leafDelay={1.2 + i * 0.6} />
            ))}
          </div>
        </div>

        <Reveal delay={200} className="mt-14 flex justify-center lg:mt-20">
          <Link
            to="/appointment"
            className="group inline-flex items-center gap-3 rounded-full border border-leaf/40 bg-[#0c2f24] py-2.5 pl-2.5 pr-6 text-[15px] font-semibold leading-none text-white transition-[background-color,border-color,color,transform] duration-[450ms] ease-premium hover:-translate-y-0.5 hover:border-logo-gold hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-logo-gold text-herbal-base transition-[transform,background-color] duration-500 ease-premium group-hover:rotate-[-20deg] group-hover:bg-herbal-base group-hover:text-logo-gold">
              <Leaf className="h-4 w-4 fill-current" strokeWidth={1.25} aria-hidden="true" />
            </span>
            Book Appointment
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

const ABOUT_STATS = [
  ['10+', 'Years experience'],
  ['1000+', 'Happy patients'],
  ['25+', 'Therapies'],
]

function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-herbal-base py-20 md:py-28 lg:py-36" aria-labelledby="about-title">
      {/* Almost-invisible flowing lines framing the copy on wide screens */}
      <svg aria-hidden="true" viewBox="0 0 800 200" fill="none" className="pointer-events-none absolute -right-24 top-[14%] hidden w-[42%] text-primary/[0.07] lg:block">
        <path d="M0 150 C 180 40 360 190 560 90 S 760 60 800 20" stroke="currentColor" strokeWidth="1.2" />
        <path d="M0 175 C 200 70 380 210 580 115 S 770 90 800 50" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 800 200" fill="none" className="pointer-events-none absolute -left-24 top-[34%] hidden w-[42%] -scale-x-100 text-primary/[0.07] lg:block">
        <path d="M0 150 C 180 40 360 190 560 90 S 760 60 800 20" stroke="currentColor" strokeWidth="1.2" />
        <path d="M0 175 C 200 70 380 210 580 115 S 770 90 800 50" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      <div className="container-x relative">
        {/* Centred editorial statement: eyebrow → title → intro → note → actions */}
        <Reveal variant="group" className="mx-auto flex max-w-[920px] flex-col items-center text-center">
          <p className="r-item flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-8 bg-primary/50 sm:w-10" />
            About Nawa Ayurveda
            <span aria-hidden="true" className="h-px w-8 bg-primary/50 sm:w-10" />
          </p>
          <h2 id="about-title" className="mt-7 font-serif text-[42px] leading-[1.06] tracking-[-0.01em] text-text sm:text-[56px] md:mt-8 md:text-[64px] lg:text-[72px] xl:text-[84px] xl:leading-[1.03]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '150ms' }}>
                Empowering Health Through <em className="font-medium italic text-primary">Expert Care</em>
              </span>
            </span>
          </h2>
          <p className="r-item mt-8 max-w-[640px] text-[16px] leading-[1.85] text-text-soft md:mt-10 md:text-[17px]" style={{ '--d': '300ms' }}>
            At Nawa Ayurvedic Medical Centre, we bring the healing wisdom of Ayurveda to the heart of Abu Dhabi. Our goal is to restore
            harmony between body, mind, and soul through authentic Ayurvedic treatments designed to rejuvenate and heal naturally.
          </p>
          <div className="r-item mt-9 flex flex-col items-center" style={{ '--d': '400ms' }}>
            <LeafMark className="h-5 w-5" />
            <p className="mt-4 max-w-[560px] font-serif text-[21px] italic leading-[1.45] text-text/80 md:text-[24px]">
              Our practitioners take the time to understand your constitution, lifestyle and goals before recommending any therapy.
            </p>
          </div>
          <div className="r-item mt-11 flex flex-col items-center gap-6 sm:flex-row sm:gap-9" style={{ '--d': '500ms' }}>
            <Button to="/about" variant="brand">
              Learn More
            </Button>
            <Link
              to="/appointment"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold tracking-[0.02em] text-text transition-colors duration-300 hover:text-primary"
            >
              <span className="border-b border-text/25 pb-1 transition-colors duration-300 group-hover:border-primary">Book a Consultation</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-[450ms] ease-premium group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        {/* Editorial statistics row */}
        <dl className="mt-20 grid grid-cols-2 border-t border-text/15 sm:grid-cols-3 lg:mt-28">
          {ABOUT_STATS.map(([value, label], i) => (
            <Reveal
              key={label}
              delay={200 + i * 160}
              className={`flex flex-col items-center px-3 py-10 text-center sm:py-14 ${i === 1 ? 'border-l border-text/15' : ''} ${
                i === 2 ? 'col-span-2 border-t border-text/15 sm:col-span-1 sm:border-l sm:border-t-0' : ''
              }`}
            >
              <span aria-hidden="true" className="text-[12px] font-medium tracking-[0.18em] text-accent-dark">
                {String(i + 1).padStart(2, '0')}
              </span>
              <dt className="sr-only">{label}</dt>
              <dd className="mt-5">
                <CountUp value={value} className="font-serif text-[51px] leading-none text-primary-dark sm:text-[62px] lg:text-[82px] xl:text-[91px]" />
                <span aria-hidden="true" className="mx-auto mt-5 block h-px w-8 bg-accent/60" />
                <span aria-hidden="true" className="mt-4 block text-[11px] font-medium uppercase tracking-[0.18em] text-text-soft sm:text-[12px]">
                  {label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** Small leaf sprig beside the blog heading; inks itself in once (shared .faq-draw styles). */
function BlogSprig({ className = '' }) {
  const [ref, visible] = useInView()
  return (
    <svg
      ref={ref}
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={`faq-draw ${visible ? 'is-visible' : ''} ${className}`}
      aria-hidden="true"
    >
      <path pathLength="1" d="M4 70C30 62 58 48 84 30 96 22 106 14 116 6" />
      <path pathLength="1" d="M40 56c-4-14 2-28 16-36 4 16-2 28-16 36Z" />
      <path pathLength="1" d="M64 42c12-10 28-12 40-6-12 10-28 12-40 6Z" />
      <path pathLength="1" d="M22 64c-8-10-8-22 0-32 8 10 8 22 0 32Z" />
      <path pathLength="1" d="M86 28c2-10 10-18 20-20-2 10-10 18-20 20Z" />
    </svg>
  )
}

function BlogSection() {
  const { data, loading, error, reload } = useApi((signal) => blogsApi.list({ limit: 3 }, { signal }), [])
  const posts = data?.data ?? []
  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-28 lg:py-32" aria-labelledby="blog-title">
      {/* Logo-palette light, masked off the section edges so it continues its neighbours seamlessly */}
      <div
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 15% 25%, rgba(24,121,90,0.15), transparent 40%), radial-gradient(circle at 85% 70%, rgba(221,168,59,0.07), transparent 40%)',
        }}
      />
      <div className="container-x">
        <Reveal variant="group" className="relative max-w-[720px]">
          <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Insights &amp; Wellness</span>
          </p>
          <h2 id="blog-title" className="mt-7 font-serif text-[42px] font-medium leading-[1.06] text-white sm:text-[55px] lg:text-[65px]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Explore Our Latest <em className="font-normal italic text-logo-gold">Insights</em>
              </span>
            </span>
          </h2>
          <p className="r-item mt-6 max-w-[560px] text-[16px] font-light leading-relaxed text-mist md:text-[17px]" style={{ '--d': '280ms' }}>
            Discover expert wellness tips, Ayurvedic knowledge, and practical guidance for a healthier life.
          </p>
          <BlogSprig className="absolute -right-4 top-2 hidden h-16 w-auto text-logo-gold/50 md:block lg:-right-28" />
        </Reveal>

        <div className="mt-14 lg:mt-20">
          {loading ? (
            <HomeBlogEditorialSkeleton />
          ) : error ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : posts.length ? (
            <HomeBlogEditorial posts={posts} />
          ) : (
            <EmptyState title="New articles coming soon" message="Our therapists are preparing fresh wellness tips." />
          )}
        </div>

        <Reveal delay={200} className="mt-14 flex justify-end border-t border-leaf/30 pt-8 lg:mt-16">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-3 rounded-sm text-[14px] font-semibold uppercase tracking-[0.18em] text-mist transition-colors duration-300 hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
          >
            <span className="relative pb-1">
              View All Articles
              <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-[0.4] bg-logo-gold transition-transform duration-500 ease-premium group-hover:origin-left group-hover:scale-x-100" />
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-logo-gold/50 text-logo-gold transition-[background-color,color] duration-500 group-hover:bg-logo-gold group-hover:text-herbal-base">
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  useSEO({
    title: 'Ayurveda & Panchakarma in Abu Dhabi',
    description:
      'Authentic Ayurvedic treatments, Panchakarma and Kerala therapies at Nawa Ayurvedic Medical Centre, Dhabi Tower, Abu Dhabi. Book your consultation today.',
    image: shareImage,
  })

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for everything inside:
  // #08231C canvas, white headings, pale-mint copy, gold accents, leaf-green rules.
  return (
    <div className="theme-logo">
      <Hero />
      <WhoWeAre />
      <ServicesSection />
      <ProgramsSection />
      <WhyChooseUs />
      <AboutSection />
      <FAQSection variant="editorial" />
      <TeamSection />
      <CTASection />
      <BlogSection />
    </div>
  )
}
