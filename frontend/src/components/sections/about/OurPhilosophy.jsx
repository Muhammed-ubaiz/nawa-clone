import { useEffect, useRef, useState } from 'react'
import { Fingerprint, Flower2, Leaf } from 'lucide-react'
import { meditationPhoto } from '../../../data/images'
import { useReveal } from '../../../hooks/useReveal'

const TENETS = [
  {
    icon: Fingerprint,
    title: 'Prakriti & Uniqueness',
    text: 'Every person is born with a distinct constitution — a unique balance of Vata, Pitta and Kapha.',
    points: ['Care begins with your constitution', 'No two plans are alike'],
  },
  {
    icon: Leaf,
    title: 'Pancha Mahabhuta',
    text: 'Body and nature share the same five elements — space, air, fire, water and earth.',
    points: ['Healing aligned with nature', 'Balance restored element by element'],
  },
  {
    icon: Flower2,
    title: 'Sattva & Inner Calm',
    text: 'The mind is treated alongside the body, cultivating clarity, steadiness and calm.',
    points: ['Mind and body cared for together', 'Therapies that settle the nervous system'],
  },
]

/** Philosophy tenet: glass card, botanical emblem, oversized watermark numeral, two highlights. */
function TenetCard({ tenet, index }) {
  const Icon = tenet.icon
  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-[#18795A]/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-8 backdrop-blur-md transition-all duration-500 ease-premium hover:-translate-y-2 hover:border-[#DDA83B]/60 hover:shadow-[0_30px_70px_-40px_rgba(221,168,59,0.35)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-7 top-6 select-none font-serif text-5xl font-light leading-none text-[#DDA83B]/20 transition-colors duration-300 group-hover:text-[#DDA83B]/40"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[#DDA83B]/45 bg-[#18795A]/15 text-[#DDA83B] transition-[background-color,color,border-color] duration-500 group-hover:border-[#DDA83B] group-hover:bg-[#DDA83B] group-hover:text-[#08231C]">
        <Icon className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
      </span>
      <h3 className="relative mt-8 font-serif text-[28px] font-medium leading-[1.1] text-white transition-colors duration-300 group-hover:text-[#DDA83B] sm:text-[30px]">{tenet.title}</h3>
      <p className="relative mt-4 text-[14.5px] leading-[1.75] text-[#C2DDD4]/85">{tenet.text}</p>
      <ul className="relative mt-6 space-y-2.5 border-t border-[#18795A]/30 pt-5 transition-colors duration-500 group-hover:border-[#DDA83B]/40">
        {tenet.points.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[13px] leading-snug text-[#C2DDD4]">
            <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#DDA83B]" />
            {p}
          </li>
        ))}
      </ul>
    </article>
  )
}

/** Card entrance offset (ms) after the header sequence starts: 1.35s, then 0.2s per card. */
const CARDS_AT = 1350

/**
 * About — "Our Philosophy" (Our Guiding Philosophy). Strictly the Nawa logo palette: #08231C
 * canvas, leaf green #18795A, gold #DDA83B, pale mint #C2DDD4 — with a leaf-green glow at the
 * top-left and a faint gold one at the bottom-right. No borders or vignettes at the edges, so it
 * flows seamlessly out of The Nawa Approach and into Heritage. Desktop: editorial header (eyebrow, italic-accented
 * serif title, a two-line lead) beside an arch-cut meditation photograph that dissolves into
 * the green, with a floating quote over its foot; below, three glass tenet cards
 * (Prakriti, Pancha Mahabhuta, Sattva). Tablet: cards 2 + 1. Phones: header → photo → cards.
 *
 * Entrance — one slow, deliberate sequence (CSS, see .ph* in index.css), triggered when a
 * quarter of the header/photo block is in view:
 *   0.30s  glow surfaces; photo fades in and settles 1.06 → 1 over 1.4s
 *   0.60s  eyebrow glides up        0.85s  title clears from a 4px blur
 *   1.10s  lead fades in            1.60s  quote settles over the photo
 *   1.35s+ cards, 0.2s apart — timed from the header's start, but never before the cards
 *          themselves are on screen (so on phones they still play when you reach them).
 * Reduced motion: everything at rest.
 */
