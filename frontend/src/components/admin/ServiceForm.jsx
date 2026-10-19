import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../common/Button'
import ImageUpload from './ImageUpload'
import { FormField, Toggle } from './ui'

const empty = { name: '', slug: '', shortDescription: '', description: '', image: '', benefits: [], process: [], published: true, order: 0 }

function validate(v) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
  if (v.shortDescription.length > 300) e.shortDescription = 'Short description must be 300 characters or fewer.'
  if (v.process.some((p) => !p.title.trim() && p.text.trim())) e.process = 'Every step needs a title.'
  return e
}

/** Create/edit form for a service, rendered inside a modal on the Services admin page. */
export default function ServiceForm({ initial, onSubmit, onCancel, isEdit = false }) {
  const [values, setValues] = useState({ ...empty, ...initial })
  const [file, setFile] = useState(null)
  const [benefitDraft, setBenefitDraft] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const addBenefit = () => {
    const b = benefitDraft.trim()
    if (!b) return
    set('benefits', [...values.benefits, b])
    setBenefitDraft('')
  }

  const setStep = (i, key, val) => set('process', values.process.map((p, k) => (k === i ? { ...p, [key]: val } : p)))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        benefits: values.benefits,
        process: values.process.filter((p) => p.title.trim()).map((p) => ({ title: p.title.trim(), text: p.text.trim() })),
        published: values.published,
        order: Number(values.order) || 0,
        ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
        ...(file ? { image: file } : {}),
      })
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setErrors(err.fields)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Name" htmlFor="svc-name" error={errors.name} className="sm:col-span-2">
          <input id="svc-name" className="field" value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ayurvedic Therapies" />
        </FormField>
        <FormField label="Short description" htmlFor="svc-short" error={errors.shortDescription} hint={`${values.shortDescription.length}/300 — shown on cards.`} className="sm:col-span-2">
          <textarea id="svc-short" rows={2} className="field" value={values.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </FormField>
        <FormField label="Full description" htmlFor="svc-desc" error={errors.description} hint="Shown on the service page. Leave a blank line between paragraphs." className="sm:col-span-2">
          <textarea id="svc-desc" rows={5} className="field" value={values.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
      </div>

      <ImageUpload label="Image" value={values.image} file={file} onFile={setFile} error={errors.image} />

      <div>
        <p className="mb-2 text-[13px] font-semibold">Benefits</p>
        {values.benefits.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {values.benefits.map((b, i) => (
              <li key={b + i} className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1.5 pl-3.5 pr-1.5 text-[13px] font-medium">
                {b}
                <button
                  type="button"
                  onClick={() => set('benefits', values.benefits.filter((_, k) => k !== i))}
                  aria-label={`Remove ${b}`}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <label htmlFor="svc-benefit" className="sr-only">
            New benefit
          </label>
          <input
            id="svc-benefit"
            className="field"
            value={benefitDraft}
            onChange={(e) => setBenefitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addBenefit()
              }
            }}
            placeholder="Type a benefit and press Enter"
          />
          <button type="button" onClick={addBenefit} className="shrink-0 rounded-full bg-muted px-5 text-[13px] font-semibold hover:bg-secondary">
            Add
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold">Treatment details / process</p>
          <button
            type="button"
            onClick={() => set('process', [...values.process, { title: '', text: '' }])}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-secondary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add step
          </button>
        </div>
        {values.process.length === 0 && <p className="rounded-2xl bg-muted px-4 py-4 text-[13px] text-text-soft">No steps yet. Add the therapies or stages included in this service.</p>}
        <ol className="space-y-3">
          {values.process.map((p, i) => (
            <li key={i} className="rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="mt-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-bold text-primary">{i + 1}</span>
                <div className="grid flex-1 gap-2">
                  <label className="sr-only" htmlFor={`step-title-${i}`}>
                    Step {i + 1} title
                  </label>
                  <input id={`step-title-${i}`} className="field" value={p.title} onChange={(e) => setStep(i, 'title', e.target.value)} placeholder="Title, e.g. Abhyanga" />
                  <label className="sr-only" htmlFor={`step-text-${i}`}>
                    Step {i + 1} description
                  </label>
                  <textarea id={`step-text-${i}`} rows={2} className="field" value={p.text} onChange={(e) => setStep(i, 'text', e.target.value)} placeholder="Short description" />
                </div>
                <button
                  type="button"
                  onClick={() => set('process', values.process.filter((_, k) => k !== i))}
                  aria-label={`Remove step ${i + 1}`}
                  className="mt-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-soft hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        {errors.process && (
          <p role="alert" className="mt-1.5 pl-1 text-[12px] font-medium text-red-600">
            {errors.process}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="URL slug (optional)" htmlFor="svc-slug" error={errors.slug} hint={isEdit ? 'Changing it changes the page URL.' : 'Generated from the name if empty.'}>
          <input id="svc-slug" className="field" value={values.slug} onChange={(e) => set('slug', e.target.value)} />
        </FormField>
        <FormField label="Display order" htmlFor="svc-order" hint="Lower numbers appear first.">
          <input id="svc-order" type="number" min="0" className="field" value={values.order} onChange={(e) => set('order', e.target.value)} />
        </FormField>
      </div>

      <Toggle
        checked={values.published}
        onChange={(v) => set('published', v)}
        label={values.published ? 'Published' : 'Hidden'}
        description={values.published ? 'Shown in the menu and on the website.' : 'Hidden from the website.'}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-6 py-3.5 text-[14px] font-semibold leading-none hover:bg-muted">
          Cancel
        </button>
        <Button type="submit" variant="dark" loading={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Service'}
        </Button>
      </div>
    </form>
  )
}
