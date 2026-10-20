import { Stethoscope } from 'lucide-react'
import DashCard from './DashCard'

/** Top services by appointment requests (from the analytics summary), single hue. */
export default function PopularServices({ services, label, loading, delay }) {
  const top = (services ?? []).slice(0, 5)
  const max = top[0]?.total || 1

  return (
    <DashCard title="Popular Services" subtitle={label ? `By appointment requests · ${label}` : 'By appointment requests'} delay={delay}>
      {loading && !services ? (
        <div className="space-y-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-border/60" />
              <div className="h-2 animate-pulse rounded-full bg-border/40" />
            </div>
          ))}
        </div>
      ) : !top.length ? (
        <div className="flex flex-col items-center py-8 text-center text-[13px] text-text-soft">
          <Stethoscope className="mb-2 h-5 w-5 text-text-soft/70" aria-hidden="true" />
          No service requests in this period
        </div>
      ) : (
        <ul className="space-y-4">
          {top.map((s) => (
            <li key={s.service}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate font-medium text-text">{s.service}</span>
                <span className="shrink-0 font-semibold tabular-nums">{s.total}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${Math.max(4, (s.total / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
