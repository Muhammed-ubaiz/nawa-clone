import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleAlert, CircleCheck, CircleX, Clock } from 'lucide-react'
import { AXIS, STATUSES, STATUS_COLORS, pct } from '../analytics/chartTheme'
import ReportCard from './ReportCard'
import { ChartSkeleton } from './ReportSkeletons'

const ICONS = { Pending: Clock, Confirmed: CircleCheck, Completed: CircleCheck, Cancelled: CircleX }

function StatusTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] shadow-lg">
      <span className="font-semibold">{d.status}</span> · {d.value.toLocaleString('en-US')} ({d.share})
    </div>
  )
}

/** Status distribution: bar chart (left) + percentage summary (right). */
export default function AppointmentStatusChart({ stats, periodLabel, loading, delay }) {
  const total = stats?.total ?? 0
  const data = STATUSES.map((s) => ({ status: s, value: stats?.[s] ?? 0, share: pct(stats?.[s] ?? 0, total) }))

  return (
    <ReportCard title="Appointment Overview" subtitle={`Current appointment status distribution · ${periodLabel}`} delay={delay}>
      {loading && !stats ? (
        <ChartSkeleton height={220} />
      ) : total === 0 ? (
        <div className="grid h-[220px] place-items-center rounded-xl bg-canvas text-center text-[13px] text-text-soft">
          <div>
            <CircleAlert className="mx-auto mb-2 h-6 w-6 text-text-soft/70" aria-hidden="true" />
            No appointments in this period
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
          <div className="h-[220px] w-full animate-[fade-up_0.7s_ease_both]" role="img" aria-label={`Status distribution: ${data.map((d) => `${d.status} ${d.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 0 }} barCategoryGap="26%">
                <CartesianGrid horizontal={false} stroke={AXIS.grid} />
                <XAxis type="number" allowDecimals={false} tick={AXIS.tick} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="status" width={86} tick={{ ...AXIS.tick, fill: '#070807' }} tickLine={false} axisLine={false} />
                <Tooltip content={<StatusTip />} cursor={{ fill: 'rgba(65,117,114,0.05)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} animationDuration={700}>
                  {data.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fill: '#070807', fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-col justify-center divide-y divide-border/70">
            {data.map((d) => {
              const Icon = ICONS[d.status]
              return (
                <li key={d.status} className="flex items-center gap-3 py-3">
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.status] }} aria-hidden="true" />
                  <Icon className="h-4 w-4 shrink-0 text-text-soft" aria-hidden="true" />
                  <span className="flex-1 text-[13px] font-medium">{d.status}</span>
                  <span className="text-[13px] tabular-nums text-text-soft">{d.value.toLocaleString('en-US')}</span>
                  <span className="w-14 text-right text-[14px] font-semibold tabular-nums">{d.share}</span>
                </li>
              )
            })}
            <li className="flex items-center justify-between pt-3 text-[13px]">
              <span className="text-text-soft">Total</span>
              <span className="font-semibold tabular-nums">{total.toLocaleString('en-US')}</span>
            </li>
          </ul>
        </div>
      )}
    </ReportCard>
  )
}
