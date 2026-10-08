import { images } from '../data/images'
import { useServices } from '../context/ServicesContext'
import { useSEO } from '../hooks/useSEO'
import ServicesShowcase from '../components/services/ServicesShowcase'
import CoreFocus from '../components/services/CoreFocus'
import Reveal from '../components/common/Reveal'
import ServiceGrid from '../components/services/ServiceGrid'
import FAQSection from '../components/faq/FAQ'

// Service-specific questions for the Services page FAQ.
const SERVICE_FAQS = [
  {
    q: 'How do I know which Ayurvedic treatment or program is right for me?',
    a: 'Every journey begins with a comprehensive consultation and Nadi Pariksha (pulse assessment) by our master Vaidyas to identify your unique Dosha constitution (Prakriti) and current imbalances.',
  },
  {
    q: 'Are the herbal oils and decoctions used in treatments completely natural?',
    a: 'Yes, 100% of our classical oils, herbal churnas, and decoctions are prepared according to traditional Ayurvedic pharmacopoeia standards without synthetic additives.',
  },
  {
    q: 'What should I prepare before arriving for a Panchakarma or therapy session?',
    a: 'We advise wearing comfortable loose clothing and avoiding heavy meals 1.5 to 2 hours prior to your therapy session. Detailed pre-therapy guidelines will be provided by your consulting doctor.',
  },
  {
    q: 'How many sessions are usually recommended for noticeable results?',
    a: 'While single rejuvenation therapies offer immediate relaxation, chronic concerns typically benefit from structured 7, 14, or 21-day cycles for deep cellular restoration.',
  },
]

export default function Services() {
  const { services } = useServices()
  useSEO({
    title: 'Ayurvedic Services',
    description: 'Explore Ayurvedic therapies, body scrubs, facials, hair packs and wellness treatments at Nawa Ayurveda, Abu Dhabi.',
    image: images.ayurvedicTherapies,
  })

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for the whole page:
  // #08231C canvas, white headings, pale-mint copy, gold accents, leaf-green rules.
  return (
    <div className="theme-logo">
      <ServicesShowcase />

      <CoreFocus />

      {/* All services — logo palette: centred gold-line eyebrow, white serif title with a gold
          italic accent, mint lead; logo cards; leaf/gold glows masked off the section edges */}
      <section className="relative isolate overflow-hidden bg-herbal-base py-24 md:py-28 lg:py-32" aria-labelledby="all-services">
        <div
          aria-hidden="true"
          className="edge-fade pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 12%, rgba(24,121,90,0.16), transparent 42%), radial-gradient(circle at 85% 75%, rgba(221,168,59,0.07), transparent 40%), radial-gradient(circle at 12% 70%, rgba(24,121,90,0.12), transparent 40%)',
          }}
        />
        <div className="container-x">
          <Reveal variant="group" className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">What We Offer</span>
              <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
            </p>
            <h2 id="all-services" className="mt-7 font-serif text-[40px] font-medium leading-[1.05] !text-white sm:text-[52px] lg:text-[64px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  Nawa Ayurveda <em className="font-normal italic text-logo-gold">Wellness</em> Therapies
                </span>
              </span>
            </h2>
            <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-mist sm:text-[17px]" style={{ '--d': '280ms' }}>
              Choose a category to see the individual treatments, benefits and what to expect.
            </p>
          </Reveal>
          <ServiceGrid services={services} variant="logo" className="mt-14 lg:mt-20" />
        </div>
      </section>

      {/* Helpful Answers: the Home page's editorial FAQ (numbered list beside the oil-drop
          drawing) with the Services heading and service-specific questions */}
      <FAQSection
        variant="editorial"
        faqs={SERVICE_FAQS}
        heading={{
          eyebrow: 'Helpful Answers for You',
          title: (
            <>
              Frequently Asked Questions About Our <em className="font-normal italic text-logo-gold">Treatments</em> &amp; Care
            </>
          ),
          text: 'What to expect from your first consultation to your final session — if anything is still unclear, our team is always happy to talk it through.',
        }}
      />
    </div>
  )
}
