import { Link } from 'react-router-dom'
import { Clock, Leaf } from 'lucide-react'
import { images, servicesShowcasePhotos, spacePhotos } from '../data/images'
import { programs } from '../data/programs'
import { useSEO } from '../hooks/useSEO'
import StoryHero from '../components/sections/StoryHero'
import ProgramCard from '../components/programs/ProgramCard'
import Button from '../components/common/Button'
import CTASection from '../components/sections/CTASection'
import Reveal from '../components/common/Reveal'

// Hero chapters, from the page's own copy.
const CHAPTERS = [
  {
    eyebrow: 'Our Programs',
    title: 'Ayurvedic Care Programs',
    text: 'Structured, multi-day Ayurvedic programs designed around your goals and guided by our practitioners from start to finish.',
  },
  {
    eyebrow: 'Why a Program?',
    title: 'Programs Bring Lasting Change',
    text: 'Single sessions bring relief; programs bring change — therapies over consecutive days give the body time to cleanse, rebuild and settle.',
  },
  {
    eyebrow: 'Your Wellness Journey',
    title: 'Begin Your Program',
    text: 'Book a consultation and our practitioners will tailor a program to your constitution and goals.',
    actions: [{ to: '/appointment', label: 'Book a Consultation' }],
  },
]

const STEPS = ['Consultation and constitution assessment', 'Daily therapies in a private room', 'Herbal support and diet plan', 'Follow-up review and aftercare']

/** Logo-palette eyebrow: thin gold line + tracked gold label (`center` adds a trailing line). */
function Eyebrow({ children, center = false, className = '' }) {
  return (
    <p className={`flex items-center gap-4 leading-none ${center ? 'justify-center' : ''} ${className}`}>
      <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">{children}</span>
      {center && <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />}
    </p>
  )
}

/** Soft leaf/gold section light, masked off the section edges (.edge-fade) so sections join seamlessly. */
function Glow({ spots }) {
  return <div aria-hidden="true" className="edge-fade pointer-events-none absolute inset-0 -z-10" style={{ background: spots.join(', ') }} />
}

/**
 * Programs page, in the Nawa logo palette (#08231C canvas, leaf #18795A, gold #DDA83B, mint
 * #C2DDD4) — one continuous canvas with no seams:
 *   1. the About page's split story hero (photo dissolving in from the right, three chapters);
 *   2. the programs: gold-line header, a featured program in a deep-green glass panel, then the
 *      remaining programs as logo cards;
 *   3. "Why a Program?": a round herbs photo inside two thin gold rings (the outer one slowly
 *      turning) with three floating glass badges, beside a gold step timeline;
 *   4. the logo-green call-to-action banner.
 */
