import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { images, spacePhotos } from '../data/images'
import { site } from '../data/site'
import { useSEO } from '../hooks/useSEO'
import { contactsApi } from '../services/api'
import { isEmail, isPhone } from '../utils/format'
import { notifyDataChanged } from '../utils/liveSync'
import Button from '../components/common/Button'
import Reveal from '../components/common/Reveal'
import StoryHero from '../components/sections/StoryHero'

// SweetAlert2 is loaded on demand so public pages stay light.
const loadAlerts = () => import('../utils/alerts')

const cards = [
  { icon: MapPin, title: 'Location', lines: site.addressLines, href: site.mapLink, external: true },
  { icon: Clock, title: 'Hours', lines: ['Monday – Sunday', site.hoursShort] },
  { icon: Phone, title: 'Phone', lines: [site.phone, `Reception: ${site.reception}`], href: site.phoneHref },
  { icon: Mail, title: 'Email', lines: [site.email], href: `mailto:${site.email}` },
]

// Hero chapters: they change with scroll (shared story engine, as on the About page).
const CHAPTERS = [
  {
    eyebrow: 'Contact Us',
    title: (
      <>
        We&rsquo;d Love to <em className="font-normal italic text-logo-gold">Hear</em> From You
      </>
    ),
    text: 'Reach out with any question — about a treatment, a program or your first visit.',
    actions: [{ to: '/appointment', label: 'Book Appointment' }],
  },
  {
    eyebrow: 'Visit Us',
    title: (
      <>
        Find Us at <em className="font-normal italic text-logo-gold">Dhabi Tower</em>
      </>
    ),
    text: `Opposite Al Mariya Mall in Abu Dhabi — open every day, ${site.hoursShort}.`,
  },
  {
    eyebrow: 'Talk to Our Team',
    title: (
      <>
        We&rsquo;re Here to <em className="font-normal italic text-logo-gold">Help</em>
      </>
    ),
    text: `Call ${site.phone} or send us a message below — we reply within one working day.`,
    actions: [{ to: '/appointment', label: 'Book Appointment' }],
  },
]

const emptyContact = { name: '', email: '', phone: '', message: '' }

function validateContact(v) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!isEmail(v.email)) e.email = 'Please enter a valid email address.'
  if (v.phone.trim() && !isPhone(v.phone)) e.phone = 'Please enter a valid phone number.'
  if (v.message.trim().length < 10) e.message = 'Please write a short message (at least 10 characters).'
  return e
}

function ContactForm() {
  const [values, setValues] = useState(emptyContact)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting

  const change = (e) => {
    const next = { ...values, [e.target.name]: e.target.value }
    setValues(next)
    if (errors[e.target.name]) setErrors(validateContact(next))
  }

  const focusFirst = (errs) => document.getElementById(`ct-${Object.keys(errs)[0]}`)?.focus()

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return // no duplicate submissions
    const errs = validateContact(values)
    setErrors(errs)
    const alerts = await loadAlerts()

    if (Object.keys(errs).length) {
      const count = Object.keys(errs).length
      await alerts.showWarning(
        'Please check your details',
        count === 1 ? Object.values(errs)[0] : `${count} fields need your attention. They are highlighted in the form.`,
        { returnFocus: false },
      )
      return focusFirst(errs)
    }

    setStatus('submitting')
    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    try {
      await alerts.withLoading(() => contactsApi.create(payload), { title: 'Sending your message…' })
      notifyDataChanged('contacts')
      setValues(emptyContact)
      setErrors({})
      setStatus('idle')
      alerts.showSuccess('Message sent', 'Thank you for reaching out. A member of our team will reply within one working day.', { timer: 6000 })
    } catch (err) {
      setStatus('idle')
      const fieldErrors = err.fields || {}
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      await alerts.showApiError(err, { title: 'Message could not be sent' })
      if (Object.keys(fieldErrors).length) focusFirst(fieldErrors)
    }
  }

  const err = (k) =>
    errors[k] && (
      <p id={`ct-${k}-err`} role="alert" className="mt-1.5 pl-4 text-[12px] font-medium text-red-300">
        {errors[k]}
      </p>
    )
  const a = (k) => ({
    id: `ct-${k}`,
    name: k,
    value: values[k],
    onChange: change,
    disabled: status === 'submitting',
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `ct-${k}-err` : undefined,
    className: `field ${errors[k] ? '!border-red-400' : ''}`,
  })

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2" aria-busy={status === 'submitting'}>
        <div>
          <label htmlFor="ct-name" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-mist">Name</label>
          <input type="text" autoComplete="name" placeholder="Your name" {...a('name')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="ct-email" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-mist">Email</label>
          <input type="email" autoComplete="email" placeholder="you@example.com" {...a('email')} />
          {err('email')}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ct-phone" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-mist">Phone (optional)</label>
          <input type="tel" autoComplete="tel" placeholder="+971 50 000 0000" {...a('phone')} />
          {err('phone')}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ct-message" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-mist">Message</label>
          <textarea rows={5} placeholder="Write your message" {...a('message')} />
          {err('message')}
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="brand"
            loading={status === 'submitting'}
          >
            {status === 'submitting' ? 'Sending…' : 'Send Message'}
          </Button>
        </div>
      </form>
    </>
  )
}

