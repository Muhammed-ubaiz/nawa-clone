import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { programs } from '../../../data/programs'
import { programMoods } from '../../../data/images'
import Reveal from '../../common/Reveal'
import { ChapterEyebrow } from './ChapterParts'

// The three programs that tell the Ayurvedic story best on the About page (detox → calm → renewal).
const SHOWCASE = ['panchakarma', 'stress-management', 'rejuvenation']

/**
 * Program card in the logo palette: deep-green glass panel; a moody photograph (warm herbal
 * tint) that fades into the card at its foot and zooms gently on hover; a gold "01 / 7 – 21
 * days" badge; white serif title warming to gold; mint summary; three inclusions with gold
 * dots; and a gold text CTA whose underline draws across on hover. The card lifts and its
 * leaf border warms to gold on hover.
 */
function ProgramCard({ program, index }) {
  const { title, text, duration, inclusions = [], slug } = program
  const image = programMoods[slug] || program.image
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 backdrop-blur-md transition-[translate,border-color,box-shadow] duration-500 ease-premium hover:-translate-y-2 hover:border-logo-gold/50 hover:shadow-[0_30px_70px_-36px_rgba(0,0,0,0.75)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0c2f24]">
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover saturate-[0.85] transition-[scale] duration-[1200ms] ease-premium group-hover:scale-105"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/90 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-5 text-center sm:px-6">
        <span className="self-center rounded-full border border-logo-gold/40 bg-herbal-base/40 px-3 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-logo-gold">
          {String(index + 1).padStart(2, '0')} <span className="text-logo-gold/40">/</span> {duration}
        </span>
        <h3 className="mt-4 font-serif text-[24px] font-medium leading-[1.08] text-white transition-colors duration-300 group-hover:text-logo-gold">{title}</h3>
        <p className="mt-3 text-[14px] leading-[1.7] text-mist">{text}</p>
        {inclusions.length > 0 && (
          <div className="mt-5 w-full border-t border-leaf/35 pt-4 transition-colors duration-500 group-hover:border-logo-gold/40">
            {/* Centred as a block, lines left-aligned inside it, so the gold dots form one clean column */}
            <ul className="mx-auto w-fit space-y-2 text-left">
              {inclusions.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[13px] leading-snug text-mist">
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-logo-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link
          to="/programs"
          className="mt-auto inline-flex items-center gap-2 self-center pt-6 text-[13px] font-semibold tracking-[0.04em] text-mist transition-colors duration-300 group-hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
          aria-label={`Explore the ${title} program`}
        >
          <span className="relative pb-1.5">
            Explore Program
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-logo-gold/35" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-logo-gold transition-transform duration-700 ease-premium group-hover:scale-x-100" />
          </span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

/**
 * About — "Our Programs", in the logo palette: #08231C with leaf-green and gold glows (masked off
 * the edges) and fine grain;
 * compact header (eyebrow, serif title, subtitle) then three program cards in a narrower row — 3 across on desktop,
 * 2 + a centred third on tablets, stacked on phones — and a link to all programs.
 */
export default function ProgramsShowcase() {
  const items = SHOWCASE.map((slug) => programs.find((p) => p.slug === slug)).filter(Boolean)
  return (
    <section className="dark-grain relative isolate overflow-hidden bg-herbal-base py-20 text-white md:py-24 lg:py-28" aria-labelledby="about-programs">
      <span
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 10%, rgba(24,121,90,0.16), transparent 55%), radial-gradient(circle at 88% 78%, rgba(221,168,59,0.07), transparent 40%)',
        }}
      />
      <div className="container-x">
        <Reveal variant="group" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <ChapterEyebrow index="06" className="r-item justify-center" style={{ '--d': '0ms' }}>
            Our Programs
          </ChapterEyebrow>
          <h2 id="about-programs" className="mt-6 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[44px] lg:text-[52px]">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Tailored Programs for <em className="font-normal italic text-logo-gold">Holistic</em> Restoration
              </span>
            </span>
          </h2>
          <p className="r-item mx-auto mt-5 max-w-2xl text-[15px] font-light leading-[1.75] text-mist" style={{ '--d': '280ms' }}>
            Structured, multi-day Ayurvedic programs designed around your goals and guided by our practitioners from start to finish.
          </p>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-[1040px] gap-5 md:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {items.map((p, i) => (
            <Reveal
              key={p.slug}
              delay={i * 140}
              className={i === 2 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-10px)] lg:col-span-1 lg:mx-0 lg:w-auto' : ''}
            >
              <ProgramCard program={p} index={i} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-10 flex justify-center lg:mt-12">
          <Link
            to="/programs"
            className="group inline-flex items-center gap-3 rounded-full border border-logo-gold/50 px-7 py-3.5 text-[13px] font-semibold tracking-[0.04em] text-logo-gold transition-[border-color,background-color,color] duration-500 hover:border-logo-gold hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
          >
            View all programs
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
