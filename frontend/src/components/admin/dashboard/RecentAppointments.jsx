import { Link } from 'react-router-dom'
import { ArrowRight, CalendarX, ChevronRight } from 'lucide-react'
import { STATUS_COLORS } from '../analytics/chartTheme'
import { formatShortDate } from '../../../utils/format'
import DashCard from './DashCard'
import { RowsSkeleton } from './DashboardSkeleton'

/** Appointment.date is the chosen calendar day at UTC midnight. */
const visitDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : '—')
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
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/80 bg-white px-2.5 py-1 text-[12px] font-medium text-text">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[status] }} aria-hidden="true" />
      {status}
    </span>
  )
}

export default function RecentAppointments({ appointments, loading, delay }) {
  const viewAll = (
    <Link to="/admin/appointments" className="group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary/50">
      View all <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )

  return (
    <DashCard title="Recent Appointments" subtitle="Latest booking requests" action={viewAll} bodyClass="" delay={delay}>
      {loading && !appointments ? (
        <RowsSkeleton />
      ) : !appointments?.length ? (
        <div className="flex flex-col items-center border-t border-border/60 px-6 py-12 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-canvas text-text-soft">
            <CalendarX className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[14px] font-semibold">No appointments yet</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-border/60 bg-canvas/60 text-[11px] uppercase tracking-wider text-text-soft">
                  <th scope="col" className="px-6 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Service</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Visit Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id} className="border-b border-border/40 transition-colors duration-200 last:border-0 hover:bg-canvas/70">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/70 text-[12px] font-semibold text-primary-dark">{initials(a.name)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium text-text">{a.name}</span>
                          <span className="block truncate text-[12px] text-text-soft">{a.phone}</span>
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5">
                      <span className="line-clamp-1 text-[13px] text-text-soft">{a.service}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-text-soft" title="Date received">
                      {formatShortDate(a.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-text">
                      {visitDate(a.date)}
                      {a.time && <span className="text-text-soft"> · {a.time}</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/admin/appointments?view=${a._id}`}
                        className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-secondary/50"
                        aria-label={`View appointment for ${a.name}`}
                      >
                        View <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="border-t border-border/60 md:hidden">
            {appointments.map((a) => (
              <li key={a._id} className="border-b border-border/40 last:border-0">
                <Link to={`/admin/appointments?view=${a._id}`} className="flex gap-3 px-5 py-4 transition-colors hover:bg-canvas/70">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/70 text-[12px] font-semibold text-primary-dark">{initials(a.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-[14px] font-medium text-text">{a.name}</span>
                      <StatusPill status={a.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-text-soft">{a.service}</span>
                    <span className="mt-1 block text-[12px] text-text">
                      Visit {visitDate(a.date)}
                      {a.time ? ` · ${a.time}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashCard>
  )
}
