import Reveal from '../../common/Reveal'
import { ChapterEyebrow, ChapterGlow } from './ChapterParts'

const STEPS = [
  {
    tag: 'Dosha consultation',
    title: 'Prakriti Analysis',
    text: 'An unhurried consultation to understand your constitution, any current imbalance, your health history and daily routine.',
  },
  {
    tag: 'Your personal plan',
    title: 'Bespoke Therapy Blueprint',
    text: 'Your practitioner designs a plan around you: the therapies, their sequence and duration, and the herbal support you need.',
  },
  {
    tag: 'Classical therapies',
    title: 'Authentic Herbal Treatments',
    text: 'Therapies delivered with pure herbs, oils and botanicals prepared according to classical methods.',
  },
  {
    tag: 'Diet & daily rhythm',
    title: 'Sustained Lifestyle & Pathya',
    text: 'Practical diet and routine guidance that keeps you well between visits, with a plan that adapts as you progress.',
  },
]

/**
 * About — "The Healing Journey": four steps joined by a hairline. Desktop: a horizontal
 * timeline (line + gold nodes above four cards). Tablets: 2 × 2 cards. Phones: a vertical
 * timeline down the left edge. Each card carries a large watermark numeral and glows
 * softly on hover.
 */
export default function HealingJourney() {
  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-24 text-white md:py-32 lg:py-40" aria-labelledby="journey-title">
      <ChapterGlow spots={[{ x: '50%', y: '62%', size: '80vw', color: 'rgba(24,121,90,0.14)' }]} />
      <div className="container-x">
        <Reveal variant="group" className="mx-auto max-w-3xl text-center">
          <ChapterEyebrow index="04" className="r-item justify-center" style={{ '--d': '0ms' }}>
            The Healing Journey
          </ChapterEyebrow>
          <h2 id="journey-title" className="chap-title mt-7 font-serif font-medium !text-white sm:mt-8">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                Four Steps to <em className="font-normal italic text-logo-gold">Lasting</em> Balance
              </span>
            </span>
          </h2>
          <p className="r-item mx-auto mt-7 max-w-xl text-[15px] leading-[1.8] text-mist/65 sm:text-[16px]" style={{ '--d': '280ms' }}>
            From the first conversation to the habits that keep you well, every stage is guided by your practitioner.
          </p>
        </Reveal>

        <div className="relative mt-16 lg:mt-24">
          {/* Connective hairline: vertical on phones, horizontal on desktop, hidden on the tablet 2 × 2 */}
          <span aria-hidden="true" className="absolute bottom-8 left-[5px] top-8 w-px bg-gradient-to-b from-leaf/0 via-leaf/20 to-leaf/0 md:hidden lg:block lg:inset-x-0 lg:bottom-auto lg:top-[5px] lg:h-px lg:w-auto lg:bg-gradient-to-r" />
          <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 150} className="relative pl-8 md:pl-0 lg:pt-12">
              <span aria-hidden="true" className="absolute left-0 top-8 h-[11px] w-[11px] rounded-full border border-logo-gold bg-herbal-base md:hidden lg:left-0 lg:top-0 lg:block">
                <span className="absolute inset-[3px] rounded-full bg-logo-gold" />
              </span>
              <div className="journey-card group relative h-full overflow-hidden rounded-[18px] border border-leaf/30 bg-white/[0.02] px-7 pb-8 pt-10 transition-[border-color,background-color,box-shadow] duration-500 hover:border-leaf/30 hover:bg-white/[0.04] hover:shadow-[0_30px_80px_-40px_rgba(194,221,212,0.35)]">
                <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-6 select-none font-serif text-[140px] font-medium leading-none text-logo-gold/[0.07] transition-colors duration-500 group-hover:text-mist/[0.09]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="journey-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <p className="relative text-[10.5px] font-semibold uppercase leading-none tracking-[0.22em] text-logo-gold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.tag}
                </p>
                <h3 className="relative mt-5 font-serif text-[27px] font-medium leading-[1.12] !text-white lg:text-[28px]">{s.title}</h3>
                <p className="relative mt-4 text-[14.5px] leading-[1.75] text-mist/65">{s.text}</p>
              </div>
            </Reveal>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
