import { CalendarCheck, CalendarDays, CalendarRange, ChartNoAxesCombined } from 'lucide-react'
import { formatCount } from './useReportDownload'

/** Four headline metrics, all by scheduled appointment date (Abu Dhabi time). */
export default function ReportStats({ overview }) {
  const cards = [
    { label: 'Total Appointments', value: overview.allTime, note: 'All scheduled appointments', icon: CalendarDays },
    { label: 'Today', value: overview.today, note: 'Appointments scheduled today', icon: CalendarCheck },
    { label: 'This Month', value: overview.month, note: 'Appointments this month', icon: CalendarRange },
    { label: 'This Year', value: overview.year, note: 'Appointments this year', icon: ChartNoAxesCombined },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, note, icon: Icon }, i) => (
        <div
          key={label}
          className="group animate-fade-up rounded-2xl border border-border/70 bg-white p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_40px_-28px_rgba(7,8,7,0.35)]"
          style={{ animationDelay: `${120 + i * 80}ms` }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-text-soft">{label}</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-primary transition-colors duration-300 group-hover:bg-secondary">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{formatCount(value)}</p>
          <p className="mt-3 text-[12px] text-text-soft">{note}</p>
        </div>
      ))}
    </div>
  )
}
