import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarX, ChevronLeft, ChevronRight, Download, Loader2, Search, Stethoscope, X } from 'lucide-react'
import { STATUSES, STATUS_COLORS } from '../analytics/chartTheme'
import FilterDropdown from './FilterDropdown'
import { PERIODS } from './ReportFilters'
import { TableSkeleton } from './ReportSkeletons'

/** Appointment.date is the chosen calendar day at UTC midnight — format in UTC. */
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?'

function StatusPill({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-white px-2.5 py-1 text-[12px] font-medium text-text">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[status] }} aria-hidden="true" />
      {status}
    </span>
  )
}

/**
 * Appointment table for the selected period with search, period/status/service
 * filters, pagination and an "Export PDF" shortcut for the current period.
 */
export default function RecentAppointments({
  report,
  loading,
  period,
  onPeriod,
  search,
  onSearch,
  status,
  onStatus,
  service,
  onService,
  serviceOptions,
  page,
  onPage,
  waitingForCustom,
  onExport,
  exporting,
  delay,
}) {
  const records = report?.records ?? []
  const pg = report?.pagination ?? { page: 1, pages: 1, total: 0, limit: 20 }
  const from = pg.total ? (pg.page - 1) * pg.limit + 1 : 0
  const to = Math.min(pg.total, pg.page * pg.limit)
  const filtered = !!(search || status || service)

  return (
    <section
      aria-labelledby="recent-title"
      className="animate-fade-up overflow-hidden rounded-2xl border border-border/70 bg-white"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="recent-title" className="font-sans text-[16px] font-semibold tracking-tight">
            Recent Appointments
          </h2>
          <p className="mt-0.5 text-[13px] text-text-soft">
            {report?.range?.label || '—'} · {pg.total.toLocaleString('en-US')} {filtered ? 'matching' : 'total'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || waitingForCustom}
            className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[13px] font-semibold transition-colors hover:border-primary/40 hover:bg-canvas disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />}
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
          <Link
            to="/admin/appointments"
            className="group inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary/50"
          >
            View All
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Search + filters */}
      <div className="grid gap-2 px-5 pt-4 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <label className="relative block md:col-span-2 xl:col-span-1">
          <span className="sr-only">Search appointments</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search appointments..."
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-9 text-[13px] placeholder:text-text-soft/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-soft hover:bg-canvas hover:text-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </label>
        <FilterDropdown label="Period" value={period} onChange={onPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.long }))} />
        <FilterDropdown label="Status" value={status} onChange={onStatus} options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
        <FilterDropdown label="Service" value={service} onChange={onService} options={[{ value: '', label: 'All Services' }, ...serviceOptions.map((s) => ({ value: s, label: s }))]} align="right" />
      </div>

      <div className="mt-4">
        {waitingForCustom ? (
          <p className="border-t border-border/60 px-6 py-14 text-center text-[13px] text-text-soft">Choose a From Date and To Date above, then press Apply.</p>
        ) : loading && !report ? (
          <TableSkeleton />
        ) : !records.length ? (
          <div className="border-t border-border/60 px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-canvas text-text-soft">
              <CalendarX className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">No appointments found</p>
            <p className="mt-1 text-[13px] text-text-soft">{filtered ? 'Try a different search or filter.' : `Nothing is scheduled in ${report?.range?.label || 'this period'}.`}</p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
            {/* Desktop */}
            <table className="hidden w-full text-left md:table">
              <caption className="sr-only">Appointments — {report?.range?.label}</caption>
              <thead>
                <tr className="border-y border-border/60 bg-canvas/60 text-[11px] font-semibold uppercase tracking-wider text-text-soft">
                  <th scope="col" className="px-6 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Service</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Time</th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((a) => (
                  <tr key={a._id} className="border-b border-border/40 transition-colors duration-200 last:border-0 hover:bg-canvas/70">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/70 text-[12px] font-semibold text-primary-dark">{initials(a.name)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium">{a.name}</span>
                          <span className="block max-w-[260px] truncate text-[12px] text-text-soft">
                            {a.phone}
                            {a.email ? ` · ${a.email}` : ''}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5">
                      <span className="line-clamp-2 text-[13px] text-text-soft">{a.service}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[13px]">{fmtDate(a.date)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-text-soft">{a.time || '—'}</td>
                    <td className="px-6 py-3.5 text-right">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <ul className="border-t border-border/60 md:hidden">
              {records.map((a) => (
                <li key={a._id} className="flex gap-3 border-b border-border/40 px-5 py-4 last:border-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/70 text-[12px] font-semibold text-primary-dark">{initials(a.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[14px] font-medium">{a.name}</p>
                      <StatusPill status={a.status} />
                    </div>
                    <p className="truncate text-[12px] text-text-soft">{a.phone}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-text-soft">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{a.service}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium">
                      {fmtDate(a.date)}
                      {a.time ? ` · ${a.time}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-[12px] text-text-soft">
                Showing <span className="font-semibold text-text">{from.toLocaleString('en-US')}–{to.toLocaleString('en-US')}</span> of{' '}
                {pg.total.toLocaleString('en-US')}
              </p>
              {pg.pages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-colors hover:bg-canvas disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="px-3 text-[12px] font-medium tabular-nums">
                    {pg.page} / {pg.pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPage(page + 1)}
                    disabled={page >= pg.pages}
                    aria-label="Next page"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-colors hover:bg-canvas disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
