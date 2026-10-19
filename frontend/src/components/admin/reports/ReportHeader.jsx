import { CalendarDays } from 'lucide-react'

const fmtToday = (iso) => {
  const d = iso ? new Date(`${iso}T00:00:00Z`) : new Date()
  return d.toLocaleDateString('en-GB', { timeZone: iso ? 'UTC' : 'Asia/Dubai', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Eyebrow, heading and a compact "today in Abu Dhabi" indicator. */
export default function ReportHeader({ today }) {
  return (
    <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Reports &amp; Analytics</p>
        <h1 className="mt-2 font-serif text-[32px] leading-[1.1] md:text-[40px]">Appointment Reports</h1>
        <p className="mt-2 max-w-xl text-[14px] text-text-soft">Monitor appointments, track performance, and generate detailed reports.</p>
      </div>
      <div className="inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-white px-4 py-2 text-[13px] sm:self-auto">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <CalendarDays className="h-4 w-4 text-text-soft" aria-hidden="true" />
        <span className="font-medium">{fmtToday(today)}</span>
      </div>
    </header>
  )
}
