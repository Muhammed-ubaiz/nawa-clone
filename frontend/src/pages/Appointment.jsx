import { useLocation } from 'react-router-dom'
import { images } from '../data/images'
import { site } from '../data/site'
import { useSEO } from '../hooks/useSEO'
import AppointmentForm from '../components/appointment/AppointmentForm'

/** Visit details under the booking progress rail: minimal type, thin rules, no cards. */
function VisitDetails() {
  const rows = [
    { label: 'Location', value: site.addressLines.join(', ') },
    { label: 'Hours', value: site.hours },
    { label: 'Phone', value: site.phone, href: site.phoneHref },
    { label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { label: 'Parking', value: 'Valet parking available' },
  ]
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-logo-gold">Visit Us</p>
      <dl className="mt-5 border-t border-[#526F68]/40">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 border-b border-[#526F68]/40 py-4">
            <dt className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#526F68]">{r.label}</dt>
            <dd className="text-[14px] leading-relaxed text-[#F6F2E9]/85">
              {r.href ? (
                <a href={r.href} className="rounded-sm transition-colors duration-300 hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Appointment page — a premium booking experience on the site's #08231C canvas:
 * intro (gold eyebrow, large ivory Cormorant heading, muted ivory lead, ~650px wide), then the
 * editorial split booking interface (live 01 / 02 / 03 progress rail + visit details on the left,
 * ivory underline form on the right). Depth comes from very soft tonal light, not a gradient.
 * The form keeps its fields, validation and API payload (components/appointment/AppointmentForm).
 */
export default function Appointment() {
  const { state } = useLocation()

  useSEO({
    title: 'Book an Ayurvedic Consultation',
    description: 'Book an appointment at Nawa Ayurvedic Medical Centre in Abu Dhabi. Choose your Ayurvedic therapy, preferred date and time, and our team will confirm.',
    image: images.heroAyurveda,
  })

  return (
    <div className="theme-logo">
      <section
        className="relative isolate overflow-hidden bg-herbal-base pb-16 pt-32 sm:pb-20 sm:pt-36 md:pb-24 md:pt-40 lg:pb-28 lg:pt-48"
        aria-labelledby="appointment-title"
        data-header-dark=""
      >
        {/* Organic depth: very soft tonal light, masked off the section edges */}
        <div
          aria-hidden="true"
          className="edge-fade pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 18% 22%, rgba(24,121,90,0.10), transparent 70%), radial-gradient(ellipse 45% 40% at 85% 60%, rgba(26,56,50,0.55), transparent 70%), radial-gradient(ellipse 40% 30% at 30% 90%, rgba(221,168,59,0.04), transparent 70%)',
          }}
        />

        <div className="container-x">
          {/* Introduction */}
          <div className="svh max-w-[650px]">
            <p className="svh-in flex items-center gap-4 leading-none" style={{ '--d': '150ms' }}>
              <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Begin Your Journey</span>
            </p>
            <h1
              id="appointment-title"
              className="svh-in mt-7 font-serif text-[44px] font-medium leading-[1.04] !text-[#F6F2E9] sm:text-[58px] lg:text-[72px] xl:text-[82px]"
              style={{ '--d': '300ms' }}
            >
              Your Journey Towards <em className="font-normal italic text-logo-gold">Balance</em> Begins Here.
            </h1>
            <p className="svh-in mt-7 text-[16px] font-light leading-[1.8] text-[#F6F2E9]/70 sm:text-[18px]" style={{ '--d': '450ms' }}>
              Take the first step towards personalized Ayurvedic care. Share a few details with us and our team will help you find the right
              path for your wellbeing.
            </p>
          </div>

          {/* Booking interface */}
          <div className="svh mt-16 lg:mt-24">
            <div className="svh-in" style={{ '--d': '600ms' }}>
              <AppointmentForm variant="editorial" defaultService={state?.service ?? ''} aside={<VisitDetails />} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
