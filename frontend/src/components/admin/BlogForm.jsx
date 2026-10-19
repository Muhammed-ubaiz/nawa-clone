import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bold, Heading2, List, Pilcrow } from 'lucide-react'
import BlogContent from '../blog/BlogContent'
import Button from '../common/Button'
import ImageUpload from './ImageUpload'
import { Card, FormField, Toggle } from './ui'

const CATEGORIES = ['Ayurveda', 'Wellness', 'Skin Care', 'Hair Care', 'Pain Relief', 'Detox', 'Nutrition']

const emptyBlog = {
  title: '',
  slug: '',
  category: 'Wellness',
  excerpt: '',
  content: '',
  author: 'Nawa Ayurveda Team',
  published: false,
  featuredImage: '',
}

function validate(v) {
  const e = {}
  if (v.title.trim().length < 3) e.title = 'Title must be at least 3 characters.'
  if (v.title.length > 180) e.title = 'Title must be 180 characters or fewer.'
  if (v.excerpt.length > 400) e.excerpt = 'Excerpt must be 400 characters or fewer.'
  if (v.content.trim().length < 20) e.content = 'Content must be at least 20 characters.'
  return e
}

/**
 * Shared create/edit form for articles. Content uses lightweight Markdown
 * (## headings, - lists, **bold**) with a toolbar and live preview.
 */
export default function BlogForm({ initial, onSubmit, submitLabel = 'Save Article', isEdit = false }) {
  const [values, setValues] = useState({ ...emptyBlog, ...initial })
  const [file, setFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState('write')
  const [saving, setSaving] = useState(false)
  const contentRef = useRef(null)

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  /** Inserts Markdown syntax around the current selection in the content box. */
  const format = (type) => {
    const el = contentRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const selected = value.slice(s, e)
    let insert
    if (type === 'bold') insert = `**${selected || 'bold text'}**`
    else if (type === 'h2') insert = `\n\n## ${selected || 'Section heading'}\n\n`
    else if (type === 'list') insert = `\n\n${(selected || 'First point\nSecond point').split('\n').map((l) => `- ${l}`).join('\n')}\n\n`
    else insert = `\n\n${selected || 'New paragraph'}\n\n`
    const next = (value.slice(0, s) + insert + value.slice(e)).replace(/\n{3,}/g, '\n\n')
    set('content', next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = Math.min(next.length, s + insert.length)
      el.setSelectionRange(pos, pos)
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`blog-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: values.title.trim(),
        category: values.category.trim(),
        excerpt: values.excerpt.trim(),
        content: values.content.trim(),
        author: values.author.trim(),
        published: values.published,
        ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
        ...(file ? { featuredImage: file } : {}),
        ...(removeImage && !file ? { removeImage: true } : {}),
      }
      await onSubmit(payload)
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setErrors(err.fields)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const tools = [
    { type: 'h2', icon: Heading2, label: 'Heading' },
    { type: 'p', icon: Pilcrow, label: 'Paragraph' },
    { type: 'list', icon: List, label: 'Bullet list' },
    { type: 'bold', icon: Bold, label: 'Bold' },
  ]

  return (
    <form onSubmit={(e) => submit(e).catch(() => {})} noValidate className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="space-y-5 p-6">
          <FormField label="Title" htmlFor="blog-title" error={errors.title}>
            <input id="blog-title" className="field" value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Ayurvedic Tips for Better Sleep" />
          </FormField>
          <FormField label="Excerpt" htmlFor="blog-excerpt" error={errors.excerpt} hint={`${values.excerpt.length}/400 — shown on blog cards and in search results.`}>
            <textarea
              id="blog-excerpt"
              rows={3}
              className="field"
              value={values.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="A one or two sentence summary of the article."
            />
          </FormField>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div role="tablist" aria-label="Editor mode" className="flex rounded-full bg-muted p-1">
              {['write', 'preview'].map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize transition ${tab === t ? 'bg-white shadow-sm' : 'text-text-soft'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === 'write' && (
              <div className="flex gap-1" role="toolbar" aria-label="Formatting">
                {tools.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => format(type)}
                    aria-label={label}
                    title={label}
                    className="grid h-9 w-9 place-items-center rounded-full text-text-soft transition hover:bg-muted hover:text-text"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {tab === 'write' ? (
              <>
                <label htmlFor="blog-content" className="sr-only">
                  Content
                </label>
                <textarea
                  id="blog-content"
                  ref={contentRef}
                  rows={18}
                  value={values.content}
                  onChange={(e) => set('content', e.target.value)}
                  aria-invalid={!!errors.content}
                  placeholder={'Write your article here.\n\n## Use headings like this\n\n- And bullet points\n- Like these'}
                  className={`w-full resize-y rounded-2xl border bg-white p-4 font-sans text-[15px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 ${
                    errors.content ? 'border-red-400' : 'border-border'
                  }`}
                />
                {errors.content ? (
                  <p role="alert" className="mt-1.5 pl-1 text-[12px] font-medium text-red-600">
                    {errors.content}
                  </p>
                ) : (
                  <p className="mt-1.5 pl-1 text-[12px] text-text-soft">Leave a blank line between paragraphs. Use the toolbar for headings, lists and bold text.</p>
                )}
              </>
            ) : values.content.trim() ? (
              <BlogContent content={values.content} className="min-h-[300px] text-[16px] leading-[1.85]" />
            ) : (
              <p className="py-16 text-center text-[14px] text-text-soft">Nothing to preview yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-6">
          <Toggle
            checked={values.published}
            onChange={(v) => set('published', v)}
            label={values.published ? 'Published' : 'Draft'}
            description={values.published ? 'Visible on the public blog.' : 'Only visible to admins.'}
          />
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <Button type="submit" variant="dark" loading={saving} className="w-full">
              {saving ? 'Saving…' : submitLabel}
            </Button>
            <Link to="/admin/blogs" className="rounded-full border border-border py-3.5 text-center text-[14px] font-semibold leading-none transition hover:bg-muted">
              Cancel
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <ImageUpload
            label="Featured Image"
            value={removeImage ? '' : values.featuredImage}
            file={file}
            onFile={(f) => {
              setFile(f)
              if (f) setRemoveImage(false)
            }}
            onRemove={() => setRemoveImage(true)}
            error={errors.featuredImage}
          />
        </Card>

        <Card className="space-y-5 p-6">
          <FormField label="Category" htmlFor="blog-category" error={errors.category}>
            <input id="blog-category" list="blog-categories" className="field" value={values.category} onChange={(e) => set('category', e.target.value)} />
            <datalist id="blog-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Author" htmlFor="blog-author" error={errors.author}>
            <input id="blog-author" className="field" value={values.author} onChange={(e) => set('author', e.target.value)} />
          </FormField>
          <FormField
            label="URL slug (optional)"
            htmlFor="blog-slug"
            error={errors.slug}
            hint={isEdit ? 'Changing the slug changes the article URL.' : 'Generated from the title if left empty.'}
          >
            <input id="blog-slug" className="field" value={values.slug} onChange={(e) => set('slug', e.target.value)} placeholder="ayurvedic-tips-for-sleep" />
          </FormField>
        </Card>
      </div>
    </form>
  )
}
