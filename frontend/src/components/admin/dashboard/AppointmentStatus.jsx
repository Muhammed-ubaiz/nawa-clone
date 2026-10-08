import StatusDonut from '../analytics/StatusDonut'
import DashCard, { InlineError } from './DashCard'

/** Donut + labelled totals for the period selected in Appointment Activity. */
export default function AppointmentStatus({ counts, label, loading, error, onRetry, delay }) {
  return (
    <DashCard title="Appointment Status" subtitle={label ? `Requests received · ${label}` : 'Requests received'} delay={delay} className="min-w-0">
      {error ? (
        <InlineError onRetry={onRetry} />
      ) : loading && !counts ? (
        <div className="space-y-4" aria-hidden="true">
          <div className="mx-auto h-[200px] w-[200px] animate-pulse rounded-full border-[18px] border-border/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded-full bg-border/60" />
          ))}
        </div>
      ) : (
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : ''}`}>
          <StatusDonut counts={counts} />
        </div>
      )}
    </DashCard>
  )
}
