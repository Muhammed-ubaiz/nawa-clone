import { Phone } from 'lucide-react'
import { site } from '../../../data/site'
import Button from '../../common/Button'
import CountUp from '../../common/CountUp'
import Reveal from '../../common/Reveal'
import { ChapterEyebrow, ChapterGlow } from './ChapterParts'

/**
 * Impact figures. These are public claims for a medical centre — keep them verified and
 * consistent with the rest of the site before publishing.
 */
const METRICS = [
  { value: '15+', unit: 'Years', label: 'Of clinical excellence' },
  { value: '25,000+', label: 'Holistic treatments delivered' },
  { value: '100%', label: 'Authentic herbal formulations' },
  { value: '98%', label: 'Patient satisfaction rate' },
]

/**
 * About — "Values & Impact", in the logo palette: four counters on a finely grained #08231C
 * banner (2 × 2 on phones and tablets) divided by leaf-green hairlines — white serif figures
 * with a gold unit and a short gold rule, mint labels; then an invitation card (deep-green
 * glass, gold glow, gold-line eyebrow) with the appointment button and the clinic's phone line.
 */
export default function ValuesImpact() {
  return (
    <section className="dark-grain relative isolate overflow-hidden bg-herbal-base py-24 text-white md:py-32 lg:py-40" aria-labelledby="impact-title">
      <ChapterGlow
        spots={[
          { x: '25%', y: '30%', size: '60vw', color: 'rgba(24,121,90,0.18)' },
          { x: '80%', y: '78%', size: '50vw', color: 'rgba(221,168,59,0.08)' },
        ]}
      />
      <div className="container-x">
        <Reveal variant="group" className="max-w-3xl">
          <ChapterEyebrow index="05" className="r-item" style={{ '--d': '0ms' }}>
            Values &amp; Impact
          </ChapterEyebrow>
          <h2 id="impact-title" className="chap-title mt-7 font-serif font-medium !text-white sm:mt-8">
            <span className="text-mask">
              <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                The Measure of Our <em className="font-normal italic text-logo-gold">Care</em>
              </span>
            </span>
          </h2>
        </Reveal>

        <dl className="mt-14 grid grid-cols-2 border-y border-leaf/30 lg:mt-20 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal
              key={m.label}
              delay={i * 140}
              className={`group flex flex-col justify-between px-4 py-10 sm:px-8 sm:py-12 lg:py-16 ${i % 2 === 1 ? 'border-l border-leaf/30' : ''} ${
                i >= 2 ? 'border-t border-leaf/30 lg:border-t-0' : ''
              } ${i === 2 ? 'lg:border-l lg:pl-8' : ''} ${i % 2 === 0 ? 'pl-0 sm:pl-0' : ''}`}
            >
              <dt className="order-3 mt-4 max-w-[180px] text-[10.5px] font-semibold uppercase leading-[1.6] tracking-[0.2em] text-mist sm:text-[11px]">
                {m.label}
              </dt>
              <dd className="order-1 flex items-baseline gap-2">
                <CountUp
                  value={m.value}
                  className="font-serif text-[44px] font-medium leading-none text-white transition-colors duration-500 group-hover:text-logo-gold sm:text-[60px] lg:text-[64px] xl:text-[76px]"
                />
                {m.unit && <span className="font-serif text-[20px] italic text-logo-gold sm:text-[24px]">{m.unit}</span>}
              </dd>
              <span
                aria-hidden="true"
                className="order-2 mt-5 block h-px w-8 bg-logo-gold/70 transition-[width] duration-500 ease-premium group-hover:w-14"
              />
            </Reveal>
          ))}
        </dl>

        {/* Invitation */}
        <Reveal delay={200} className="relative mt-16 overflow-hidden rounded-[24px] border border-leaf/35 bg-gradient-to-br from-[#0e3a2c]/70 via-[#0c2f24]/50 to-herbal-base/40 px-7 py-12 backdrop-blur-sm sm:px-12 lg:mt-24 lg:px-16 lg:py-16">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.14), transparent)' }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(24,121,90,0.22), transparent)' }}
          />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-4 text-[11px] font-semibold uppercase leading-none tracking-[0.25em] text-logo-gold sm:text-[12px]">
                <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                Your next step
              </p>
              <h3 className="mt-5 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[44px] lg:text-[52px]">
                Begin Your Path to <em className="font-normal italic text-logo-gold">Natural Harmony</em>
              </h3>
              <p className="mt-5 text-[15px] font-light leading-[1.8] text-mist sm:text-[16px]">
                Book a consultation and let our practitioners shape a plan around you.
              </p>
            </div>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <Button to="/appointment" variant="brand" className="px-8 py-4 !text-[#08231C]">
                Book an Appointment
              </Button>
              <a
                href={site.phoneHref}
                className="group/phone inline-flex items-center gap-3 rounded-sm text-[13px] font-semibold tracking-[0.04em] text-mist transition-colors duration-300 hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-logo-gold/45 text-logo-gold transition-colors duration-300 group-hover/phone:bg-logo-gold group-hover/phone:text-herbal-base">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                {site.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
