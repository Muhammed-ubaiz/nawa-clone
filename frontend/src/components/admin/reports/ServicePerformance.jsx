import { Stethoscope } from 'lucide-react'
import ReportCard from './ReportCard'
import { ChartSkeleton } from './ReportSkeletons'

/** Appointments by service for the selected period — clean horizontal bars, one hue. */
export default function ServicePerformance({ services, periodLabel, loading, delay }) {
  const max = services?.[0]?.total || 1

  return (
    <ReportCard title="Popular Services" subtitle={`Appointments by service · ${periodLabel}`} delay={delay}>
      {loading && !services ? (
        <ChartSkeleton height={220} />
      ) : !services?.length ? (
        <div className="grid h-[220px] place-items-center rounded-xl bg-canvas text-center text-[13px] text-text-soft">
          <div>
            <Stethoscope className="mx-auto mb-2 h-6 w-6 text-text-soft/70" aria-hidden="true" />
            No service requests in this period
          </div>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Appointments per service">
          {services.map((s, i) => (
            <li key={s.service} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate font-medium">{s.service}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold">{s.total.toLocaleString('en-US')}</span>
                  <span className="ml-2 text-text-soft">{s.share}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(3, (s.total / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  )
}
