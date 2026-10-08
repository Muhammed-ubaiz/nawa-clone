import { useState } from 'react'
import { faqs as defaultFaqs } from '../../data/faqs'
import { images } from '../../data/images'
import FAQItem from './FAQItem'
import SectionHeading from '../common/SectionHeading'
import Reveal from '../common/Reveal'
import { useReveal } from '../../hooks/useReveal'
import OilIllustration from './OilIllustration'

/** Thin leaf outline that inks itself in when scrolled into view (see .faq-draw in index.css). */
function LeafLine({ className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <svg
      ref={ref}
      viewBox="0 0 160 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={`faq-draw ${visible ? 'is-visible' : ''} ${className}`}
      aria-hidden="true"
    >
      <path pathLength="1" d="M18 214C34 160 52 108 88 64 108 40 128 22 150 6" />
      <path pathLength="1" d="M88 64C64 52 52 30 54 8c22 10 34 32 34 56Z" />
      <path pathLength="1" d="M66 112c-26-4-44-20-50-44 26 2 44 18 50 44Z" />
      <path pathLength="1" d="M66 112c22-12 46-12 70 0-22 14-46 14-70 0Z" />
      <path pathLength="1" d="M42 168c-22-10-32-30-30-52 20 10 32 30 30 52Z" />
    </svg>
  )
}

/** Home page variant: magazine layout - heading top-left, numbered list left, ink drawing bleeding right. */
function EditorialFAQSection({ faqs, open, setOpen, heading }) {
  return (
    <section className="relative isolate overflow-x-clip bg-background py-20 md:py-28 lg:py-36" aria-labelledby="faq-title">
      <div className="container-x grid gap-y-12 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-20">
        {/* Heading - left, above the list (Home's by default; pages may pass their own) */}
        {heading ? (
          <Reveal variant="group" className="lg:col-span-7 lg:row-start-1">
            <p className="r-item flex items-center gap-4 leading-none" style={{ '--d': '0ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-primary sm:w-14" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{heading.eyebrow}</span>
            </p>
            <h2 id="faq-title" className="mt-7 font-serif text-[38px] font-medium leading-[1.06] text-text sm:text-[50px] lg:text-[58px]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  {heading.title}
                </span>
              </span>
            </h2>
            {heading.text && (
              <p className="r-item mt-6 max-w-xl text-[16px] font-light leading-relaxed text-text-soft sm:text-[17px]" style={{ '--d': '280ms' }}>
                {heading.text}
              </p>
            )}
          </Reveal>
        ) : (
          <Reveal variant="group" className="lg:col-span-7 lg:row-start-1">
            <p className="r-item flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary" style={{ '--d': '0ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-primary/50" />
              Helpful Answers
            </p>
            <h2 id="faq-title" className="mt-7 font-serif text-[48px] leading-[1.02] tracking-[-0.01em] text-text sm:text-[65px] lg:text-[78px] xl:text-[95px] xl:tracking-[-0.01em]">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  Helpful Answers
                  <br />
                  <span className="pl-[0.9em] text-primary sm:pl-[1.6em]">for You</span>
                </span>
              </span>
            </h2>
          </Reveal>
        )}

        {/* Drawing panel: starts beside the heading and bleeds past the right grid edge */}
        <div className="mx-auto w-full max-w-[440px] sm:max-w-[500px] lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:-mr-8 lg:w-auto lg:max-w-none xl:-mr-20">
          <div className="relative lg:sticky lg:top-28">
          <LeafLine className="absolute -left-14 -top-16 z-10 hidden h-44 w-auto text-primary/45 sm:block lg:-left-20 lg:-top-20 lg:h-52" />
          {/* Ink drawing on a quiet paper panel (thin border, no shadow) */}
          <Reveal className="faq-scale group relative overflow-hidden rounded-[18px] border border-border bg-muted/40 px-6 py-10 sm:px-10 sm:py-12">
            <OilIllustration className="transition-transform duration-[1000ms] ease-premium md:group-hover:scale-[1.025]" />
          </Reveal>
          {/* Floating editorial label */}
          <Reveal delay={600} className="absolute left-4 top-4 sm:-left-6 sm:top-8 lg:-left-12 lg:top-[44%]">
            <p className="border border-border bg-background px-5 py-4 text-[11px] font-semibold uppercase leading-[1.7] tracking-[0.2em] text-text">
              Authentic
              <br />
              <span className="text-primary">Ayurveda</span>
            </p>
          </Reveal>
          </div>
        </div>

        {/* Numbered questions */}
        <div className="border-t border-text/10 lg:col-span-7 lg:row-start-2 lg:mt-6">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={150 + i * 100}>
              <FAQItem variant="editorial" index={i} question={f.q} answer={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Two-column FAQ: arch image on the left, single-open accordion on the right.
 * `variant="editorial"` renders the home page design (numbered list beside the oil-drop drawing);
 * `heading` ({ eyebrow, title, text }) swaps in a page's own heading.
 */
export default function FAQSection({ faqs = defaultFaqs, image, className = 'bg-muted', variant, heading }) {
  const [open, setOpen] = useState(0)
  if (variant === 'editorial') return <EditorialFAQSection faqs={faqs} open={open} setOpen={setOpen} heading={heading} />
  const photo = image || images.shirodhara

  return (
    <section className={`section-y ${className}`} aria-labelledby="faq-title">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
          <img src={photo} alt="Shirodhara oil therapy" loading="lazy" className="arch aspect-[4/5] w-full object-cover" />
          <div className="absolute -bottom-6 left-1/2 w-[82%] -translate-x-1/2 rounded-[20px] border border-border bg-background p-5 text-center shadow-[0_20px_40px_-20px_rgba(7,8,7,0.3)]">
            <p className="font-serif text-[24px] leading-tight text-text">Still have questions?</p>
            <a href="tel:+971544981000" className="mt-1 inline-block text-[14px] font-semibold text-primary hover:underline">
              Call +971 54 498 1000
            </a>
          </div>
        </Reveal>
        <div>
          <SectionHeading eyebrow="Helpful Answers for You" title={<span id="faq-title">Frequently Asked Questions</span>} />
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 80}>
                <FAQItem question={f.q} answer={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
