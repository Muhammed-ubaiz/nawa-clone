import { useState } from 'react'
import { Check } from 'lucide-react'
import { useServices } from '../../context/ServicesContext'
import { programs } from '../../data/programs'
import { appointmentsApi } from '../../services/api'
import { isEmail, isPhone } from '../../utils/format'
import { notifyDataChanged } from '../../utils/liveSync'
import Button from '../common/Button'

// SweetAlert2 is loaded on demand so public pages stay light.
const loadAlerts = () => import('../../utils/alerts')

const TIMES = ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM']
const empty = { name: '', phone: '', email: '', date: '', time: '', service: '', message: '' }

const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().split('T')[0]
}

const validators = {
  name: (v) => (v.trim().length < 2 ? 'Please enter your full name.' : ''),
  phone: (v) => (!isPhone(v) ? 'Please enter a valid phone number.' : ''),
  email: (v) => (!isEmail(v) ? 'Please enter a valid email address.' : ''),
  date: (v) => (!v ? 'Please choose a preferred date.' : v < todayISO() ? 'Please choose a date from today onward.' : ''),
  time: (v) => (!v ? 'Please choose a preferred time.' : ''),
  service: (v) => (!v ? 'Please select a service.' : ''),
  message: (v) => (v.length > 2000 ? 'Message must be 2000 characters or fewer.' : ''),
}

/**
 * Shared form state, validation and submission (POST /api/appointments). Both layouts use it, so
 * field names, validation and the payload are identical. `editorial` submits without the blocking
 * loading dialog (the button shows "Sending Request…") and confirms with the booking dialog.
 */
function useAppointmentForm({ compact, defaultService, editorial }) {
  const { services } = useServices()
  const [values, setValues] = useState({ ...empty, service: defaultService })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting

  const serviceOptions = [...new Set([...services.map((s) => s.name), ...programs.map((p) => p.title), 'General Consultation'])]
  const fields = compact ? ['name', 'phone', 'service', 'date'] : Object.keys(empty)
  const p = compact ? 'c-' : ''

  const update = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validators[name](value) }))
  }

  const blur = (e) => {
    const { name, value } = e.target
    if (value) setErrors((er) => ({ ...er, [name]: validators[name](value) }))
  }

  const focusFirst = (errs) => document.getElementById(`${p}${Object.keys(errs)[0]}`)?.focus()

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return // no duplicate submissions

    const next = {}
    fields.forEach((f) => {
      const msg = validators[f](values[f])
      if (msg) next[f] = msg
    })
    setErrors(next)
    const alerts = await loadAlerts()

    if (Object.keys(next).length) {
      const count = Object.keys(next).length
      await alerts.showWarning(
        'Please check your details',
        count === 1 ? Object.values(next)[0] : `${count} fields need your attention. They are highlighted in the form.`,
        { returnFocus: false },
      )
      return focusFirst(next)
    }

    setStatus('submitting')
    const payload = Object.fromEntries(fields.map((f) => [f, values[f].trim()]).filter(([, v]) => v))
    try {
      if (editorial) {
        await appointmentsApi.create(payload)
      } else {
        await alerts.withLoading(() => appointmentsApi.create(payload), {
          title: 'Booking your appointment…',
          text: 'This only takes a moment.',
        })
      }
      notifyDataChanged('appointments') // open admin tabs refresh immediately
      const service = values.service
      setValues({ ...empty, service: defaultService })
      setErrors({})
      setStatus('idle')
      if (editorial) {
        alerts.showBookingSuccess({
          title: 'Appointment Request Received',
          text: 'Thank you for choosing Nawa Ayurveda. Our team will get in touch with you shortly to confirm your appointment.',
          confirmText: 'Continue',
        })
      } else {
        alerts.showSuccess(
          'Appointment requested',
          `Thank you! Your request${service ? ` for ${service}` : ''} has been received. Our team will call you shortly to confirm the details.`,
          { timer: 7000 },
        )
      }
    } catch (err) {
      setStatus('idle')
      const fieldErrors = err.fields || {}
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      await alerts.showApiError(err, { title: 'Booking could not be sent' })
      if (Object.keys(fieldErrors).length) focusFirst(fieldErrors)
    }
  }

  return { values, errors, status, serviceOptions, p, update, blur, submit }
}

/* ---------------------------------------------------------------------------
   Editorial booking layout (Appointment page)
---------------------------------------------------------------------------- */

