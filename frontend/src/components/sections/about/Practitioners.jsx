import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { team } from '../../../data/content'
import Reveal from '../../common/Reveal'
import { ChapterEyebrow, ChapterGlow } from './ChapterParts'

const initials = (name) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

/**
 * Placeholder shown until a real portrait is added to the team data (`image: null`): gold
 * monogram in a fine gold ring over a deep logo-green gradient with a soft gold glow.
 */
function PortraitPlaceholder({ name }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-[#0e3a2c] to-herbal-base">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 42%, rgba(221,168,59,0.12), transparent 55%)' }}
      />
      <span
        aria-hidden="true"
        className="relative grid h-28 w-28 place-items-center rounded-full border border-logo-gold/35 font-serif text-[44px] font-normal italic leading-none text-logo-gold/70 transition-[color,border-color] duration-700 group-hover:border-logo-gold/70 group-hover:text-logo-gold"
      >
        {initials(name)}
      </span>
      <span className="absolute bottom-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-mist/50">Portrait coming soon</span>
    </div>
  )
}

/**
 * Practitioner card in the logo palette: deep-green glass panel with a leaf frame that warms
 * to gold, desaturated warm portrait that regains its colour on hover, gold number, white serif
 * name warming to gold, gold role, and — only when present in the team data — credentials and
 * years of experience. A gold booking link closes the card.
 */
function PractitionerCard({ member, index }) {
  const { name, role, image, credentials, experience } = member
  return (
    <article className="group flex h-full flex-col rounded-[20px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-3 backdrop-blur-sm transition-[border-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-1.5 hover:border-logo-gold/50 hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.75)]">
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#0c2f24]">
        {image ? (
          <img
            src={image}
            alt={`Portrait of ${name}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover grayscale-[85%] sepia-[15%] transition-[filter,scale] duration-700 ease-premium group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:sepia-0"
          />
        ) : (
          <PortraitPlaceholder name={name} />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-herbal-base/70 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-5 sm:px-4">
        <span className="font-serif text-[18px] italic leading-none text-logo-gold">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mt-2.5 font-serif text-[24px] font-medium leading-[1.1] text-white transition-colors duration-300 group-hover:text-logo-gold">{name}</h3>
        <p className="mt-2 text-[10.5px] font-semibold uppercase leading-snug tracking-[0.2em] text-logo-gold/80">{role}</p>
        {(credentials || experience) && (
          <dl className="mt-4 space-y-1.5 border-t border-leaf/30 pt-4 text-[13px] leading-snug text-mist">
            {credentials && (
              <div>
                <dt className="sr-only">Qualifications</dt>
                <dd>{credentials}</dd>
              </div>
            )}
            {experience && (
              <div>
                <dt className="sr-only">Experience</dt>
                <dd>{experience}</dd>
              </div>
            )}
          </dl>
        )}
        <Link
          to="/appointment"
          className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-[13px] font-semibold tracking-[0.02em] text-mist transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
          aria-label={`Book a consultation with ${name}`}
        >
          <span className="border-b border-logo-gold/40 pb-1 transition-colors duration-300 group-hover:border-logo-gold">Book a consultation</span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

/** About — "Our Practitioners": compact header + three glass cards in a narrower row (2 on tablets, 1 on phones). */
export default function Practitioners() {
  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-20 text-white md:py-24 lg:py-28" aria-labelledby="practitioners-title">
      <ChapterGlow
        spots={[
          { x: '80%', y: '18%', size: '55vw', color: 'rgba(24,121,90,0.18)' },
          { x: '10%', y: '85%', size: '45vw', color: 'rgba(221,168,59,0.07)' },
        ]}
      />
      <div className="container-x">
        <Reveal variant="group" className="grid gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <div className="lg:col-span-7">
            <ChapterEyebrow index="03" className="r-item" style={{ '--d': '0ms' }}>
              Our Practitioners
            </ChapterEyebrow>
            <h2 id="practitioners-title" className="mt-6 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[44px] lg:text-[52px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  Guided by Master <em className="font-normal italic text-logo-gold">Vaidyas</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="r-item max-w-md text-[15px] font-light leading-[1.75] text-mist lg:col-span-4 lg:col-start-9 lg:pb-2" style={{ '--d': '280ms' }}>
            Every therapist is carefully vetted and background-checked to ensure your safety, comfort, and expert care.
          </p>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-[1040px] gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {team.map((member, i) => (
            <Reveal key={member.name} delay={i * 140} className={i === 2 ? 'sm:col-span-2 sm:mx-auto sm:w-[calc(50%-10px)] lg:col-span-1 lg:mx-0 lg:w-auto' : ''}>
              <PractitionerCard member={member} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
