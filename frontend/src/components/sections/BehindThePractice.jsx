import { images } from '../../data/images'
import { useReveal } from '../../hooks/useReveal'
import { useScrollDrift } from '../../hooks/useScrollDrift'

const PILLARS = ['Tradition', 'Personalized Care', 'Holistic Wellbeing']

/**
 * About — "Behind the Practice", in the Nawa logo palette (#08231C canvas, leaf #18795A, gold
 * #DDA83B, mist #C2DDD4): a cinematic full-width story panel. One immersive photo (warm oil,
 * an amber dropper, open hands) under a warm herbal tint and layered canvas gradients, with
 * a soft gold glow behind the copy and leaf-green light low on the left; the
 * type set directly into the picture: eyebrow, a large Cormorant title and a short line on
 * the left; a quiet numbered index on the lower right. The top melts out of the About
 * story's green above, and the foot settles back into solid forest green.
 *
 * Phones get their own composition: portrait crop around the hands, a firmer wash, and
 * everything stacked low in the frame. Motion (CSS, see .btp* in index.css): the photo
 * fades in and settles 1.04 → 1, copy rises in sequence, a ±12px drift while scrolling,
 * and a 1.015 hover on desktop. Reduced motion shows everything at rest.
 */
export default function BehindThePractice() {
  const [ref, visible] = useReveal({ threshold: 0.2, rootMargin: '0px 0px -80px 0px' })
  useScrollDrift(ref)

  return (
    <section
      ref={ref}
      className={`btp group relative isolate flex min-h-[650px] overflow-hidden bg-herbal-base text-white md:min-h-[700px] lg:min-h-[760px] ${visible ? 'is-visible' : ''}`}
      aria-labelledby="practice-title"
    >
      {/* Photo */}
      <div aria-hidden="true" className="btp-media absolute inset-0 -z-20">
        <div className="h-full w-full transition-[scale] duration-[1600ms] ease-premium lg:group-hover:scale-[1.015]">
          <img
            src={images.therapy}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover saturate-[0.9] object-[70%_50%] md:object-[62%_50%] lg:object-[58%_45%]"
          />
        </div>
        {/* Warm herbal tint so the photo sits in the logo greens */}
        <div className="absolute inset-0 bg-herbal-base/15 mix-blend-multiply" />
      </div>
      {/* Brand light: gold behind the copy, leaf green low. Painted before the edge fades below,
          which cover it, so the section still starts and ends on solid #08231C (no band). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 20% 50%, rgba(221,168,59,0.10), transparent 40%), radial-gradient(circle at 30% 82%, rgba(24,121,90,0.16), transparent 42%)',
        }}
      />

      {/* Overlays: firm wash on phones; on desktop a left-weighted veil (0.75 → 0.25) so the hands stay
          luminous on the right. Top melts out of the story above; the foot settles into forest green. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-herbal-base/50 md:bg-herbal-base/35 lg:bg-transparent lg:bg-gradient-to-r lg:from-herbal-base/75 lg:via-herbal-base/45 lg:via-45% lg:to-herbal-base/25" />
      {/* Top edge is solid #08231C — the exact colour the About hero ends on, so there is no seam */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-herbal-base via-herbal-base/60 to-transparent md:h-48" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[60%] bg-gradient-to-t from-herbal-base via-herbal-base/75 via-25% to-transparent lg:h-[46%]" />

      <div className="container-x relative flex w-full flex-col justify-end pb-16 pt-40 sm:pb-20 md:pb-24 lg:justify-center lg:py-40">
        <div className="grid gap-y-14 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          {/* Main copy */}
          <div className="lg:col-span-9">
            <p className="btp-item flex items-center gap-4 text-[11px] font-semibold uppercase leading-none tracking-[0.24em] text-logo-gold sm:text-[12px]" style={{ '--i': 0 }}>
              <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
              Behind the Practice
            </p>
            <div className="btp-drift-up">
              <h2 id="practice-title" className="btp-title mt-7 font-serif font-medium !text-white sm:mt-8 lg:mt-10">
                <span className="text-mask">
                  <span className="btp-mask block">
                    <span className="block">The Art of</span>
                    <span className="block lg:whitespace-nowrap">
                      <em className="font-normal italic text-logo-gold">Ayurvedic</em> Healing
                    </span>
                  </span>
                </span>
              </h2>
            </div>
            <p className="btp-item mt-7 max-w-[500px] text-[15px] font-light leading-[1.8] text-mist sm:mt-8 sm:text-[16px] lg:mt-10 lg:text-[17px]" style={{ '--i': 3 }}>
              Rooted in timeless Ayurvedic wisdom, our practice brings together traditional knowledge, personalized care and a
              deeper understanding of wellbeing.
            </p>
          </div>

          {/* Index: plain type, one hairline — no panel */}
          <div className="btp-drift-down lg:col-span-3 lg:pb-3">
            <div className="btp-item max-w-[260px]" style={{ '--i': 5 }}>
              <div className="flex items-end justify-between gap-6 border-b border-logo-gold/35 pb-4">
                <span className="font-serif text-[40px] font-light italic leading-[0.8] text-logo-gold sm:text-[48px]">01</span>
                <span className="text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-logo-gold/85">10+ years of care</span>
              </div>
              <ul className="mt-5 space-y-3 text-[11.5px] font-semibold uppercase leading-none tracking-[0.22em] text-mist sm:text-[12px]">
                {PILLARS.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-logo-gold" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
