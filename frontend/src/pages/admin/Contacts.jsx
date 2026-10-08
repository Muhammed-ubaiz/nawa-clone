import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, Eye, Mail, MailOpen, Phone, Trash2 } from 'lucide-react'
import { contactsApi } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { useSEO } from '../../hooks/useSEO'
import { confirmDelete, toast } from '../../utils/alerts'
import { formatDateTime, formatShortDate } from '../../utils/format'
import { Card, IconButton, LoadingBlock, Modal, PageHeader, Pagination, SearchInput, Select, StatusBadge } from '../../components/admin/ui'
import { EmptyState, ErrorState } from '../../components/common/StatusMessage'

const refreshCounts = () => window.dispatchEvent(new Event('admin:refresh-counts'))

export default function Contacts() {
  useSEO({ title: 'Contacts', description: 'Contact form messages' })
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''

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
    contactsApi
      .list({ status: status || undefined, search: debounced || undefined, page, limit: 15 })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [status, debounced, page])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [status, debounced])

  const replaceItem = (c) => setResult((r) => ({ ...r, data: r.data.map((x) => (x._id === c._id ? c : x)) }))

  const setStatus = async (c, next, { silent = false } = {}) => {
    if (c.status === next) return c
    setBusyId(c._id)
    try {
      const { data } = await contactsApi.setStatus(c._id, next)
      replaceItem(data)
      if (!silent) toast.success(next === 'Read' ? 'Marked as read' : 'Marked as unread')
      refreshCounts()
      return data
    } catch (err) {
      toast.error(err.message)
      return c
    } finally {
      setBusyId(null)
    }
  }

  // Opening a message marks it as read.
  const open = async (c) => {
    setViewing(c)
    if (c.status === 'New') setViewing(await setStatus(c, 'Read', { silent: true }))
  }

  const remove = async (c) => {
    if (!(await confirmDelete('this message', `From ${c.name} (${c.email}).`))) return
    setBusyId(c._id)
    try {
      await contactsApi.remove(c._id)
      toast.success('Message deleted')
      if (viewing?._id === c._id) setViewing(null)
      if (result.data.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
      refreshCounts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const setFilter = (v) => {
    const next = new URLSearchParams(params)
    if (v) next.set('status', v)
    else next.delete('status')
    setParams(next, { replace: true })
  }

  const { data: items, pagination } = result

  const actions = (c) => (
    <div className="flex justify-end gap-1">
      <IconButton label={`View message from ${c.name}`} icon={Eye} tone="primary" onClick={() => open(c)} />
      <IconButton
        label={c.status === 'New' ? 'Mark as read' : 'Mark as unread'}
        icon={c.status === 'New' ? MailOpen : Mail}
        disabled={busyId === c._id}
        onClick={() => setStatus(c, c.status === 'New' ? 'Read' : 'New')}
      />
      <IconButton label={`Delete message from ${c.name}`} icon={Trash2} tone="danger" disabled={busyId === c._id} onClick={() => remove(c)} />
    </div>
  )

  return (
    <>
      <PageHeader title="Contacts" description="Messages sent through the website contact form." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:p-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone or message" className="flex-1" />
          <Select
            label="Filter by status"
            value={status}
            onChange={setFilter}
            options={[
              { value: '', label: 'All messages' },
              { value: 'New', label: 'Unread' },
              { value: 'Read', label: 'Read' },
            ]}
            className="sm:w-48"
          />
        </div>

        {loading && !items.length ? (
          <LoadingBlock label="Loading messages" />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error.message} onRetry={load} />
          </div>
        ) : !items.length ? (
          <div className="p-6">
            <EmptyState
              title={search || status ? 'No matching messages' : 'No messages yet'}
              message={search || status ? 'Try a different search or filter.' : 'Messages from the contact page will appear here.'}
            />
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-muted/60 text-[12px] uppercase tracking-wider text-text-soft">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">Name</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((c) => (
                    <tr key={c._id} className={`transition hover:bg-muted/40 ${c.status === 'New' ? 'bg-accent/[0.03]' : ''}`}>
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => open(c)} className={`text-left hover:text-primary ${c.status === 'New' ? 'font-bold' : 'font-semibold'}`}>
                          {c.name}
                        </button>
                        <p className="max-w-[280px] truncate text-[12px] text-text-soft">{c.message}</p>
                      </td>
                      <td className="px-4 py-4">
                        <a href={`mailto:${c.email}`} className="hover:text-primary">
                          {c.email}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">{c.phone || '—'}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-text-soft">{formatShortDate(c.createdAt)}</td>
                      <td className="px-6 py-4">{actions(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {items.map((c) => (
                <li key={c._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => open(c)} className="min-w-0 text-left">
                      <p className={`truncate text-[15px] ${c.status === 'New' ? 'font-bold' : 'font-semibold'}`}>{c.name}</p>
                      <p className="truncate text-[13px] text-text-soft">{c.email}</p>
                    </button>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] text-text-soft">{c.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[12px] text-text-soft">{formatShortDate(c.createdAt)}</span>
                    {actions(c)}
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
        onClose={() => setViewing(null)}
        title={viewing ? `Message from ${viewing.name}` : 'Message'}
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
              <a
                href={`mailto:${viewing.email}?subject=${encodeURIComponent('Re: Your message to Nawa Ayurveda')}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold leading-none text-white hover:bg-primary-dark"
              >
                <Mail className="h-4 w-4" aria-hidden="true" /> Reply by email
              </a>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
              <a href={`mailto:${viewing.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                {viewing.email}
              </a>
              {viewing.phone && (
                <a href={`tel:${viewing.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                  {viewing.phone}
                </a>
              )}
            </div>
            <p className="whitespace-pre-line rounded-2xl bg-muted p-5 text-[15px] leading-relaxed">{viewing.message}</p>
            <div className="flex items-center justify-between gap-3 text-[12px] text-text-soft">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDateTime(viewing.createdAt)}
              </span>
              <StatusBadge status={viewing.status} />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
