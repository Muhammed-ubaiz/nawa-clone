import { Ban, CalendarCheck, CircleCheck, Clock, Mail, Stethoscope } from 'lucide-react'

/**
 * Six headline metrics for today — the same figures as before (requests
 * received today, split by status, plus today's contact messages).
 */
export default function DashboardMetrics({ today }) {
  const r = today.received
  const cards = [
    { label: "Today's Appointments", value: r.total, note: 'Requests received today', icon: CalendarCheck, tone: 'bg-primary text-white' },
    { label: 'Confirmed', value: r.Confirmed, note: 'Confirmed today', icon: Stethoscope, tone: 'bg-secondary/70 text-primary-dark' },
    { label: 'Pending', value: r.Pending, note: 'Awaiting confirmation', icon: Clock, tone: 'bg-[#f8f1e1] text-[#9a7623]' },
    { label: 'Completed', value: r.Completed, note: 'Visits completed', icon: CircleCheck, tone: 'bg-[#ebf4e6] text-[#4f7d33]' },
    { label: 'Cancelled', value: r.Cancelled, note: 'Cancelled today', icon: Ban, tone: 'bg-[#efeee6] text-olive' },
    { label: 'Contacts', value: today.contacts, note: 'Messages received today', icon: Mail, tone: 'bg-[#f6efe2] text-accent-dark' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map(({ label, value, note, icon: Icon, tone }, i) => (
        <div
          key={label}
          className="group animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both] rounded-[20px] border border-border/70 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-26px_rgba(7,8,7,0.35)]"
          style={{ animationDelay: `${80 + i * 50}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="pt-1 text-[13px] font-medium leading-snug text-text-soft">{label}</p>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-text">{value ?? '—'}</p>
          <p className="mt-2.5 text-[12px] text-text-soft">{note}</p>
        </div>
      ))}
    </div>
  )
}
