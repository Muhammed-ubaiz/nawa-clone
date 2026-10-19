import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analyticsApi } from '../../../services/api'
import { useApi } from '../../../hooks/useApi'
import { AXIS, SERIES_COLOR } from '../analytics/chartTheme'
import ReportCard from './ReportCard'
import { ChartSkeleton } from './ReportSkeletons'

const RANGES = [
  { value: 'today', label: 'Today', unit: 'hour' },
  { value: 'week', label: 'Week', unit: 'day' },
  { value: 'month', label: 'Month', unit: 'day' },
  { value: 'year', label: 'Year', unit: 'month' },
]

function TrendTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] shadow-lg">
      <p className="text-text-soft">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold tabular-nums">
        {payload[0].value} appointment{payload[0].value === 1 ? '' : 's'}
      </p>
    </div>
  )
}

/**
 * Appointments over time by scheduled date, using the existing
 * /api/analytics/{today|week|month|year} endpoints (basis=scheduled).
 * Month/Year follow the month & year chosen on the page.
 */
export default function AppointmentTrendChart({ month, year, delay }) {
  const [range, setRange] = useState('month')
  const { data, loading, error, reload } = useApi(
    (signal) => analyticsApi.summary({ period: range, month, year, basis: 'scheduled' }, { signal }).then((r) => r.data),
    [range, month, year],
  )

  const buckets = data?.timeline?.buckets ?? []
  const total = buckets.reduce((a, b) => a + b.total, 0)
  const unit = RANGES.find((r) => r.value === range)?.unit

  const toggle = (
    <div role="tablist" aria-label="Trend range" className="flex rounded-full bg-canvas p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="tab"
          aria-selected={range === r.value}
          onClick={() => setRange(r.value)}
          className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors duration-300 ${
            range === r.value ? 'bg-white text-text shadow-sm' : 'text-text-soft hover:text-text'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  return (
    <ReportCard
      title="Appointment Trends"
      subtitle={data ? `Track appointment activity over time · ${data.range.label}` : 'Track appointment activity over time'}
      action={toggle}
      delay={delay}
    >
      {loading && !data ? (
        <ChartSkeleton />
      ) : error ? (
        <div className="grid h-[260px] place-items-center text-center text-[13px] text-text-soft">
          <div>
            Unable to load trend data.
            <button type="button" onClick={reload} className="ml-2 font-semibold text-primary hover:underline">
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : ''}`}>
          <p className="mb-3 text-[13px] text-text-soft">
            <span className="text-[22px] font-semibold tabular-nums text-text">{total.toLocaleString('en-US')}</span> scheduled
            {data?.timeline?.withoutTimeSlot ? ` · ${data.timeline.withoutTimeSlot} without a time slot not shown by hour` : ''}
          </p>
          <div className="h-[260px] w-full animate-[fade-up_0.7s_ease_both]" role="img" aria-label={`Appointments per ${unit}, ${total} in total`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={AXIS.grid} />
                <XAxis dataKey="label" tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.line }} interval="preserveStartEnd" minTickGap={16} />
                <YAxis allowDecimals={false} tick={AXIS.tick} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<TrendTip />} cursor={{ stroke: AXIS.line, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={SERIES_COLOR}
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  dot={buckets.length <= 31 ? { r: 3, strokeWidth: 2, stroke: '#ffffff', fill: SERIES_COLOR } : false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff', fill: SERIES_COLOR }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ReportCard>
  )
}
