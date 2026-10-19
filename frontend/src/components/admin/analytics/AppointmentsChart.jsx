import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, STATUSES, STATUS_COLORS } from './chartTheme'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="min-w-[170px] rounded-2xl border border-border bg-white px-4 py-3 text-[13px] shadow-xl">
      <p className="mb-2 font-semibold">{row.fullLabel || label}</p>
      <ul className="space-y-1">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-text-soft">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[s] }} aria-hidden="true" />
              {s}
            </span>
            <span className="font-semibold tabular-nums">{row[s]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{row.total}</span>
      </p>
    </div>
  )
}

export function StatusLegend({ className = '' }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-text-soft ${className}`}>
      {STATUSES.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[s] }} aria-hidden="true" />
          {s}
        </li>
      ))}
    </ul>
  )
}

const UNIT = { hour: 'hour', day: 'day', month: 'month' }

/**
 * Stacked bars of appointments per bucket (hour / day / month), split by status,
 * with a chart/table toggle so values are never conveyed by colour alone.
 */
export default function AppointmentsChart({ timeline }) {
  const [view, setView] = useState('chart')
  const buckets = timeline?.buckets ?? []
  const total = buckets.reduce((a, b) => a + b.total, 0)
  const dense = buckets.length > 20

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <StatusLegend />
        <div role="tablist" aria-label="Display as" className="flex rounded-full bg-muted p-1">
          {['chart', 'table'].map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition ${view === v ? 'bg-white shadow-sm' : 'text-text-soft'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        total === 0 ? (
          <div className="grid h-[300px] place-items-center rounded-2xl bg-muted/60 text-[14px] text-text-soft">No appointments in this period.</div>
        ) : (
          <div className="h-[300px] w-full" role="img" aria-label={`Appointments per ${UNIT[timeline.granularity]}: ${total} in total`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap={dense ? '18%' : '28%'}>
                <CartesianGrid vertical={false} stroke={AXIS.grid} />
                <XAxis dataKey="label" tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.line }} interval="preserveStartEnd" minTickGap={dense ? 14 : 4} />
                <YAxis allowDecimals={false} tick={AXIS.tick} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(65,117,114,0.08)' }} />
                {STATUSES.map((s, i) => (
                  <Bar
                    key={s}
                    dataKey={s}
                    stackId="status"
                    fill={STATUS_COLORS[s]}
                    stroke="#ffffff"
                    strokeWidth={1}
                    maxBarSize={36}
                    radius={i === STATUSES.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive
                    animationDuration={700}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      ) : (
        <div className="max-h-[300px] overflow-auto rounded-2xl border border-border">
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Appointments per {UNIT[timeline?.granularity]}</caption>
            <thead className="sticky top-0 bg-muted text-[11px] uppercase tracking-wider text-text-soft">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold capitalize">{UNIT[timeline?.granularity]}</th>
                {STATUSES.map((s) => (
                  <th key={s} scope="col" className="px-3 py-2.5 text-right font-semibold">
                    {s}
                  </th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buckets.map((b) => (
                <tr key={b.key} className={b.total ? '' : 'text-text-soft'}>
                  <th scope="row" className="px-4 py-2 font-medium">
                    {b.label}
                  </th>
                  {STATUSES.map((s) => (
                    <td key={s} className="px-3 py-2 text-right tabular-nums">
                      {b[s]}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{b.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {timeline?.withoutTimeSlot > 0 && (
        <p className="mt-3 text-[12px] text-text-soft">
          {timeline.withoutTimeSlot} appointment{timeline.withoutTimeSlot > 1 ? 's were' : ' was'} booked without a time slot and {timeline.withoutTimeSlot > 1 ? 'are' : 'is'} not shown by hour.
        </p>
      )}
    </div>
  )
}
