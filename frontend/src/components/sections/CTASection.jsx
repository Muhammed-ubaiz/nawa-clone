import { Phone, Star } from 'lucide-react'
import { images } from '../../data/images'
import { site } from '../../data/site'
import Button from '../common/Button'
import Reveal from '../common/Reveal'

/** Full-bleed image CTA in the logo palette (deep #08231C wash, gold button) with phone and trust rating. */
export default function CTASection({
  title = 'Looking for Natural Healing in Abu Dhabi?',
  text = 'Book your consultation today at a trusted Ayurvedic clinic in Abu Dhabi and begin your journey toward holistic wellness.',
}) {
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8" aria-labelledby="cta-title">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[30px] border border-leaf/30 bg-herbal-base">
        <img src={images.ctaBackground} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-herbal-base/95 via-herbal-base/75 to-herbal-base/30" />
        <div className="container-x relative py-20 md:py-28 lg:py-32">
          <Reveal className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex -space-x-3">
                {[images.client1, images.client2, images.client3].map((src) => (
                  <img key={src} src={src} alt="" loading="lazy" className="h-11 w-11 rounded-full border-2 border-herbal-base object-cover" />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 text-logo-gold" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-[13px] leading-snug text-white/80">Trusted by 1,000+ happy clients &middot; 5-star rated in Abu Dhabi</p>
              </div>
            </div>
            <h2 id="cta-title" className="h-section !text-white lg:!text-[56px]">{title}</h2>
            <p className="mt-6 max-w-xl text-[16px] text-white/80">{text}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button to="/appointment" variant="brand">Book Appointment</Button>
              <Button href={site.phoneHref} variant="light" iconLeft={Phone}>
                {site.phone}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
