/* Skeleton placeholders for the dashboard. */
const block = 'animate-pulse rounded-full bg-border/60'

export function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-border/70 bg-white p-5">
          <div className="flex items-start justify-between">
            <div className={`${block} h-3 w-24`} />
            <div className="h-11 w-11 animate-pulse rounded-xl bg-border/50" />
          </div>
          <div className={`${block} mt-4 h-8 w-12`} />
          <div className={`${block} mt-3 h-3 w-32`} />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 280 }) {
  return (
    <div className="flex items-end gap-2" style={{ height }} aria-hidden="true">
      {[30, 55, 40, 70, 45, 80, 60, 50, 75, 35, 65, 55].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-border/45" style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  )
}

export function RowsSkeleton({ rows = 5 }) {
  return (
    <ul className="divide-y divide-border/60" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <div className="h-9 w-9 animate-pulse rounded-full bg-border/60" />
          <div className="flex-1 space-y-2">
            <div className={`${block} h-3 w-1/3`} />
            <div className={`${block} h-3 w-1/5`} />
          </div>
          <div className={`${block} h-6 w-20`} />
        </li>
      ))}
    </ul>
  )
}
