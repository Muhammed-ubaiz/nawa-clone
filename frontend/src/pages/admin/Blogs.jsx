import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { blogsApi } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { useSEO } from '../../hooks/useSEO'
import { confirmDelete, toast } from '../../utils/alerts'
import { formatShortDate, mediaUrl } from '../../utils/format'
import { Card, IconButton, LoadingBlock, PageHeader, Pagination, SearchInput, StatusBadge } from '../../components/admin/ui'
import { EmptyState, ErrorState } from '../../components/common/StatusMessage'

export default function Blogs() {
  useSEO({ title: 'Blogs', description: 'Manage blog articles' })
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    blogsApi
      .list({ all: true, search: debounced || undefined, page, limit: 15 })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [debounced, page])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [debounced])

  const togglePublish = async (b) => {
    setBusyId(b._id)
    try {
      const { data } = await blogsApi.setPublished(b._id, !b.published)
      setResult((r) => ({ ...r, data: r.data.map((x) => (x._id === data._id ? { ...x, published: data.published } : x)) }))
      toast.success(data.published ? 'Article published' : 'Article moved to drafts')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (b) => {
    if (!(await confirmDelete('this article', `"${b.title}" and its featured image will be removed permanently.`))) return
    setBusyId(b._id)
    try {
      await blogsApi.remove(b._id)
      toast.success('Article deleted')
      if (result.data.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const { data: items, pagination } = result

  const actions = (b) => (
    <div className="flex justify-end gap-1">
      {b.published && (
        <a
          href={`/blog/${b.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${b.title} on the website`}
          title="View on website"
          className="grid h-9 w-9 place-items-center rounded-full text-text-soft transition hover:bg-muted hover:text-text"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      <IconButton
        label={b.published ? `Unpublish ${b.title}` : `Publish ${b.title}`}
        icon={b.published ? EyeOff : Eye}
        tone="primary"
        disabled={busyId === b._id}
        onClick={() => togglePublish(b)}
      />
      <Link
        to={`/admin/blogs/edit/${b._id}`}
        aria-label={`Edit ${b.title}`}
        title="Edit"
        className="grid h-9 w-9 place-items-center rounded-full text-text-soft transition hover:bg-secondary hover:text-primary"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <IconButton label={`Delete ${b.title}`} icon={Trash2} tone="danger" disabled={busyId === b._id} onClick={() => remove(b)} />
    </div>
  )

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Create, edit and publish Wellness Wisdom articles."
        actions={
          <Link
            to="/admin/blogs/add"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold leading-none text-white transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Blog
          </Link>
        }
      />

      <Card>
        <div className="border-b border-border p-4 sm:p-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title" className="sm:max-w-md" />
        </div>

        {loading && !items.length ? (
          <LoadingBlock label="Loading articles" />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error.message} onRetry={load} />
          </div>
        ) : !items.length ? (
          <div className="p-6">
            <EmptyState
              title={search ? 'No matching articles' : 'No articles yet'}
              message={search ? 'Try a different search.' : 'Write your first article to share wellness tips.'}
              action={
                !search && (
                  <Link to="/admin/blogs/add" className="inline-flex rounded-full bg-primary px-5 py-3 text-[14px] font-semibold leading-none text-white">
                    Add Blog
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-muted/60 text-[12px] uppercase tracking-wider text-text-soft">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">Title</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Author</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((b) => (
                    <tr key={b._id} className="transition hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {b.featuredImage ? (
                            <img src={mediaUrl(b.featuredImage)} alt="" loading="lazy" className="h-11 w-14 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <span className="h-11 w-14 shrink-0 rounded-xl bg-muted" />
                          )}
                          <Link to={`/admin/blogs/edit/${b._id}`} className="line-clamp-2 max-w-[340px] font-semibold hover:text-primary">
                            {b.title}
                          </Link>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">{b.category || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-text-soft">{b.author || '—'}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.published ? 'Published' : 'Draft'} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-text-soft">{formatShortDate(b.createdAt)}</td>
                      <td className="px-6 py-4">{actions(b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {items.map((b) => (
                <li key={b._id} className="flex gap-3 p-4">
                  {b.featuredImage ? (
                    <img src={mediaUrl(b.featuredImage)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/blogs/edit/${b._id}`} className="line-clamp-2 text-[14px] font-semibold">
                      {b.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-text-soft">
                      {b.category} &middot; {formatShortDate(b.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={b.published ? 'Published' : 'Draft'} />
                      {actions(b)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPage={setPage} />
          </div>
        )}
      </Card>
    </>
  )
}
