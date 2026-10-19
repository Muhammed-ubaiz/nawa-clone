import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Clock, Eye, Mail, MessageSquare, Phone, Sparkles, Trash2 } from 'lucide-react'
import { appointmentsApi } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { useSEO } from '../../hooks/useSEO'
import { confirmDelete, toast } from '../../utils/alerts'
import { formatDateTime, formatShortDate } from '../../utils/format'
import { Card, IconButton, LoadingBlock, Modal, PageHeader, Pagination, SearchInput, Select, StatusBadge } from '../../components/admin/ui'
import { EmptyState, ErrorState } from '../../components/common/StatusMessage'

const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
const refreshCounts = () => window.dispatchEvent(new Event('admin:refresh-counts'))

function StatusSelect({ value, onChange, disabled, id }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Change status"
      className="cursor-pointer rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-semibold focus:border-primary focus:outline-none disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] text-text-soft">{label}</p>
        <div className="break-words text-[14px] font-medium">{children || '—'}</div>
      </div>
    </div>
  )
}

export default function Appointments() {
  useSEO({ title: 'Appointments', description: 'Manage appointments' })
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const viewId = params.get('view')

  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [viewing, setViewing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    appointmentsApi
      .list({ status: status || undefined, search: debounced || undefined, page, limit: 15 })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [status, debounced, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => setPage(1), [status, debounced])

  // Open the detail modal from ?view=<id> (used by dashboard links).
  useEffect(() => {
    if (!viewId) return setViewing(null)
    appointmentsApi
      .get(viewId)
      .then((r) => setViewing(r.data))
      .catch((err) => {
        toast.error(err.message)
        closeView()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const openView = (id) => setParam('view', id)
  const closeView = () => setParam('view', '')

  const changeStatus = async (appt, next) => {
    if (next === appt.status) return
    setBusyId(appt._id)
    try {
      const { data } = await appointmentsApi.update(appt._id, { status: next })
      setResult((r) => ({ ...r, data: r.data.map((a) => (a._id === data._id ? data : a)) }))
      if (viewing?._id === data._id) setViewing(data)
      toast.success(`Marked as ${next}`)
      refreshCounts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (appt) => {
    if (!(await confirmDelete('this appointment', `${appt.name} — ${appt.service}. This cannot be undone.`))) return
    setBusyId(appt._id)
    try {
      await appointmentsApi.remove(appt._id)
      toast.success('Appointment deleted')
      if (viewing?._id === appt._id) closeView()
      if (result.data.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
      refreshCounts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const { data: items, pagination } = result

  return (
    <>
      <PageHeader title="Appointments" description="Search, review and update booking requests." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:p-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone, email or service" className="flex-1" />
          <Select
            label="Filter by status"
            value={status}
            onChange={(v) => setParam('status', v)}
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
            className="sm:w-52"
          />
        </div>

        {loading && !items.length ? (
          <LoadingBlock label="Loading appointments" />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error.message} onRetry={load} />
          </div>
        ) : !items.length ? (
          <div className="p-6">
            <EmptyState
              title={search || status ? 'No matching appointments' : 'No appointments yet'}
              message={search || status ? 'Try a different search or status filter.' : 'Bookings made on the website will appear here.'}
            />
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-muted/60 text-[12px] uppercase tracking-wider text-text-soft">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">Name</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Time</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((a) => (
                    <tr key={a._id} className="transition hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => openView(a._id)} className="text-left font-semibold hover:text-primary">
                          {a.name}
                        </button>
                        {a.email && <p className="max-w-[220px] truncate text-[12px] text-text-soft">{a.email}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                          {a.phone}
                        </a>
                      </td>
                      <td className="max-w-[200px] px-4 py-4">
                        <span className="line-clamp-2">{a.service}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">{formatShortDate(a.date)}</td>
                      <td className="whitespace-nowrap px-4 py-4">{a.time || '—'}</td>
                      <td className="px-4 py-4">
                        <StatusSelect value={a.status} disabled={busyId === a._id} onChange={(v) => changeStatus(a, v)} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <IconButton label={`View ${a.name}`} icon={Eye} tone="primary" onClick={() => openView(a._id)} />
                          <IconButton label={`Delete ${a.name}`} icon={Trash2} tone="danger" disabled={busyId === a._id} onClick={() => remove(a)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {items.map((a) => (
                <li key={a._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => openView(a._id)} className="min-w-0 text-left">
                      <p className="truncate text-[15px] font-semibold">{a.name}</p>
                      <p className="truncate text-[13px] text-text-soft">{a.service}</p>
                    </button>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatShortDate(a.date)}
                      {a.time ? `, ${a.time}` : ''}
                    </span>
                    <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {a.phone}
                    </a>
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusSelect value={a.status} disabled={busyId === a._id} onChange={(v) => changeStatus(a, v)} />
                    <div className="flex gap-1">
                      <IconButton label={`View ${a.name}`} icon={Eye} tone="primary" onClick={() => openView(a._id)} />
                      <IconButton label={`Delete ${a.name}`} icon={Trash2} tone="danger" disabled={busyId === a._id} onClick={() => remove(a)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPage={setPage} />
          </div>
        )}
      </Card>

      <Modal
        open={!!viewing}
        onClose={closeView}
        title={viewing?.name || 'Appointment'}
        footer={
          viewing && (
            <>
              <button
                type="button"
                onClick={() => remove(viewing)}
                className="mr-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </button>
              <button type="button" onClick={closeView} className="rounded-full bg-primary px-6 py-3 text-[14px] font-semibold leading-none text-white hover:bg-primary-dark">
                Done
              </button>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted p-4">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-text-soft">Status</span>
                <StatusBadge status={viewing.status} />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-text-soft">
                Change to
                <StatusSelect value={viewing.status} disabled={busyId === viewing._id} onChange={(v) => changeStatus(viewing, v)} />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailRow icon={Phone} label="Phone">
                <a href={`tel:${viewing.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                  {viewing.phone}
                </a>
              </DetailRow>
              <DetailRow icon={Mail} label="Email">
                {viewing.email && (
                  <a href={`mailto:${viewing.email}`} className="hover:text-primary">
                    {viewing.email}
                  </a>
                )}
              </DetailRow>
              <DetailRow icon={Sparkles} label="Service">{viewing.service}</DetailRow>
              <DetailRow icon={CalendarDays} label="Preferred date & time">
                {formatShortDate(viewing.date)}
                {viewing.time ? ` · ${viewing.time}` : ''}
              </DetailRow>
            </div>
            <DetailRow icon={MessageSquare} label="Message">
              {viewing.message && <p className="whitespace-pre-line font-normal text-text-soft">{viewing.message}</p>}
            </DetailRow>
            <p className="flex items-center gap-2 border-t border-border pt-4 text-[12px] text-text-soft">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Requested {formatDateTime(viewing.createdAt)}
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
