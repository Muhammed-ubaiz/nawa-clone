/* Skeleton placeholders shown while report data loads. */
const bar = 'animate-pulse rounded-full bg-border/60'

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/70 bg-white p-5">
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} mt-5 h-8 w-20`} />
          <div className={`${bar} mt-4 h-3 w-40`} />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 260 }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }} aria-hidden="true">
      {[45, 70, 35, 85, 55, 65, 40, 75, 50, 60, 30, 80].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-md bg-border/50" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <ul className="divide-y divide-border/60" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-border/60" />
          <div className="flex-1 space-y-2">
            <div className={`${bar} h-3 w-1/3`} />
            <div className={`${bar} h-3 w-1/4`} />
          </div>
          <div className={`${bar} hidden h-3 w-24 md:block`} />
          <div className={`${bar} h-6 w-20`} />
        </li>
      ))}
    </ul>
  )
}