export default function Contact() {
  useSEO({
    title: 'Contact Us',
    description: `Visit Nawa Ayurveda at Dhabi Tower, Abu Dhabi. Call ${site.phone} or email ${site.email}. Open ${site.hours}.`,
    image: images.space,
  })

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for the whole page
  // (form fields included — see `.theme-logo .field`).
  return (
    <div className="theme-logo">
      {/* Hero: the About page's split story hero (logo theme) — the treatment-room photo dissolving
          in from the right, three chapters that change with scroll, breadcrumb and progress at the foot */}
      <StoryHero
        label="Contact Nawa Ayurveda"
        layout="split"
        theme="logo"
        chapters={CHAPTERS}
        media={
          <img
            src={spacePhotos.room.src}
            srcSet={spacePhotos.room.srcSet}
            sizes="(min-width: 1280px) 64vw, (min-width: 1024px) 70vw, 100vw"
            alt={spacePhotos.room.alt}
            fetchPriority="high"
            decoding="async"
            className="about-hero-media h-full w-full object-cover object-[55%_50%]"
          />
        }
        footer={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/55 sm:text-[11.5px]">
              <li>
                <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-logo-gold">/</li>
              <li aria-current="page" className="text-mist/90">Contact Us</li>
            </ol>
          </nav>
        }
      />

      <section className="relative isolate overflow-hidden bg-herbal-base py-16 md:py-20 lg:py-24" aria-label="Contact details">
        <div
          aria-hidden="true"
          className="edge-fade pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(circle at 15% 20%, rgba(24,121,90,0.15), transparent 40%), radial-gradient(circle at 85% 65%, rgba(221,168,59,0.07), transparent 40%)' }}
        />
        <div className="container-x">
          {/* Contact cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ icon: Icon, title, lines, href, external }, i) => {
              const body = (
                <>
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-logo-gold/45 bg-leaf/15 text-logo-gold transition-colors duration-500 group-hover:border-logo-gold group-hover:bg-logo-gold group-hover:text-herbal-base">
                    <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p aria-hidden="true" className="mt-6 font-serif text-[16px] italic leading-none text-logo-gold">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-2 font-serif text-[26px] font-medium leading-tight text-white transition-colors duration-300 group-hover:text-logo-gold">{title}</h2>
                  <span aria-hidden="true" className="mt-4 block h-px w-10 bg-leaf/60 transition-[width,background-color] duration-500 ease-premium group-hover:w-16 group-hover:bg-logo-gold" />
                  <div className="mt-4 text-[14px] leading-relaxed text-mist">
                    {lines.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>
                </>
              )
              const cls =
                'group block h-full rounded-[24px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-7 backdrop-blur-sm transition-[border-color,translate,box-shadow] duration-500 ease-premium hover:-translate-y-1 hover:border-logo-gold/50 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold'
              return (
                <Reveal key={title} delay={i * 100}>
                  {href ? (
                    <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {body}
                    </a>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </Reveal>
              )
            })}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Form panel */}
            <Reveal className="relative overflow-hidden rounded-[30px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-6 backdrop-blur-sm sm:p-10">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
                style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.10), transparent)' }}
              />
              <p className="relative flex items-center gap-4 leading-none">
                <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Get in touch</span>
              </p>
              <h2 className="relative mt-6 font-serif text-[36px] font-medium leading-[1.05] !text-white sm:text-[46px]">
                Send Us a <em className="font-normal italic text-logo-gold">Message</em>
              </h2>
              <p className="relative mb-8 mt-4 text-[15px] text-mist">Fill in the form and we will get back to you as soon as possible.</p>
              <div className="relative">
                <ContactForm />
              </div>
            </Reveal>

            <Reveal delay={150} className="flex flex-col gap-6">
              {/* Map, toned to the dark canvas */}
              <div className="relative min-h-[340px] flex-1 overflow-hidden rounded-[30px] border border-leaf/35 bg-[#0c2f24] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.75)]">
                <iframe
                  title="Map showing Nawa Ayurveda at Dhabi Tower, Abu Dhabi"
                  src={site.mapEmbed}
                  className="h-full min-h-[340px] w-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.55)_brightness(0.9)]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <a
                  href={site.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/85 px-4 py-2 text-xs font-semibold text-logo-gold backdrop-blur-md transition-colors duration-300 hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Open in Google Maps
                </a>
              </div>

              {/* Booking panel */}
              <div className="relative overflow-hidden rounded-[30px] border border-logo-gold/30 bg-gradient-to-br from-[#0e3a2c] to-herbal-base p-8 text-white">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
                  style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.16), transparent)' }}
                />
                <p className="relative text-[11px] font-semibold uppercase tracking-[0.25em] text-logo-gold">Your next step</p>
                <h2 className="relative mt-3 font-serif text-[31px] font-medium leading-tight !text-white">
                  Prefer to book <em className="font-normal italic text-logo-gold">directly?</em>
                </h2>
                <p className="relative mt-3 text-[15px] text-mist">Choose your service, date and time online in under a minute.</p>
                <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button to="/appointment" variant="brand">
                    Book Appointment
                  </Button>
                  <Button href={site.phoneHref} variant="light" iconLeft={Phone} className="!border-logo-gold/50 !bg-transparent !text-logo-gold hover:!bg-logo-gold hover:!text-herbal-base">
                    Call Now
                  </Button>
                </div>
                <p className="relative mt-6 inline-flex items-center gap-2 border-t border-leaf/30 pt-5 text-[13px] text-mist">
                  <ShieldCheck className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                  We accept all major insurance
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
