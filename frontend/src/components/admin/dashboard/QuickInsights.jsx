import { CalendarDays, CalendarRange, FileText, MailOpen } from 'lucide-react'

/** Small secondary figures, all from existing endpoints. */
export default function QuickInsights({ overview, monthAppointments, delay }) {
  const items = [
    { label: "Today's visits", value: overview.today.scheduled.total, note: 'Scheduled for today', icon: CalendarDays },
    { label: "This month's appointments", value: monthAppointments, note: 'Requests received this month', icon: CalendarRange },
    { label: 'Unread contacts', value: overview.contacts.unread, note: `${overview.contacts.total} messages in total`, icon: MailOpen },
    { label: 'Published blogs', value: overview.blogs.published, note: `${overview.blogs.drafts} draft${overview.blogs.drafts === 1 ? '' : 's'}`, icon: FileText },
  ]

  return (
    <section aria-labelledby="insights-title" className="animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both]" style={{ animationDelay: `${delay}ms` }}>
      <h2 id="insights-title" className="mb-3 font-sans text-[16px] font-semibold tracking-tight text-text">
        Quick Insights
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-white px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-22px_rgba(7,8,7,0.35)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2">
                <span className="text-[22px] font-semibold leading-none tabular-nums text-text">{value ?? '—'}</span>
                <span className="truncate text-[13px] font-medium text-text">{label}</span>
              </p>
              <p className="mt-1 truncate text-[12px] text-text-soft">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
