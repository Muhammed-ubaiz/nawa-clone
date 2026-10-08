import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { analyticsApi } from '../../services/api'
import { useServices } from '../../context/ServicesContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useLiveRefresh } from '../../hooks/useLiveRefresh'
import { useSEO } from '../../hooks/useSEO'
import ReportHeader from '../../components/admin/reports/ReportHeader'
import { PeriodDetails, PeriodSegments } from '../../components/admin/reports/ReportFilters'
import ReportDownloadMenu from '../../components/admin/reports/ReportDownloadMenu'
import ReportStats from '../../components/admin/reports/ReportStats'
import AppointmentStatusChart from '../../components/admin/reports/AppointmentStatusChart'
import AppointmentTrendChart from '../../components/admin/reports/AppointmentTrendChart'
import ServicePerformance from '../../components/admin/reports/ServicePerformance'
import RecentAppointments from '../../components/admin/reports/RecentAppointments'
import { StatsSkeleton } from '../../components/admin/reports/ReportSkeletons'
import { periodParams, useReportDownload } from '../../components/admin/reports/useReportDownload'

export default function Reports() {
  useSEO({ title: 'Appointment Reports', description: 'Appointment statistics and PDF reports' })
  const now = new Date()
  const { services: siteServices } = useServices()

  // Period
  const [period, setPeriod] = useState('all')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [custom, setCustom] = useState({ from: '', to: '' })

  // Table filters
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [status, setStatus] = useState('')
  const [service, setService] = useState('')
  const [page, setPage] = useState(1)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { download, busyKey } = useReportDownload()

  const waitingForCustom = period === 'custom' && !(custom.from && custom.to)

  const load = useCallback(() => {
    if (waitingForCustom) {
      setLoading(false)
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    analyticsApi
      .appointments(
        {
          ...periodParams(period, { month, year, ...custom }),
          search: debouncedSearch || undefined,
          status: status || undefined,
          service: service || undefined,
          page,
          limit: 10,
        },
        { signal: controller.signal },
      )
      .then((r) => setReport(r.data))
      .catch((err) => {
        if (!controller.signal.aborted && err?.name !== 'CanceledError') setError(err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return controller
  }, [period, month, year, custom, debouncedSearch, status, service, page, waitingForCustom])

  useEffect(() => {
    const controller = load()
    return () => controller?.abort()
  }, [load])

  // Live updates: silently refetch the current view so new bookings appear without a reload.
  useLiveRefresh(async () => {
    if (loading || waitingForCustom || busyKey) return
    try {
      const { data } = await analyticsApi.appointments({
        ...periodParams(period, { month, year, ...custom }),
        search: debouncedSearch || undefined,
        status: status || undefined,
        service: service || undefined,
        page,
        limit: 10,
      })
      setReport((prev) => (JSON.stringify(prev && { ...prev, generatedAt: 0 }) === JSON.stringify({ ...data, generatedAt: 0 }) ? prev : data))
    } catch {
      /* keep current data; next poll retries */
    }
  })

  // Any filter change returns to page 1.
  useEffect(() => setPage(1), [period, month, year, custom, debouncedSearch, status, service])

  const serviceOptions = useMemo(
    () => [...new Set([...siteServices.map((s) => s.name), ...(report?.services ?? []).map((s) => s.service)])].sort(),
    [siteServices, report?.services],
  )

  const periodLabel = waitingForCustom ? 'Custom range' : report?.range?.label || '…'
  const exportCurrent = () => download('current', periodParams(period, { month, year, ...custom }))

  return (
    // Full-bleed light canvas for this page only (offsets the admin layout padding).
    <div className="-mx-4 -my-8 min-h-[calc(100vh-72px)] bg-white px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-my-10 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <ReportHeader today={report?.range?.today} />

        {/* Action bar — raised above the cards below: the fade-up animation leaves a transform on every
            section, so each forms its own stacking context and later ones would paint over this menu. */}
        <div className="relative z-30 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PeriodSegments period={period} onChange={setPeriod} />
            <ReportDownloadMenu month={month} year={year} custom={custom} busyKey={busyKey} onDownload={download} />
          </div>
          <PeriodDetails period={period} month={month} year={year} custom={custom} onMonth={setMonth} onYear={setYear} onApplyCustom={setCustom} />
        </div>

        {error && !report ? (
          <div role="alert" className="animate-fade-up rounded-2xl border border-border/70 bg-white px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">Unable to load report data.</p>
            <p className="mt-1 text-[13px] text-text-soft">{error.message}</p>
            <button
              type="button"
              onClick={load}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-text px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" /> Try Again
            </button>
          </div>
        ) : (
          <>
            {report?.overview ? <ReportStats overview={report.overview} /> : <StatsSkeleton />}

            {error && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                <span>Unable to load report data. Showing the last loaded results.</span>
                <button type="button" onClick={load} className="font-semibold underline-offset-2 hover:underline">
                  Try Again
                </button>
              </div>
            )}

            <div className="grid gap-6 2xl:grid-cols-2">
              <AppointmentStatusChart stats={waitingForCustom ? null : report?.stats} periodLabel={periodLabel} loading={loading || waitingForCustom} delay={200} />
              <AppointmentTrendChart month={month} year={year} delay={260} />
            </div>

            <ServicePerformance services={waitingForCustom ? null : report?.services} periodLabel={periodLabel} loading={loading || waitingForCustom} delay={320} />

            <RecentAppointments
              report={report}
              loading={loading}
              period={period}
              onPeriod={setPeriod}
              search={search}
              onSearch={setSearch}
              status={status}
              onStatus={setStatus}
              service={service}
              onService={setService}
              serviceOptions={serviceOptions}
              page={page}
              onPage={setPage}
              waitingForCustom={waitingForCustom}
              onExport={exportCurrent}
              exporting={busyKey === 'current'}
              delay={440}
            />
          </>
        )}
      </div>
    </div>
  )
}
