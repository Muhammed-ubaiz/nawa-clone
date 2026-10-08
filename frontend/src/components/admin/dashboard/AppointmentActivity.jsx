import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS } from '../analytics/chartTheme'
import DashCard, { InlineError } from './DashCard'
import { ChartSkeleton } from './DashboardSkeleton'

export const ACTIVITY_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

// Validated colour-blind-safe pair from the status palette.
const SERIES = {
  requests: { label: 'Requests received', color: '#00897A' },
  visits: { label: 'Visits scheduled', color: '#B88E2D' },
}

function ActivityTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-white px-3.5 py-2.5 text-[12px] shadow-lg">
      <p className="mb-1.5 font-semibold text-text">{label}</p>
      {Object.entries(SERIES).map(([key, s]) => (
        <p key={key} className="flex items-center justify-between gap-4 py-0.5 text-text-soft">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
          <span className="font-semibold tabular-nums text-text">{row[key]}</span>
        </p>
      ))}
    </div>
  )
}

/** Merges the two timelines (received vs scheduled) bucket by bucket. */
export function mergeActivity(received, scheduled) {
  const visits = new Map((scheduled?.timeline?.buckets ?? []).map((b) => [b.key, b.total]))
  return (received?.timeline?.buckets ?? []).map((b) => ({ key: b.key, label: b.label, requests: b.total, visits: visits.get(b.key) ?? 0 }))
}

/**
 * Line/area chart of appointment volume over time with a compact range switch.
 * Data: existing /api/analytics/{range} endpoint, basis=created and basis=scheduled.
 */
export default function AppointmentActivity({ range, onRange, data, loading, error, onRetry, delay }) {
  const rows = data?.rows ?? []
  const totals = rows.reduce((a, r) => ({ requests: a.requests + r.requests, visits: a.visits + r.visits }), { requests: 0, visits: 0 })
  const empty = !rows.some((r) => r.requests || r.visits)

  const toggle = (
    <div role="tablist" aria-label="Activity range" className="flex max-w-full overflow-x-auto rounded-full bg-canvas p-1">
      {ACTIVITY_RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="tab"
          aria-selected={range === r.value}
          onClick={() => onRange(r.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-300 ${
            range === r.value ? 'bg-white text-text shadow-sm' : 'text-text-soft hover:text-text'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  return (
    <DashCard title="Appointment Activity" subtitle="Track appointment requests and visits over time." action={toggle} delay={delay} className="min-w-0">
      {error ? (
        <InlineError onRetry={onRetry} />
      ) : loading && !data ? (
        <ChartSkeleton />
      ) : (
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : ''}`}>
          <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-2">
            {Object.entries(SERIES).map(([key, s]) => (
              <div key={key}>
                <p className="flex items-center gap-2 text-[12px] text-text-soft">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                  {s.label}
                </p>
                <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums text-text">{totals[key]}</p>
              </div>
            ))}
            <p className="ml-auto text-[12px] text-text-soft">{data?.label}</p>
          </div>

          {empty ? (
            <div className="grid h-[260px] place-items-center rounded-2xl bg-canvas text-[13px] text-text-soft">No appointment activity in this period</div>
          ) : (
            <div className="h-[260px] w-full" role="img" aria-label={`Appointment activity, ${data?.label}: ${totals.requests} requests received, ${totals.visits} visits scheduled`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES.requests.color} stopOpacity={0.14} />
                      <stop offset="100%" stopColor={SERIES.requests.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={AXIS.grid} />
                  <XAxis dataKey="label" tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.line }} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis allowDecimals={false} tick={AXIS.tick} tickLine={false} axisLine={false} width={44} />
                  <Tooltip content={<ActivityTip />} cursor={{ stroke: AXIS.line }} />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke={SERIES.requests.color}
                    strokeWidth={2}
                    fill="url(#dashRequests)"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={600}
                  />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke={SERIES.visits.color}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </DashCard>
  )
}
