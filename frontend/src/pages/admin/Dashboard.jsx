import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Hourglass,
  Inbox,
  Mail,
  MailOpen,
  NotebookPen,
  RefreshCw,
} from 'lucide-react'
import { analyticsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { useSEO } from '../../hooks/useSEO'
import { toast } from '../../utils/alerts'
import { formatDateTime, formatShortDate } from '../../utils/format'
import Button from '../../components/common/Button'
import { Card, LoadingBlock, PageHeader, StatCard, StatusBadge } from '../../components/admin/ui'
import { ErrorState } from '../../components/common/StatusMessage'
import PeriodFilter from '../../components/admin/analytics/PeriodFilter'
import AppointmentsChart from '../../components/admin/analytics/AppointmentsChart'
import StatusDonut from '../../components/admin/analytics/StatusDonut'
import ServicesChart from '../../components/admin/analytics/ServicesChart'

const PERIOD_TITLES = {
  today: "Today's Analytics",
  week: 'Weekly Overview',
  month: 'Monthly Overview',
  year: 'Yearly Overview',
  custom: 'Custom Range',
}

/** Reads the dashboard filter from the URL (so views can be bookmarked and shared). */
function useFilter() {
  const [params, setParams] = useSearchParams()
  const now = new Date()
  const filter = {
    period: params.get('period') || 'month',
    month: Number(params.get('month')) || now.getMonth() + 1,
    year: Number(params.get('year')) || now.getFullYear(),
    from: params.get('from') || '',
    to: params.get('to') || '',
    basis: params.get('basis') === 'scheduled' ? 'scheduled' : 'created',
  }

  const update = (patch) => {
    const next = { ...filter, ...patch }
    const p = new URLSearchParams()
    p.set('period', next.period)
    if (next.period === 'month') {
      p.set('month', next.month)
      p.set('year', next.year)
    }
    if (next.period === 'year') p.set('year', next.year)
    if (next.period === 'custom') {
      if (next.from) p.set('from', next.from)
      if (next.to) p.set('to', next.to)
    }
    if (next.basis === 'scheduled') p.set('basis', 'scheduled')
    setParams(p, { replace: true })
  }

  const reset = () => update({ month: now.getMonth() + 1, year: now.getFullYear(), from: '', to: '', ...(filter.period === 'custom' ? { period: 'month' } : {}) })

  return { filter, update, reset }
}

function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-sans text-[17px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-text-soft">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  )
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] text-text-soft">{label}</p>
        <p className="font-serif text-[26px] leading-none">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  useSEO({ title: 'Dashboard', description: 'Admin analytics dashboard' })
  const { filter, update, reset } = useFilter()
  const [downloading, setDownloading] = useState(false)

  const customIncomplete = filter.period === 'custom' && (!filter.from || !filter.to)
  const filterKey = JSON.stringify(filter)

  const overview = useApi((signal) => analyticsApi.overview({ signal }).then((r) => r.data), [])
  const summary = useApi(
    (signal) => (customIncomplete ? Promise.resolve(null) : analyticsApi.summary(filter, { signal }).then((r) => r.data)),
    [filterKey],
  )

  const s = summary.data
  const o = overview.data

  const periodCards = useMemo(() => {
    if (!s) return []
    const a = s.appointments
    return [
      { label: 'Total Appointments', value: a.total, icon: CalendarCheck, tone: 'teal' },
      { label: 'Pending', value: a.Pending, icon: Hourglass, tone: 'amber' },
      { label: 'Confirmed', value: a.Confirmed, icon: CalendarClock, tone: 'primary' },
      { label: 'Completed', value: a.Completed, icon: CheckCircle2, tone: 'green' },
      { label: 'Cancelled', value: a.Cancelled, icon: Ban, tone: 'olive' },
      { label: 'Contacts', value: s.contacts.total, icon: Mail, tone: 'gold', hint: `${s.contacts.unread} unread` },
      { label: 'New Blogs', value: s.blogs.created, icon: FileText, tone: 'primary', hint: `${s.blogs.published} published` },
    ]
  }, [s])

  const download = async () => {
    setDownloading(true)
    try {
      const name = await analyticsApi.downloadReport(filter)
      toast.success(`Downloaded ${name}`)
    } catch (err) {
      toast.error(err.message || 'Could not generate the report.')
    } finally {
      setDownloading(false)
    }
  }

  const refresh = () => {
    overview.reload()
    summary.reload()
  }

  const basisNote = filter.basis === 'scheduled' ? 'by preferred visit date' : 'by date received'

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live analytics from bookings, messages and articles."
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-[14px] font-semibold leading-none transition hover:bg-muted"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${summary.loading || overview.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Button variant="dark" size="sm" iconLeft={Download} loading={downloading} disabled={customIncomplete} onClick={download}>
              {downloading ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          </>
        }
      />

      {/* TODAY */}
      <section aria-labelledby="today-title" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="today-title" className="font-serif text-[26px] leading-tight">Today&apos;s Overview</h2>
            <p className="text-[13px] text-text-soft">{o?.today.label || 'Today'} &middot; requests received today</p>
          </div>
          {o && (
            <p className="rounded-full bg-white px-4 py-2 text-[13px] ring-1 ring-border/70">
              <span className="font-semibold">{o.today.scheduled.total}</span> visit{o.today.scheduled.total === 1 ? '' : 's'} scheduled for today
            </p>
          )}
        </div>
        {overview.loading && !o ? (
          <Card>
            <LoadingBlock label="Loading today" />
          </Card>
        ) : overview.error ? (
          <ErrorState message={overview.error.message} onRetry={overview.reload} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Today's Appointments" value={o.today.received.total} icon={CalendarCheck} tone="teal" />
            <StatCard label="Today's Confirmed" value={o.today.received.Confirmed} icon={CalendarClock} tone="primary" />
            <StatCard label="Today's Pending" value={o.today.received.Pending} icon={Hourglass} tone="amber" />
            <StatCard label="Today's Completed" value={o.today.received.Completed} icon={CheckCircle2} tone="green" />
            <StatCard label="Today's Cancelled" value={o.today.received.Cancelled} icon={Ban} tone="olive" />
            <StatCard label="Today's Contacts" value={o.today.contacts} icon={Mail} tone="gold" />
          </div>
        )}
      </section>

      {/* PERIOD ANALYTICS */}
      <section aria-labelledby="period-title" className="space-y-6">
        <div className="space-y-4 rounded-[28px] bg-white/60 p-4 ring-1 ring-border/60 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="period-title" className="font-serif text-[26px] leading-tight">{PERIOD_TITLES[filter.period]}</h2>
              <p className="text-[13px] text-text-soft">
                {customIncomplete ? 'Choose a date range and apply the filter.' : s ? `${s.range.label} · appointments ${basisNote}` : 'Loading…'}
              </p>
            </div>
          </div>
          <PeriodFilter filter={filter} onChange={update} onReset={reset} />
        </div>

        {customIncomplete ? (
          <Card className="px-6 py-14 text-center text-[14px] text-text-soft">Select a From and To date above, then press Apply Filter.</Card>
        ) : summary.error ? (
          <ErrorState message={summary.error.message} onRetry={summary.reload} />
        ) : !s ? (
          <Card>
            <LoadingBlock label="Loading analytics" />
          </Card>
        ) : (
          <div className={`space-y-6 transition-opacity duration-300 ${summary.loading ? 'opacity-60' : ''}`} aria-busy={summary.loading}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
              {periodCards.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <SectionCard
                title="Appointments Overview"
                description={`Appointments per ${s.timeline.granularity} · ${s.range.label}`}
              >
                <AppointmentsChart timeline={s.timeline} />
              </SectionCard>
              <SectionCard title="Appointment Status" description={s.range.label}>
                <StatusDonut counts={s.appointments} />
              </SectionCard>
            </div>

            <SectionCard title="Most Requested Services" description={`Appointment requests per service · ${s.range.label}`}>
              <ServicesChart services={s.services} />
            </SectionCard>
          </div>
        )}
      </section>

      {/* CONTACT & BLOG ANALYTICS */}
      {o && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Contact Analytics"
            action={
              <Link to="/admin/contacts" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                Messages <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat label="Today's Contacts" value={o.contacts.today} icon={Mail} />
              <MiniStat label="This Month" value={o.contacts.month} icon={Mail} />
              <MiniStat label="This Year" value={o.contacts.year} icon={Mail} />
              <MiniStat label="Total Contacts" value={o.contacts.total} icon={Inbox} />
              <MiniStat label="Unread" value={o.contacts.unread} icon={Mail} />
              <MiniStat label="Read" value={o.contacts.read} icon={MailOpen} />
            </div>
          </SectionCard>
          <SectionCard
            title="Blog Analytics"
            action={
              <Link to="/admin/blogs" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                Articles <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat label="Total Blogs" value={o.blogs.total} icon={FileText} />
              <MiniStat label="Published" value={o.blogs.published} icon={CheckCircle2} />
              <MiniStat label="Drafts" value={o.blogs.drafts} icon={NotebookPen} />
              <MiniStat label="Created This Month" value={o.blogs.month} icon={CalendarClock} />
              <MiniStat label="Created This Year" value={o.blogs.year} icon={CalendarCheck} />
            </div>
          </SectionCard>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      {o && (
        <div className="mt-6 grid gap-6 2xl:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-sans text-[17px] font-semibold">Recent Appointments</h2>
              <Link to="/admin/appointments" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {o.recentAppointments.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-text-soft">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Name</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Service</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Date</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Time</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {o.recentAppointments.map((a) => (
                        <tr key={a._id} className="transition hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <Link to={`/admin/appointments?view=${a._id}`} className="font-semibold hover:text-primary">
                              {a.name}
                            </Link>
                          </td>
                          <td className="max-w-[180px] truncate px-3 py-3">{a.service}</td>
                          <td className="whitespace-nowrap px-3 py-3">{formatShortDate(a.date)}</td>
                          <td className="whitespace-nowrap px-3 py-3">{a.time || '—'}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-text-soft">{formatDateTime(a.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-border md:hidden">
                  {o.recentAppointments.map((a) => (
                    <li key={a._id}>
                      <Link to={`/admin/appointments?view=${a._id}`} className="flex items-center gap-3 px-5 py-3.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{a.name}</span>
                          <span className="block truncate text-[12px] text-text-soft">
                            {a.service} &middot; {formatShortDate(a.date)}
                            {a.time ? `, ${a.time}` : ''}
                          </span>
                        </span>
                        <StatusBadge status={a.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-6 py-10 text-center text-[14px] text-text-soft">No appointments yet.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-sans text-[17px] font-semibold">Recent Contacts</h2>
              <Link to="/admin/contacts" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {o.recentContacts.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-text-soft">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Name</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Email</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Phone</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Message</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {o.recentContacts.map((c) => (
                        <tr key={c._id} className="transition hover:bg-muted/40">
                          <td className={`px-5 py-3 ${c.status === 'New' ? 'font-bold' : 'font-semibold'}`}>{c.name}</td>
                          <td className="max-w-[180px] truncate px-3 py-3">
                            <a href={`mailto:${c.email}`} className="hover:text-primary">
                              {c.email}
                            </a>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">{c.phone || '—'}</td>
                          <td className="max-w-[220px] truncate px-3 py-3 text-text-soft">{c.message}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-text-soft">{formatShortDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-border md:hidden">
                  {o.recentContacts.map((c) => (
                    <li key={c._id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`truncate text-[14px] ${c.status === 'New' ? 'font-bold' : 'font-semibold'}`}>{c.name}</p>
                          <p className="truncate text-[12px] text-text-soft">{c.email}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] text-text-soft">{c.message}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-6 py-10 text-center text-[14px] text-text-soft">No messages yet.</p>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