const STEPS = [
  { n: '01', label: 'Your Details', fields: ['name', 'email', 'phone'] },
  { n: '02', label: 'Your Preference', fields: ['service', 'date', 'time'] },
  { n: '03', label: 'Confirm', fields: [] },
]

/** Index of the current step: the first with an incomplete required field, else Confirm. */
const activeStep = (values) => {
  const i = STEPS.findIndex((s) => s.fields.some((f) => validators[f](values[f])))
  return i === -1 ? STEPS.length - 1 : i
}

/** Left rail: thin-line progress (01 / 02 / 03) that follows the form as it is completed. */
function StepRail({ active }) {
  return (
    <ol className="flex gap-6 lg:flex-col lg:gap-0" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <li key={s.n} className="relative flex-1 lg:flex-none lg:pb-12 lg:pl-10 lg:last:pb-0" aria-current={current ? 'step' : undefined}>
            {/* Vertical connector (desktop) */}
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="absolute bottom-0 left-[7px] top-6 hidden w-px bg-[#526F68]/40 lg:block">
                <span className={`block w-full bg-logo-gold transition-[height] duration-700 ease-premium ${done ? 'h-full' : 'h-0'}`} />
              </span>
            )}
            {/* Node */}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1.5 hidden h-[15px] w-[15px] place-items-center rounded-full border transition-colors duration-500 lg:grid ${
                done ? 'border-logo-gold bg-logo-gold text-herbal-base' : current ? 'border-[#F6F2E9] bg-transparent' : 'border-[#526F68]/60'
              }`}
            >
              {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              {current && <span className="h-[5px] w-[5px] rounded-full bg-[#F6F2E9]" />}
            </span>
            {/* Top rule (phones/tablets) */}
            <span aria-hidden="true" className="mb-3 block h-px w-full bg-[#526F68]/40 lg:hidden">
              <span className={`block h-full bg-logo-gold transition-[width] duration-700 ease-premium ${done || current ? 'w-full' : 'w-0'}`} />
            </span>
            <p className={`font-serif text-[26px] italic leading-none transition-colors duration-500 lg:text-[30px] ${done ? 'text-logo-gold' : current ? 'text-[#F6F2E9]' : 'text-[#526F68]'}`}>
              {s.n}
            </p>
            <p
              className={`mt-2 text-[10.5px] font-semibold uppercase leading-snug tracking-[0.22em] transition-colors duration-500 sm:text-[11px] ${
                current ? 'text-[#F6F2E9]' : done ? 'text-logo-gold/80' : 'text-[#526F68]'
              }`}
            >
              {s.label}
              {done && <span className="sr-only"> (completed)</span>}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** Small numbered group heading inside the ivory form. */
function GroupLabel({ n, children }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1A3832]">
      <span className="font-serif text-[18px] font-normal normal-case italic tracking-normal text-[#526F68]">{n}</span>
      <span aria-hidden="true" className="h-px w-6 bg-[#526F68]/40" />
      {children}
    </p>
  )
}

/**
 * Premium booking interface: a left rail (live 01 / 02 / 03 progress + `aside` content) beside an
 * ivory (#F6F2E9) editorial form — labels above clean underline fields, a custom service select, a
 * date field, time chips (radio group), and a forest-green "Request Appointment ↗" button with a
 * quiet inline loading state. Same fields, validation and payload as the classic form.
 */
function EditorialAppointmentForm({ defaultService, aside }) {
  const { values, errors, status, serviceOptions, update, blur, submit } = useAppointmentForm({ defaultService, editorial: true })
  const busy = status === 'submitting'
  const step = activeStep(values)

  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526F68] transition-colors duration-300 group-focus-within:text-[#1A3832]'
  const inputCls = (name) =>
    `mt-3 block w-full rounded-none border-0 border-b bg-transparent px-0 pb-3 pt-1 text-[16px] text-[#0F2622] placeholder:text-[#526F68]/55 transition-[border-color,box-shadow] duration-300 focus:outline-none focus:ring-0 disabled:opacity-60 ${
      errors[name]
        ? 'border-red-700/60 focus:border-red-700 focus:shadow-[0_1px_0_0_rgba(185,28,28,0.7)]'
        : 'border-[#526F68]/40 hover:border-[#526F68]/70 focus:border-[#1A3832] focus:shadow-[0_1px_0_0_#1A3832]'
    }`

  const bind = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: update,
    onBlur: blur,
    disabled: busy,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-err` : undefined,
    className: inputCls(name),
  })

  const error = (name) =>
    errors[name] && (
      <p id={`${name}-err`} role="alert" className="mt-2 text-[12.5px] font-medium text-red-700">
        {errors[name]}
      </p>
    )

  const field = (name, label, control, className = '') => (
    <div className={`group ${className}`}>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {control}
      {error(name)}
    </div>
  )

  const chevron =
    "appearance-none bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%231A3832%27%20stroke-width=%271.6%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)] bg-[length:18px] bg-[right_0_center] bg-no-repeat pr-8"

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16">
      {/* Rail */}
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <StepRail active={step} />
          {aside && <div className="mt-14 hidden lg:block">{aside}</div>}
        </div>
      </div>

      {/* Ivory form surface */}
      <div className="lg:col-span-8">
        <div className="rounded-[6px] bg-[#F6F2E9] px-6 py-10 shadow-[0_50px_100px_-60px_rgba(0,0,0,0.8)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#526F68]">Appointment Request</p>
          <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.08] !text-[#1A3832] sm:text-[42px] lg:text-[48px]">
            Let&rsquo;s Find The Right Time For You.
          </h2>
          <span aria-hidden="true" className="mt-8 block h-px w-full bg-[#526F68]/25" />

          <form onSubmit={submit} noValidate aria-busy={busy} className="mt-10">
            {/* 01 — details */}
            <fieldset disabled={busy} className="min-w-0">
              <legend className="contents">
                <GroupLabel n="01">Your Details</GroupLabel>
              </legend>
              <div className="mt-8 grid gap-x-10 gap-y-9 md:grid-cols-2">
                {field('name', 'Full Name', <input type="text" autoComplete="name" placeholder="Enter your full name" {...bind('name')} />, 'md:col-span-2')}
                {field('email', 'Email Address', <input type="email" autoComplete="email" placeholder="you@example.com" {...bind('email')} />)}
                {field('phone', 'Phone Number', <input type="tel" autoComplete="tel" placeholder="+971 50 000 0000" {...bind('phone')} />)}
              </div>
            </fieldset>

            {/* 02 — preference */}
            <fieldset disabled={busy} className="mt-14 min-w-0">
              <legend className="contents">
                <GroupLabel n="02">Your Preference</GroupLabel>
              </legend>
              <div className="mt-8 grid gap-x-10 gap-y-9 md:grid-cols-2">
                {field(
                  'service',
                  'Service / Treatment',
                  <select {...bind('service')} className={`${inputCls('service')} ${chevron} cursor-pointer ${values.service ? '' : '!text-[#526F68]/70'}`}>
                    <option value="">Select a service</option>
                    {serviceOptions.map((s) => (
                      <option key={s} value={s} className="text-[#0F2622]">
                        {s}
                      </option>
                    ))}
                  </select>,
                )}
                {field(
                  'date',
                  'Preferred Date',
                  <input type="date" min={todayISO()} {...bind('date')} className={`${inputCls('date')} booking-date cursor-pointer ${values.date ? '' : '!text-[#526F68]/70'}`} />,
                )}

                {/* Time: a radio group of quiet chips (same values as before) */}
                <div className="md:col-span-2" role="radiogroup" aria-labelledby="time-label" aria-describedby={errors.time ? 'time-err' : undefined}>
                  <p id="time-label" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526F68]">
                    Preferred Time
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {TIMES.map((t, i) => {
                      const on = values.time === t
                      return (
                        <label key={t} className="relative cursor-pointer">
                          <input
                            id={i === 0 ? 'time' : `time-${i}`}
                            type="radio"
                            name="time"
                            value={t}
                            checked={on}
                            onChange={update}
                            disabled={busy}
                            aria-invalid={!!errors.time}
                            className="peer sr-only"
                          />
                          <span
                            className={`block rounded-[3px] border px-4 py-2.5 text-[13px] font-medium tracking-[0.02em] transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1A3832] ${
                              on
                                ? 'border-[#1A3832] bg-[#1A3832] text-[#F6F2E9]'
                                : errors.time
                                  ? 'border-red-700/50 text-[#1A3832] hover:border-[#1A3832]'
                                  : 'border-[#526F68]/35 text-[#1A3832] hover:border-[#1A3832]'
                            }`}
                          >
                            {t}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {error('time')}
                </div>

                {field(
                  'message',
                  'Message / Additional Information (optional)',
                  <textarea rows={3} placeholder="Tell us briefly about your health goals or concerns" {...bind('message')} className={`${inputCls('message')} resize-none`} />,
                  'md:col-span-2',
                )}
              </div>
            </fieldset>

            {/* 03 — confirm */}
            <div className="mt-14">
              <GroupLabel n="03">Confirm</GroupLabel>
              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-[14px] leading-relaxed text-[#526F68]">
                  Our team will contact you to confirm your appointment. Your details are only used to arrange your visit.
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  aria-busy={busy}
                  className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-[3px] bg-[#1A3832] px-10 py-4 text-[14px] font-semibold tracking-[0.04em] text-[#F6F2E9] transition-colors duration-300 hover:bg-[#24493f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3832] disabled:cursor-not-allowed disabled:bg-[#1A3832]/80"
                >
                  {busy ? (
                    <>
                      <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-[#F6F2E9]/35 border-t-[#F6F2E9]" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      Request Appointment
                      <span aria-hidden="true" className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-px">
                        &#8599;
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        {aside && <div className="mt-12 lg:hidden">{aside}</div>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Classic layout (unchanged)
---------------------------------------------------------------------------- */

/**
 * Appointment request form connected to POST /api/appointments.
 * `compact` renders the shorter footer variant (name, phone, service, date).
 * `variant="editorial"` renders the premium booking interface (Appointment page); `aside` is
 * placed under its progress rail.
 */
export default function AppointmentForm({ compact = false, defaultService = '', variant, aside }) {
  if (variant === 'editorial') return <EditorialAppointmentForm defaultService={defaultService} aside={aside} />
  return <ClassicAppointmentForm compact={compact} defaultService={defaultService} />
}

function ClassicAppointmentForm({ compact, defaultService }) {
  const { values, errors, status, serviceOptions, p, update, blur, submit } = useAppointmentForm({ compact, defaultService })

  const labelCls = 'mb-2 block text-[13px] font-semibold text-text'
  const fieldCls = (name) => `field ${errors[name] ? '!border-red-400' : ''}`

  const field = (name, label, control) => (
    <div>
      <label htmlFor={`${p}${name}`} className={labelCls}>
        {label}
      </label>
      {control}
      {errors[name] && (
        <p id={`${p}${name}-err`} className="mt-1.5 pl-4 text-[12px] font-medium text-red-600" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  )

  const bind = (name) => ({
    id: `${p}${name}`,
    name,
    value: values[name],
    onChange: update,
    onBlur: blur,
    disabled: status === 'submitting',
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${p}${name}-err` : undefined,
    className: fieldCls(name),
  })

  const selectArrow =
    "appearance-none bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23417572%27%20stroke-width=%272%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)] bg-[length:18px] bg-[right_1.1rem_center] bg-no-repeat pr-11"

  return (
    <form onSubmit={submit} noValidate className={`grid gap-5 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'}`} aria-busy={status === 'submitting'}>
      {field('name', 'Full Name', <input type="text" autoComplete="name" placeholder="Your full name" {...bind('name')} />)}
      {field('phone', 'Phone Number', <input type="tel" autoComplete="tel" placeholder="+971 50 000 0000" {...bind('phone')} />)}
      {!compact && field('email', 'Email', <input type="email" autoComplete="email" placeholder="you@example.com" {...bind('email')} />)}
      {field(
        'service',
        'Service',
        <select {...bind('service')} className={`${fieldCls('service')} ${selectArrow}`}>
          <option value="">Select a service</option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>,
      )}
      {field('date', 'Preferred Date', <input type="date" min={todayISO()} {...bind('date')} />)}
      {!compact &&
        field(
          'time',
          'Preferred Time',
          <select {...bind('time')} className={`${fieldCls('time')} ${selectArrow}`}>
            <option value="">Select a time</option>
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>,
        )}
      {!compact && (
        <div className="md:col-span-2">
          {field('message', 'Message (optional)', <textarea rows={4} placeholder="Tell us briefly about your health goals or concerns" {...bind('message')} />)}
        </div>
      )}

      <div className={compact ? 'sm:col-span-2' : 'md:col-span-2'}>
        <Button type="submit" variant="accent" className="w-full sm:w-auto" loading={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : compact ? 'Submit' : 'Request Appointment'}
        </Button>
      </div>
    </form>
  )
}