export default function OurPhilosophy() {
  const [topRef, topIn] = useReveal({ threshold: 0.25, rootMargin: '0px' })
  const [cardsRef, cardsIn] = useReveal({ threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
  const startedAt = useRef(0)
  const [cardsBase, setCardsBase] = useState(CARDS_AT)

  useEffect(() => {
    if (topIn && !startedAt.current) startedAt.current = performance.now()
  }, [topIn])

  useEffect(() => {
    if (!cardsIn) return
    const elapsed = startedAt.current ? performance.now() - startedAt.current : 0
    setCardsBase(Math.max(250, CARDS_AT - elapsed))
  }, [cardsIn])

  return (
    <section className="relative isolate overflow-hidden bg-[#08231C] px-6 py-28 text-white lg:px-20 lg:py-36" aria-labelledby="philosophy-title">
      {/* Dual ambient glows, masked out at the top and bottom edges so both joins stay pure #08231C */}
      <div
        aria-hidden="true"
        className={`ph-glow edge-fade pointer-events-none absolute inset-0 -z-10 ${topIn ? 'is-visible' : ''}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(24,121,90,0.18), transparent 50%), radial-gradient(circle at 85% 80%, rgba(221,168,59,0.08), transparent 50%)',
        }}
      />

      <div className="mx-auto w-full max-w-[1320px]">
        <div ref={topRef} className={`ph grid items-center gap-y-16 lg:grid-cols-12 lg:gap-x-8 ${topIn ? 'is-visible' : ''}`}>
          {/* Header */}
          <div className="lg:col-span-7">
            <p className="ph-rise flex items-center gap-4 leading-none" style={{ '--ph-delay': '600ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-[#DDA83B] sm:w-14" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#DDA83B]">Our Guiding Philosophy</span>
            </p>
            <h2 id="philosophy-title" className="chap-title ph-blur mt-7 font-serif font-medium !text-white sm:mt-8" style={{ '--ph-delay': '850ms' }}>
              <em className="font-normal italic text-[#DDA83B]">Harmony</em> in Nature, <em className="font-normal italic text-[#DDA83B]">Balance</em> Within the Soul
            </h2>
            <p className="ph-fade mt-8 max-w-2xl text-[17px] font-light leading-relaxed text-[#C2DDD4] sm:text-[18px] lg:mt-10" style={{ '--ph-delay': '1100ms' }}>
              When Vata, Pitta and Kapha move in balance, body and mind return to their natural rhythm.
              <br className="hidden sm:block" /> Every part of our care begins with restoring that equilibrium.
            </p>
          </div>

          {/* Borderless arch photograph, feathered into the green on every side, with a floating quote */}
          <figure className="relative mx-auto w-full max-w-[440px] lg:col-span-5 lg:max-w-none">
            <div className="arch-feather relative overflow-hidden rounded-b-2xl rounded-t-full border-0">
              <img
                src={meditationPhoto.src}
                srcSet={meditationPhoto.srcSet}
                sizes="(min-width: 1320px) 500px, (min-width: 1024px) 38vw, 440px"
                alt={meditationPhoto.alt}
                loading="lazy"
                decoding="async"
                className="ph-media aspect-[4/5] w-full object-cover object-[50%_35%]"
              />
              {/* Warm the edges down into #08231C, and sink the deck into the canvas */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_45%,rgba(8,35,28,0.55)_100%)]" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08231C] via-transparent to-transparent opacity-90" />
            </div>
            <div className="ph-rise absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8" style={{ '--ph-delay': '1600ms' }}>
              <blockquote className="rounded-[20px] bg-[#08231C]/55 px-6 py-5 text-center font-serif text-[18px] italic leading-[1.4] text-white/90 shadow-[0_24px_60px_-12px_rgba(8,35,28,0.9)] backdrop-blur-xl sm:text-[20px]">
                <span className="text-[#DDA83B]">&ldquo;</span>Health is not merely the absence of disease, but dynamic harmony.
                <span className="text-[#DDA83B]">&rdquo;</span>
                <span className="mt-3 flex items-center justify-center gap-3 font-sans text-[10.5px] font-semibold not-italic uppercase tracking-[0.22em] text-[#DDA83B]/85">
                  <span aria-hidden="true" className="h-px w-6 bg-[#DDA83B]/60" />
                  Ayurvedic wisdom
                  <span aria-hidden="true" className="h-px w-6 bg-[#DDA83B]/60" />
                </span>
              </blockquote>
            </div>
          </figure>
        </div>

        {/* Tenets */}
        <div
          ref={cardsRef}
          className={`ph mt-20 grid gap-6 md:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-8 ${cardsIn && topIn ? 'is-visible' : ''}`}
          style={{ '--ph-cards': `${Math.round(cardsBase)}ms` }}
        >
          {TENETS.map((t, i) => (
            <div
              key={t.title}
              className={`ph-card ${i === 2 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-12px)] lg:col-span-1 lg:mx-0 lg:w-auto' : ''}`}
              style={{ '--ph-i': i }}
            >
              <TenetCard tenet={t} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
