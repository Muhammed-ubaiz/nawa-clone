import { heritagePhoto } from '../../../data/images'
import { team } from '../../../data/content'
import { useReveal } from '../../../hooks/useReveal'

const MILESTONES = ['100% Classical Herbal Formulations', 'Handcrafted Decoctions & Oils', 'Master Vaidya Lineage']

/**
 * About — "Our Heritage": in the Nawa logo palette (#08231C canvas, leaf green #18795A, gold
 * #DDA83B, pale mint #C2DDD4). Left: a borderless arch / vault photo (bark, leaf and root),
 * feathered into the canvas on every side (.arch-feather), with a slow hover zoom, captioned below between
 * two hairlines; a soft leaf-green glow sits behind it. Right: gold eyebrow, italic-accented
 * serif headline, the lineage story, a three-item milestone strip with gold dots, and the
 * Vaidya's signature. Phones: arch on top, centred; story below.
 *
 * Entrance (CSS, see .hs* in index.css), when a fifth of the block is in view:
 *   0.00s  arch rises 30px and settles from 1.05 → 1 (1.4s)
 *   0.20s+ eyebrow, title, paragraphs, milestones, signature — 0.2s apart, 1.2–1.4s each.
 * No section-wide glow layer, so it meets its neighbours on pure #08231C. Reduced motion: at rest.
 */
export default function HeritageStory() {
  const signatory = team[0]
  const [ref, visible] = useReveal({ threshold: 0.2, rootMargin: '0px 0px -60px 0px' })
  const step = (i) => ({ '--hs-d': `${200 + i * 200}ms` })

  return (
    <section className="relative isolate overflow-hidden bg-[#08231C] px-6 py-28 text-white lg:px-20 lg:py-36" aria-labelledby="heritage-title">
      <div
        ref={ref}
        className={`hs mx-auto grid w-full max-w-[1320px] items-center gap-y-16 lg:grid-cols-12 lg:gap-x-12 ${visible ? 'is-visible' : ''}`}
      >
        {/* Arch / vault frame */}
        <figure className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          {/* Ambient leaf-green glow behind the arch; closest-side falls to fully transparent at
              its own edge, so it can never be clipped into a visible band at the section edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[42%] -z-10 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(closest-side, rgba(24,121,90,0.15), transparent)' }}
          />
          {/* .hs-arch animates in; the inner .arch-feather mask dissolves the photo into the canvas */}
          <div className="hs-arch group relative mx-auto max-w-md">
            <div className="arch-feather relative aspect-[4/5] overflow-hidden rounded-b-2xl rounded-t-full border-0">
              <img
                src={heritagePhoto.src}
                srcSet={heritagePhoto.srcSet}
                sizes="(min-width: 1024px) 448px, 90vw"
                alt={heritagePhoto.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-[45%_50%] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Warm the edges down into #08231C, and sink the foot into the canvas */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_42%,rgba(8,35,28,0.6)_100%)]" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08231C] via-transparent to-transparent opacity-90" />
            </div>
          </div>
          <figcaption className="hs-item mt-4 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em] text-[#C2DDD4]/70" style={{ '--hs-d': '700ms' }}>
            <span aria-hidden="true" className="h-px w-8 bg-[#18795A]/50" />
            Bark, Leaf &amp; Root
            <span aria-hidden="true" className="h-px w-8 bg-[#18795A]/50" />
          </figcaption>
        </figure>

        {/* Story */}
        <div className="lg:col-span-7 lg:pl-4">
          <p className="hs-item flex items-center gap-4 leading-none" style={step(0)}>
            <span aria-hidden="true" className="h-px w-10 bg-[#DDA83B] sm:w-14" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#DDA83B]">Our Heritage &amp; Origins</span>
          </p>

          <h2 id="heritage-title" className="chap-title hs-item mt-7 font-serif font-medium !text-white sm:mt-8" style={step(1)}>
            <em className="font-normal italic">Generations</em> of <em className="font-normal italic">Ancient Wisdom</em>, Reimagined for Modern Life
          </h2>

          <div className="mt-8 max-w-xl space-y-5 text-[15px] leading-[1.85] text-[#C2DDD4]/80 sm:text-[16px] lg:mt-10">
            <p className="hs-item text-[17px] leading-[1.7] text-[#C2DDD4] sm:text-[18px]" style={step(2)}>
              Ayurveda has been handed down for thousands of years, from one classical vaidya to the next — a complete system
              of medicine that cares for the whole person, not a single symptom.
            </p>
            <p className="hs-item" style={step(3)}>
              Our remedies follow that lineage. Decoctions, herbal preparations and medicated oils are made to time-honoured
              recipes, formulated according to the classical texts and prepared with the patience they ask for.
            </p>
            <p className="hs-item" style={step(4)}>
              At Nawa, that tradition meets thoughtful, modern clinical care in a calm space in Abu Dhabi — so ancient wisdom
              fits naturally into the way you live today.
            </p>
          </div>

          {/* Milestones */}
          <ul className="hs-item mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8 lg:mt-12" style={step(5)}>
            {MILESTONES.map((m) => (
              <li key={m} className="flex items-center gap-3 text-[13px] font-medium leading-snug text-[#C2DDD4]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DDA83B]" />
                {m}
              </li>
            ))}
          </ul>

          {/* Signature */}
          <div className="hs-item mt-10 border-t border-[#18795A]/30 pt-8 lg:mt-12" style={step(6)}>
            <p className="font-serif text-[30px] font-normal italic leading-none text-white sm:text-[34px]">{signatory.name}</p>
            <p className="mt-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.22em] text-[#DDA83B]/80">
              Senior Ayurvedic Vaidya, Nawa Centre
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