export default function Programs() {
  useSEO({
    title: 'Ayurvedic Care Programs',
    description: 'Weight loss, skin, eye and hair care therapies plus Panchakarma, stress management and rejuvenation programs in Abu Dhabi.',
    image: images.weightLoss,
  })

  const [first, ...rest] = programs
  const heroPhoto = servicesShowcasePhotos.rejuvenation

  return (
    <div className="theme-logo">
      <StoryHero
        label="Ayurvedic Care Programs"
        layout="split"
        theme="logo"
        chapters={CHAPTERS}
        media={
          <img
            src={heroPhoto.src}
            srcSet={heroPhoto.srcSet}
            sizes="(min-width: 1280px) 64vw, (min-width: 1024px) 70vw, 100vw"
            alt={heroPhoto.alt}
            fetchPriority="high"
            decoding="async"
            className="about-hero-media h-full w-full object-cover object-[55%_50%]"
          />
        }
        footer={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/55 sm:text-[11.5px]">
              <li>
                <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-logo-gold">/</li>
              <li aria-current="page" className="text-mist/90">Programs</li>
            </ol>
          </nav>
        }
      />

      {/* Programs */}
      <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-24 lg:py-28" aria-labelledby="programs-title">
        <Glow spots={['radial-gradient(circle at 12% 18%, rgba(24,121,90,0.15), transparent 40%)', 'radial-gradient(circle at 88% 55%, rgba(221,168,59,0.07), transparent 40%)', 'radial-gradient(circle at 20% 85%, rgba(24,121,90,0.12), transparent 40%)']} />
        <div className="container-x">
          <Reveal variant="group" className="max-w-3xl">
            <div className="r-item" style={{ '--d': '0ms' }}>
              <Eyebrow>Our Programs</Eyebrow>
            </div>
            <h2 id="programs-title" className="mt-7 font-serif text-[40px] font-medium leading-[1.05] !text-white sm:text-[52px] lg:text-[62px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  Our Specialized <em className="font-normal italic text-logo-gold">Ayurvedic</em> Care Programs
                </span>
              </span>
            </h2>
            <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '280ms' }}>
              Explore each program below, then book a consultation to tailor it to you.
            </p>
          </Reveal>

          {/* Featured program */}
          <Reveal className="group relative mt-14 grid overflow-hidden rounded-[30px] border border-leaf/35 bg-gradient-to-br from-[#0e3a2c]/70 via-[#0c2f24]/50 to-herbal-base/40 shadow-[0_40px_80px_-44px_rgba(0,0,0,0.75)] transition-[border-color] duration-500 hover:border-logo-gold/50 lg:mt-16 lg:grid-cols-2">
            <div className="relative overflow-hidden">
              <img
                src={first.image}
                alt={first.title}
                loading="lazy"
                className="aspect-[4/3] h-full w-full object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.04] lg:aspect-auto"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-herbal-base/80 to-transparent lg:bg-gradient-to-l lg:from-herbal-base/70 lg:via-transparent" />
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/75 px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-logo-gold backdrop-blur-sm">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-gold" />
                Featured
              </span>
            </div>
            <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-16">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
                style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.12), transparent)' }}
              />
              <p className="relative inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-logo-gold">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {first.duration}
              </p>
              <h3 className="relative mt-5 font-serif text-[36px] font-medium leading-[1.05] text-white transition-colors duration-300 group-hover:text-logo-gold sm:text-[44px] lg:text-[52px]">
                {first.title}
              </h3>
              <span aria-hidden="true" className="relative mt-6 block h-px w-12 bg-logo-gold/70" />
              <p className="relative mt-6 max-w-lg text-[16px] leading-[1.8] text-mist md:text-[17px]">{first.text}</p>
              <div className="relative mt-9">
                <Button to="/appointment" state={{ service: first.title }} variant="brand">
                  Book This Program
                </Button>
              </div>
            </div>
          </Reveal>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 100}>
                <ProgramCard program={p} index={i + 1} variant="editorial" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why a program? — layered photo composition beside a gold step timeline */}
      <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-28 lg:py-32" aria-labelledby="restore-title">
        <Glow spots={['radial-gradient(circle at 25% 45%, rgba(24,121,90,0.18), transparent 40%)', 'radial-gradient(circle at 85% 75%, rgba(221,168,59,0.07), transparent 40%)']} />
        <div className="container-x grid items-center gap-16 lg:grid-cols-12 lg:gap-x-16">
          {/* Circle composition: round herbs photo inside two thin gold rings (the dashed outer ring
              turns very slowly, carrying a small gold dot), with three floating glass badges. */}
          <Reveal className="relative mx-auto w-full max-w-[460px] lg:col-span-5 lg:max-w-none">
            <div className="relative mx-auto aspect-square w-[88%] sm:w-full">
              {/* Outer ring: dashed, slowly rotating, with a travelling gold dot */}
              <div aria-hidden="true" className="ring-spin absolute -inset-[7%] rounded-full border border-dashed border-logo-gold/35">
                <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-logo-gold shadow-[0_0_14px_rgba(221,168,59,0.8)]" />
              </div>
              {/* Inner ring */}
              <div aria-hidden="true" className="absolute -inset-[3%] rounded-full border border-logo-gold/45" />
              {/* Photo */}
              <div className="group relative h-full w-full overflow-hidden rounded-full border border-leaf/40 bg-[#0c2f24] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)]">
                <img
                  src={spacePhotos.herbs.src}
                  srcSet={spacePhotos.herbs.srcSet}
                  sizes="(min-width: 1024px) 36vw, 420px"
                  alt={spacePhotos.herbs.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover saturate-[0.85] transition-transform duration-[1400ms] ease-premium group-hover:scale-[1.05]"
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_50%,rgba(8,35,28,0.6)_100%)]" />
              </div>

              {/* Floating glass badges */}
              <p className="animate-float absolute -left-[4%] top-[12%] flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/85 px-4 py-2 text-xs font-medium text-logo-gold shadow-[0_14px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-gold" />
                5 – 28 day programs
              </p>
              <p className="animate-float absolute -right-[6%] top-[46%] flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/85 px-4 py-2 text-xs font-medium text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md [animation-delay:1.5s]">
                <Leaf className="h-3.5 w-3.5 fill-current text-logo-gold" strokeWidth={1.25} aria-hidden="true" />
                Daily therapies
              </p>
              <p className="animate-float absolute -bottom-[2%] left-[10%] flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/85 px-4 py-2 text-xs font-medium text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md [animation-delay:3s]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-gold" />
                Herbal support &amp; diet plan
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal variant="group">
              <div className="r-item" style={{ '--d': '0ms' }}>
                <Eyebrow>Why a Program?</Eyebrow>
              </div>
              <h2 id="restore-title" className="mt-7 font-serif text-[38px] font-medium leading-[1.05] !text-white sm:text-[48px] lg:text-[58px]">
                <span className="text-mask">
                  <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                    Restore Balance. <em className="font-normal italic text-logo-gold">Rejuvenate</em> Naturally.
                  </span>
                </span>
              </h2>
              <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '280ms' }}>
                Single sessions bring relief; programs bring change. By combining therapies over consecutive days with diet and routine
                guidance, the body has time to cleanse, rebuild and settle into a healthier rhythm.
              </p>
            </Reveal>

            {/* Step timeline: gold numbered nodes on a leaf-green line */}
            <ol className="relative mt-10 lg:mt-12">
              <span aria-hidden="true" className="absolute bottom-6 left-[22px] top-6 w-px bg-gradient-to-b from-logo-gold/60 via-leaf/50 to-leaf/0" />
              {STEPS.map((t, i) => (
                <Reveal as="li" key={t} delay={150 + i * 110} className="group relative flex items-center gap-6 py-3.5">
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-logo-gold/50 bg-herbal-base font-serif text-[18px] italic text-logo-gold transition-colors duration-300 group-hover:bg-logo-gold group-hover:text-herbal-base">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 border-b border-leaf/25 pb-3.5 pt-3.5 text-[17px] font-medium text-white transition-colors duration-300 group-hover:text-logo-gold sm:text-[18px]">
                    {t}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="bg-herbal-base pt-6">
        <CTASection />
      </div>
    </div>
  )
}
