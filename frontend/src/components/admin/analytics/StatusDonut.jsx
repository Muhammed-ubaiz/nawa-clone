import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUSES, STATUS_COLORS, pct } from './chartTheme'

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, share } = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] shadow-lg">
      <span className="font-semibold">{name}</span>: {value} ({share})
    </div>
  )
}

/** Donut of appointment statuses with the total in the centre and a labelled legend. */
export default function StatusDonut({ counts }) {
  const total = counts?.total ?? 0
  const data = STATUSES.map((s) => ({ name: s, value: counts?.[s] ?? 0, share: pct(counts?.[s] ?? 0, total) }))

  return (
    <div>
      <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
        {total ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="64%"
                outerRadius="92%"
                paddingAngle={data.filter((d) => d.value).length > 1 ? 2 : 0}
                stroke="#ffffff"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                animationDuration={700}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 m-auto aspect-square h-full rounded-full border-[18px] border-muted" aria-hidden="true" />
        )}
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif text-[36px] leading-none">{total}</p>
            <p className="mt-1 text-[12px] text-text-soft">appointments</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLORS[d.name] }} aria-hidden="true" />
              {d.name}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold">{d.value}</span>
              <span className="ml-2 inline-block w-12 text-right text-text-soft">{d.share}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
