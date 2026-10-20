import { RefreshCw } from 'lucide-react'

/** Greeting by the clinic's local time (Abu Dhabi). */
function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Dubai' }).format(new Date()))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardHeader({ refreshing, onRefresh }) {
  return (
    <header className="flex animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Dashboard</p>
        <h1 className="mt-2 font-serif text-[32px] leading-[1.1] text-text md:text-[40px]">
          {greeting()}.
        </h1>
        <p className="mt-2 text-[15px] text-text-soft">Here&apos;s what&apos;s happening at your clinic today.</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh dashboard data"
        className="group inline-flex h-11 items-center gap-2 self-start rounded-full border border-border bg-white px-5 text-[14px] font-semibold text-text transition-all duration-300 hover:-translate-y-0.5 hover:border-text/20 hover:shadow-[0_10px_24px_-16px_rgba(7,8,7,0.35)] disabled:translate-y-0 sm:self-auto"
      >
        <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-90'}`} aria-hidden="true" />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </header>
  )
}
