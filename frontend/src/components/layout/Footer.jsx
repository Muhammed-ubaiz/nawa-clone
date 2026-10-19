import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Clock, Mail, MapPin, PhoneCall } from 'lucide-react'
import { site } from '../../data/site'
import { contactsApi } from '../../services/api'
import { isEmail } from '../../utils/format'
import { notifyDataChanged } from '../../utils/liveSync'
import Logo from '../common/Logo'
import BrandLinks from '../common/BrandLinks'
import Reveal from '../common/Reveal'

// SweetAlert2 is loaded on demand so public pages stay light.
const loadAlerts = () => import('../../utils/alerts')

const NAVIGATION = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Our Philosophy', to: '/about#philosophy-title' },
  { label: 'Doctors', to: '/about#practitioners-title' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

// Real programs from data/programs.js (there are no per-program pages, so they open /programs).
const CARE = [
  { label: 'Panchakarma Detox', to: '/programs' },
  { label: 'Rasayana Rejuvenation', to: '/programs' },
  { label: 'Stress Management', to: '/programs' },
  { label: 'All Treatments', to: '/services' },
  { label: 'Ayurvedic Consultation', to: '/appointment' },
]

// Instagram / LinkedIn / Facebook URLs in data/site.js are still placeholders — replace with the clinic's profiles.
const SOCIAL = [
  { name: 'Instagram', href: site.social.find((s) => s.name === 'Instagram')?.href },
  { name: 'WhatsApp', href: site.whatsappHref },
  { name: 'LinkedIn', href: site.linkedinHref },
  { name: 'Facebook', href: site.social.find((s) => s.name === 'Facebook')?.href },
].filter((s) => s.href)

const linkClass =
  'rounded-sm text-[14.5px] text-[#C2DDD4]/75 transition-colors duration-200 hover:text-[#DDA83B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B]'

/** Small tracked column header. */
function ColumnTitle({ children, id }) {
  return (
    <h3 id={id} className="font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.24em] !text-[#DDA83B]">
      {children}
    </h3>
  )
}

/**
 * Wellness-updates signup. There is no dedicated newsletter endpoint, so the request goes
 * through the existing contact API and appears in the admin's Contacts inbox.
 */
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    const alerts = await loadAlerts()
    if (!isEmail(email)) {
      alerts.showWarning('Please check your email', 'Enter a valid email address to receive our wellness news.')
      return
    }
    setSending(true)
    try {
      await alerts.withLoading(
        () =>
          contactsApi.create({
            name: 'Newsletter subscriber',
            email: email.trim(),
            message: 'Newsletter signup: please add this email to the Nawa Ayurveda wellness news and special offers list.',
          }),
        { title: 'Subscribing…' },
      )
      notifyDataChanged('contacts')
      setEmail('')
      alerts.showSuccess('You are subscribed', 'Thank you! Our wellness news and special offers will reach your inbox.', { timer: 5000 })
    } catch (err) {
      alerts.showApiError(err, { title: 'Subscription failed' })
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-center border-b border-[#18795A]/50 transition-colors duration-300 focus-within:border-[#DDA83B]">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email for wellness updates"
        disabled={sending}
        className="h-12 min-w-0 flex-1 bg-transparent text-[14.5px] text-white placeholder:text-[#C2DDD4]/45 focus:outline-none"
      />
      <button
        type="submit"
        disabled={sending}
        aria-label={sending ? 'Subscribing' : 'Subscribe'}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#DDA83B] transition-colors duration-200 hover:bg-[#DDA83B] hover:text-[#08231C] focus-visible:outline-2 focus-visible:outline-[#DDA83B] disabled:opacity-50"
      >
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  )
}

/**
 * Site footer — in the Nawa logo palette: #08231C canvas (the same as the About chapters, so
 * it continues them without a seam), leaf-green #18795A rules, gold #DDA83B accents and pale
 * mint #C2DDD4 text; the full-colour logo leads the brand column. Invitation strip
 * (gold eyebrow, serif heading, gold pill CTA), then four columns: brand + contact, navigation,
 * programs & care, visiting hours + wellness-updates signup + WhatsApp booking. Sub-footer:
 * copyright, privacy, insurance note, social icons and a back-to-top control.
 * Phones stack everything with comfortable tap targets.
 */
export default function Footer() {
  const year = new Date().getFullYear()
  // The booking page is itself the invitation, so the footer's "Book Consultation" strip is skipped there.
  const onBooking = useLocation().pathname === '/appointment'
  const toTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <footer className="relative isolate overflow-hidden bg-[#08231C] text-white" style={{ '--dur-reveal': '700ms' }}>
      {/* Leaf-green and gold glows; .edge-fade keeps the top edge pure #08231C */}
      <span
        aria-hidden="true"
        className="edge-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 15% 85%, rgba(24,121,90,0.16), transparent 55%), radial-gradient(circle at 88% 30%, rgba(221,168,59,0.06), transparent 50%)',
        }}
      />

      <div className={`container-x pb-10 ${onBooking ? 'pt-6 lg:pt-8' : 'pt-20 lg:pt-24'}`}>
        {/* Invitation strip */}
        {!onBooking && (
        <Reveal className="flex flex-col gap-8 border-b border-[#18795A]/30 pb-14 lg:flex-row lg:items-end lg:justify-between lg:pb-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-4 text-[11px] font-semibold uppercase leading-none tracking-[0.25em] text-[#DDA83B] sm:text-[12px]">
              <span aria-hidden="true" className="h-px w-10 bg-[#DDA83B] sm:w-14" />
              Begin Your Journey
            </p>
            <h2 className="mt-6 font-serif text-[40px] font-medium leading-[1.04] !text-white sm:text-[52px] lg:text-[60px]">
              Embrace Lasting Balance <em className="font-normal italic text-[#DDA83B]">and Vitality</em>
            </h2>
          </div>
          <Link
            to="/appointment"
            className="group inline-flex shrink-0 items-center gap-2.5 self-start rounded-full bg-[#DDA83B] px-7 py-4 text-[14px] font-semibold tracking-[0.02em] text-[#08231C] shadow-md transition-[background-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-0.5 hover:bg-[#e5b34a] hover:shadow-[0_18px_40px_-18px_rgba(221,168,59,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B] lg:self-end"
          >
            Book Consultation
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </Reveal>
        )}

        {/* Main grid */}
        <div className="grid gap-12 pt-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:pt-16">
          {/* Brand & contact */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo imgClassName="h-auto w-[170px] sm:w-[190px]" />
            <p className="mt-6 max-w-sm text-[14.5px] leading-[1.8] text-[#C2DDD4]/75">
              Authentic Ayurvedic care in the heart of Abu Dhabi — classical treatments, personalised plans and a calm place to heal.
            </p>
            <ul className="mt-8 space-y-4 text-[14.5px]">
              <li>
                <a
                  href={site.phoneHref}
                  className="inline-flex items-center gap-3 rounded-sm text-[14.5px] font-semibold text-white transition-colors duration-200 hover:text-[#DDA83B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B]"
                >
                  <PhoneCall className="h-4 w-4 shrink-0 text-[#DDA83B]" strokeWidth={1.5} aria-hidden="true" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={site.receptionHref} className={`inline-flex items-center gap-3 ${linkClass}`}>
                  <PhoneCall className="h-4 w-4 shrink-0 text-[#18795A]" strokeWidth={1.5} aria-hidden="true" />
                  Reception {site.reception}
                </a>
              </li>
              <li>
                <a href={site.mapLink} target="_blank" rel="noopener noreferrer" className={`inline-flex gap-3 ${linkClass}`}>
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#18795A]" strokeWidth={1.5} aria-hidden="true" />
                  <span className="leading-[1.7]">
                    {site.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className={`inline-flex items-center gap-3 ${linkClass}`}>
                  <Mail className="h-4 w-4 shrink-0 text-[#18795A]" strokeWidth={1.5} aria-hidden="true" />
                  {site.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <nav aria-labelledby="footer-nav" className="lg:col-span-2 lg:col-start-6">
            <ColumnTitle id="footer-nav">Navigation</ColumnTitle>
            <ul className="mt-7 space-y-1">
              {NAVIGATION.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={`inline-block py-1.5 ${linkClass}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Programs & care */}
          <nav aria-labelledby="footer-care" className="lg:col-span-2">
            <ColumnTitle id="footer-care">Programs &amp; Care</ColumnTitle>
            <ul className="mt-7 space-y-1">
              {CARE.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={`inline-block py-1.5 ${linkClass}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Visit + updates */}
          <div className="sm:col-span-2 lg:col-span-3 lg:col-start-10">
            <ColumnTitle>Visit Our Sanctuary</ColumnTitle>
            <p className="mt-7 flex items-start gap-3 text-[14.5px] leading-[1.7] text-white/90">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-[#DDA83B]" strokeWidth={1.5} aria-hidden="true" />
              <span>
                {site.hours}
                <span className="block text-[#C2DDD4]/60">Abu Dhabi, UAE</span>
              </span>
            </p>
            <p className="mt-8 text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-[#C2DDD4]/60">Wellness updates</p>
            <div className="mt-3">
              <NewsletterForm />
            </div>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#18795A]/50 bg-[#18795A]/15 px-5 py-3 text-[13px] font-semibold tracking-[0.02em] text-[#C2DDD4] transition-[background-color,border-color,color] duration-300 hover:border-[#DDA83B]/70 hover:bg-[#18795A]/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B]"
            >
              <BrandIconWhatsApp />
              Book on WhatsApp
            </a>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="mt-16 flex flex-col gap-6 border-t border-[#18795A]/25 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 text-[13px] text-[#C2DDD4]/55 sm:flex-row sm:items-center sm:gap-6">
            <p>
              &copy; {year} {site.legalName}. All rights reserved.
            </p>
            <Link
              to="/privacy-policy"
              className="rounded-sm text-[#C2DDD4]/55 transition-colors duration-200 hover:text-[#DDA83B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B]"
            >
              Privacy Policy
            </Link>
            <span className="text-[#DDA83B]">* We accept all major insurance</span>
          </div>
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <BrandLinks items={SOCIAL} className="gap-1" itemClass="text-[#C2DDD4]/75 hover:bg-[#DDA83B] hover:text-[#08231C] focus-visible:outline-[#DDA83B]" />
            <button
              type="button"
              onClick={toTop}
              aria-label="Back to top"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#DDA83B]/50 text-[#DDA83B] transition-[background-color,color,translate] duration-300 hover:-translate-y-0.5 hover:bg-[#DDA83B] hover:text-[#08231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DDA83B] lg:ml-4"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

/** WhatsApp glyph for the booking button (same mark as BrandLinks). */
function BrandIconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#25D366]" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z" />
    </svg>
  )
}
