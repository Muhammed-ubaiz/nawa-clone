import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, SERIES_COLOR } from './chartTheme'

function ServiceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] shadow-lg">
      <p className="font-semibold">{s.service}</p>
      <p className="text-text-soft">
        {s.total} requests &middot; {s.share}% of all &middot; {s.completed} completed
      </p>
    </div>
  )
}

/** Horizontal bars (single hue) plus a ranked list of the most requested services. */
export default function ServicesChart({ services = [] }) {
  if (!services.length) {
    return <div className="grid h-[220px] place-items-center rounded-2xl bg-muted/60 text-[14px] text-text-soft">No service requests in this period.</div>
  }

  const top = services.slice(0, 8)
  const height = Math.max(160, top.length * 44)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div style={{ height }} className="w-full" role="img" aria-label={`Most requested services. Top: ${top[0].service} with ${top[0].total} requests.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid horizontal={false} stroke={AXIS.grid} />
            <XAxis type="number" allowDecimals={false} tick={AXIS.tick} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="service"
              width={150}
              tick={{ ...AXIS.tick, fill: '#070807' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
            />
            <Tooltip content={<ServiceTooltip />} cursor={{ fill: 'rgba(65,117,114,0.06)' }} />
            <Bar dataKey="total" fill={SERIES_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} animationDuration={700}>
              <LabelList dataKey="total" position="right" style={{ fill: '#070807', fontSize: 12, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ol className="divide-y divide-border">
        {services.map((s, i) => (
          <li key={s.service} className="flex items-center gap-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-bold text-primary">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{s.service}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (s.total / services[0].total) * 100)}%` }} />
              </div>
            </div>
            <span className="text-right text-[13px] tabular-nums">
              <span className="block font-semibold">{s.total}</span>
              <span className="text-[12px] text-text-soft">{s.share}%</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
