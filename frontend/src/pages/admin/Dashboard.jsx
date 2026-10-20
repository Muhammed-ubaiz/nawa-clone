import { useState } from 'react'
import { analyticsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { useLiveRefresh } from '../../hooks/useLiveRefresh'
import { useSEO } from '../../hooks/useSEO'
import DashboardHeader from '../../components/admin/dashboard/DashboardHeader'
import DashboardMetrics from '../../components/admin/dashboard/DashboardMetrics'
import AppointmentActivity, { ACTIVITY_RANGES, mergeActivity } from '../../components/admin/dashboard/AppointmentActivity'
import AppointmentStatus from '../../components/admin/dashboard/AppointmentStatus'
import RecentAppointments from '../../components/admin/dashboard/RecentAppointments'
import QuickInsights from '../../components/admin/dashboard/QuickInsights'
import PopularServices from '../../components/admin/dashboard/PopularServices'
import { ContentOverview, RecentMessages } from '../../components/admin/dashboard/ContentOverview'
import { InlineError } from '../../components/admin/dashboard/DashCard'
import { MetricsSkeleton } from '../../components/admin/dashboard/DashboardSkeleton'

/**
 * Quick overview of the clinic. Detailed filters, date ranges and PDF reports
 * live on /admin/reports. All figures come from existing analytics endpoints.
 */
export default function Dashboard() {
  useSEO({ title: 'Dashboard', description: 'Admin dashboard' })
  const [range, setRange] = useState('week')

  // Today's figures, contact/blog analytics and recent activity.
  const overview = useApi((signal) => analyticsApi.overview({ signal }).then((r) => r.data), [])

  // Activity for the selected range: requests received vs visits scheduled.
  const activity = useApi(
    (signal) =>
      Promise.all([
        analyticsApi.summary({ period: range, basis: 'created' }, { signal }),
        analyticsApi.summary({ period: range, basis: 'scheduled' }, { signal }),
      ]).then(([received, scheduled]) => ({
        label: received.data.range.label,
        rows: mergeActivity(received.data, scheduled.data),
        counts: received.data.appointments,
        services: received.data.services,
      })),
    [range],
  )

  // This month's requests (quick insight).
  const month = useApi((signal) => analyticsApi.summary({ period: 'month', basis: 'created' }, { signal }).then((r) => r.data.appointments.total), [])

  // Live updates: new bookings appear without a page reload (silent background refetch).
  useLiveRefresh(() => Promise.all([overview.refresh(), activity.refresh(), month.refresh()]), { topics: ['appointments', 'contacts'] })

  const refreshing = overview.loading || activity.loading || month.loading
  const refresh = () => {
    overview.reload()
    activity.reload()
    month.reload()
  }

  const o = overview.data
  const rangeLabel = ACTIVITY_RANGES.find((r) => r.value === range)?.label

  return (
    // Light canvas for this page (offsets the admin layout padding).
    <div className="-mx-4 -my-8 min-h-[calc(100vh-72px)] bg-white px-4 py-8 [color-scheme:light] sm:-mx-6 sm:px-6 sm:py-6 md:py-8 lg:-mx-10 lg:-my-10 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <DashboardHeader refreshing={refreshing && !!o} onRefresh={refresh} />

        {/* Key metrics */}
        <section aria-label="Today's key metrics">
          {overview.error && !o ? (
            <InlineError onRetry={overview.reload} />
          ) : !o ? (
            <MetricsSkeleton />
          ) : (
            <DashboardMetrics today={o.today} />
          )}
        </section>

        {/* Activity + status */}
        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <AppointmentActivity
            range={range}
            onRange={setRange}
            data={activity.data}
            loading={activity.loading}
            error={activity.error && !activity.data}
            onRetry={activity.reload}
            delay={200}
          />
          <AppointmentStatus
            counts={activity.data?.counts}
            label={activity.data?.label || rangeLabel}
            loading={activity.loading}
            error={activity.error && !activity.data}
            onRetry={activity.reload}
            delay={260}
          />
        </div>

        <RecentAppointments appointments={o?.recentAppointments} loading={overview.loading} delay={320} />

        {o && <QuickInsights overview={o} monthAppointments={month.data} delay={380} />}

        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <PopularServices services={activity.data?.services} label={activity.data?.label} loading={activity.loading} delay={440} />
          {o && <ContentOverview blogs={o.blogs} delay={480} />}
          {o && <RecentMessages contacts={o.recentContacts} unread={o.contacts.unread} delay={520} />}
        </div>
      </div>
    </div>
  )
}
