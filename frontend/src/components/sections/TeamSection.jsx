import { UserRound } from 'lucide-react'
import { team } from '../../data/content'
import Button from '../common/Button'
import Reveal from '../common/Reveal'
import { useReveal } from '../../hooks/useReveal'
import { INK, Leaf, OLIVE } from './AyurvedaIllustration'

/**
 * Botanical "Therapist Profile" placeholder shown until a real portrait is added (`image: null`).
 * Its line art inks itself in on scroll (shared .ayu-art draw system in index.css).
 */
function ProfilePlaceholder({ name }) {
  const [ref, drawn] = useReveal()
  return (
    <div ref={ref} className={`ayu-art ${drawn ? 'is-drawn' : ''} relative h-full w-full bg-muted/50`} role="img" aria-label={`${name} — portrait coming soon`}>
      <svg viewBox="0 0 400 500" fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="200" cy="230" r="150" pathLength="1" className="ayu-line" style={{ '--i': 0 }} stroke="#000" strokeOpacity="0.06" strokeWidth="1" />
        {/* Sprig rising from the lower left, crossing the circle */}
        <path d="M44 500 C 56 440 44 380 70 320 S 104 230 96 166" pathLength="1" className="ayu-line" style={{ '--i': 1 }} stroke={OLIVE} strokeOpacity="0.7" strokeWidth="1" />
        <Leaf x={50} y={446} rot={-48} l={46} w={15} i={1.6} color={OLIVE} tint />
        <Leaf x={52} y={388} rot={42} l={42} w={14} i={2.2} color={OLIVE} />
        <Leaf x={70} y={320} rot={-44} l={38} w={13} i={2.8} color={OLIVE} />
        <Leaf x={90} y={252} rot={34} l={32} w={11} i={3.4} color={OLIVE} tint />
        <Leaf x={97} y={190} rot={-28} l={26} w={9} i={4} color={OLIVE} />
        {/* Small leaves at the lower right */}
        <Leaf x={340} y={500} rot={-24} l={56} w={18} i={4.4} color={INK} />
        <Leaf x={358} y={500} rot={26} l={40} w={13} i={4.8} color={INK} tint />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-primary/25 bg-background/80 text-primary">
          <UserRound className="h-7 w-7" strokeWidth={1.25} aria-hidden="true" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Therapist Profile</span>
      </div>
    </div>
  )
}

/** Editorial profile: portrait (or placeholder), number, serif name, role over a hairline. */
function TherapistCard({ member, index, featured = false }) {
  const { name, role, image } = member
  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-text/10 transition-[border-color,transform] duration-500 ease-premium md:group-hover:-translate-y-1.5 md:group-hover:border-primary/30">
        {image ? (
          <img
            src={image}
            alt={`${name}, ${role}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-[900ms] ease-premium md:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full transition-transform duration-[900ms] ease-premium md:group-hover:scale-[1.03]">
            <ProfilePlaceholder name={name} />
          </div>
        )}
      </div>
      <div className="pt-7 text-center">
        <p aria-hidden="true" className="text-[12px] font-medium tracking-[0.18em] text-primary/50">
          {String(index + 1).padStart(2, '0')}
        </p>
        <h3
          className={`mt-3 font-serif leading-tight text-text transition-colors duration-500 group-hover:text-primary-dark ${
            featured ? 'text-[33px] lg:text-[40px]' : 'text-[29px] lg:text-[31px]'
          }`}
        >
          {name}
        </h3>
        <span aria-hidden="true" className="mx-auto mt-5 block h-px w-10 bg-accent/60 transition-[width] duration-500 ease-premium group-hover:w-16" />
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">{role}</p>
      </div>
    </article>
  )
}

/**
 * "Meet Our Therapists" — editorial, asymmetric profiles. The first member (Chief Ayurvedic
 * Physician) is featured; the others sit lower and staggered. Portraits fall back to a placeholder.
 */
export default function TeamSection({ className = '' }) {
  const [lead, ...others] = team
  return (
    <section className={`relative overflow-hidden bg-background py-20 md:py-28 lg:py-36 ${className}`} aria-labelledby="team-title">
      {/* Barely-there curves and a small ring behind the profiles */}
      <svg aria-hidden="true" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[50%] hidden h-[50%] w-full text-primary/[0.045] md:block">
        <path d="M-20 420 C 300 260 520 520 820 360 S 1260 180 1460 300" stroke="currentColor" strokeWidth="1.2" />
        <path d="M-20 460 C 320 300 540 560 840 400 S 1270 220 1460 340" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-28 hidden h-24 w-24 rounded-full border border-accent/25 lg:block" />

      <div className="container-x relative">
        <Reveal variant="group" className="mx-auto max-w-[680px] text-center">
          <p className="r-item inline-flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-px w-8 bg-primary/50" />
            Our Therapists
            <span aria-hidden="true" className="h-px w-8 bg-primary/50" />
          </p>
          <h2 id="team-title" className="mt-7 font-serif text-[46px] leading-[1.05] tracking-[-0.01em] text-text sm:text-[59px] lg:text-[73px] lg:tracking-[-0.01em]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Meet Our <span className="text-primary">Therapists</span>
              </span>
            </span>
          </h2>
          <p className="r-item mx-auto mt-7 max-w-[520px] text-[16px] leading-[1.8] text-text-soft md:text-[17px]" style={{ '--d': '300ms' }}>
            Every therapist is carefully vetted and background-checked to ensure your safety, comfort, and expert care.
          </p>
        </Reveal>

        {/* Featured lead on the left; the others step down to the right */}
        <div className="mx-auto mt-16 grid max-w-[340px] gap-y-16 md:max-w-none md:grid-cols-2 md:gap-x-10 lg:mt-24 lg:grid-cols-12 lg:gap-x-8">
          {lead && (
            <Reveal className="md:col-span-2 md:mx-auto md:w-full md:max-w-[440px] lg:col-span-5 lg:max-w-none">
              <TherapistCard member={lead} index={0} featured />
            </Reveal>
          )}
          {others.map((m, i) => (
            <Reveal
              key={m.name}
              delay={(i + 1) * 110}
              className={`lg:col-span-3 ${i === 0 ? 'lg:col-start-7 lg:mt-32' : 'lg:mt-14'}`}
            >
              <TherapistCard member={m} index={i + 1} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={300} className="mt-16 flex justify-center lg:mt-20">
          <Button to="/about" variant="brand">
            Meet the Team
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
