import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { servicesApi } from '../../services/api'
import { useServices } from '../../context/ServicesContext'
import { useSEO } from '../../hooks/useSEO'
import { confirmDelete, showConfirm, toast, withLoading } from '../../utils/alerts'
import { mediaUrl } from '../../utils/format'
import ServiceForm from '../../components/admin/ServiceForm'
import { Card, IconButton, LoadingBlock, Modal, PageHeader, StatusBadge } from '../../components/admin/ui'
import { EmptyState, ErrorState } from '../../components/common/StatusMessage'

export default function AdminServices() {
  useSEO({ title: 'Services', description: 'Manage services' })
  const { refresh: refreshPublic } = useServices()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | service

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    servicesApi
      .list({ all: true })
      .then((r) => setItems(r.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const afterChange = () => {
    load()
    refreshPublic() // keep the website menu in sync
  }

  const save = async (payload) => {
    try {
      if (editing === 'new') {
        await withLoading(() => servicesApi.create(payload), { title: 'Creating service…' })
        toast.success('Service created')
      } else {
        await withLoading(() => servicesApi.update(editing._id, payload), { title: 'Saving changes…' })
        toast.success('Service updated')
      }
      setEditing(null)
      afterChange()
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  const togglePublish = async (s) => {
    // Hiding a live service removes it from the menu and booking form, so confirm first.
    if (s.published) {
      const ok = await showConfirm({
        title: 'Hide this service?',
        text: `"${s.name}" will be removed from the website menu, service pages and booking form until you publish it again.`,
        confirmText: 'Yes, hide it',
      })
      if (!ok) return
    }
    setBusyId(s._id)
    try {
      await servicesApi.setPublished(s._id, !s.published)
      toast.success(s.published ? 'Service hidden' : 'Service published')
      afterChange()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (s) => {
    if (!(await confirmDelete('this service', `"${s.name}" will be removed from the website.`))) return
    setBusyId(s._id)
    try {
      await servicesApi.remove(s._id)
      toast.success('Service deleted')
      afterChange()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Services"
        description="Services shown in the website menu, home page and booking form."
        actions={
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold leading-none text-white transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Service
          </button>
        }
      />

      {loading && !items.length ? (
        <Card>
          <LoadingBlock label="Loading services" />
        </Card>
      ) : error ? (
        <ErrorState message={error.message} onRetry={load} />
      ) : !items.length ? (
        <EmptyState title="No services yet" message="Add the first service to show it on the website." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <li key={s._id}>
              <Card className={`flex h-full flex-col overflow-hidden transition ${s.published ? '' : 'opacity-75'}`}>
                <div className="relative aspect-[16/10] bg-muted">
                  {s.image && <img src={mediaUrl(s.image)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3">
                    <StatusBadge status={s.published ? 'Published' : 'Draft'} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-sans text-[17px] font-semibold">{s.name}</h2>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-text-soft">{s.shortDescription || 'No short description.'}</p>
                  <p className="mt-3 text-[12px] text-text-soft">
                    {s.benefits.length} benefits &middot; {s.process.length} steps &middot; order {s.order}
                  </p>
                  <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3">
                    {s.published && (
                      <a
                        href={`/services/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${s.name} on the website`}
                        title="View on website"
                        className="grid h-9 w-9 place-items-center rounded-full text-text-soft transition hover:bg-muted hover:text-text"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                    <IconButton
                      label={s.published ? `Hide ${s.name}` : `Publish ${s.name}`}
                      icon={s.published ? EyeOff : Eye}
                      tone="primary"
                      disabled={busyId === s._id}
                      onClick={() => togglePublish(s)}
                    />
                    <IconButton label={`Edit ${s.name}`} icon={Pencil} tone="primary" onClick={() => setEditing(s)} />
                    <IconButton label={`Delete ${s.name}`} icon={Trash2} tone="danger" disabled={busyId === s._id} onClick={() => remove(s)} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add Service' : `Edit ${editing?.name || 'Service'}`} size="lg">
        {editing && (
          <ServiceForm
            key={editing === 'new' ? 'new' : editing._id}
            isEdit={editing !== 'new'}
            initial={
              editing === 'new'
                ? { order: items.length }
                : {
                    name: editing.name,
                    slug: editing.slug,
                    shortDescription: editing.shortDescription || '',
                    description: editing.description || '',
                    image: editing.image || '',
                    benefits: editing.benefits || [],
                    process: editing.process || [],
                    published: editing.published,
                    order: editing.order ?? 0,
                  }
            }
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  )
}
