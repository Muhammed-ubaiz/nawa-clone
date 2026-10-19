import { useEffect, useState } from 'react'
import { CalendarRange, RotateCcw } from 'lucide-react'

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const selectCls =
  'cursor-pointer rounded-full border border-border bg-white px-4 py-2.5 text-[13px] font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15'

/**
 * Period / date-range filter. Month and year pickers appear for the month and
 * year views; the custom range only applies when "Apply Filter" is pressed.
 */
export default function PeriodFilter({ filter, onChange, onReset, firstYear = 2024 }) {
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: Math.max(1, thisYear - firstYear + 2) }, (_, i) => thisYear + 1 - i)
  const [draft, setDraft] = useState({ from: filter.from || '', to: filter.to || '' })
  const [error, setError] = useState('')

  useEffect(() => setDraft({ from: filter.from || '', to: filter.to || '' }), [filter.from, filter.to])

  const applyCustom = (e) => {
    e.preventDefault()
    if (!draft.from || !draft.to) return setError('Choose both a start and an end date.')
    if (draft.from > draft.to) return setError('The start date must be on or before the end date.')
    setError('')
    onChange({ period: 'custom', from: draft.from, to: draft.to })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div role="tablist" aria-label="Reporting period" className="-mx-1 flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-border/70">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={filter.period === p.value}
              onClick={() => (p.value === 'custom' ? onChange({ period: 'custom' }) : onChange({ period: p.value }))}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                filter.period === p.value ? 'bg-primary text-white shadow-sm' : 'text-text-soft hover:bg-muted hover:text-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-text-soft">Count by</span>
          <div role="radiogroup" aria-label="Count appointments by" className="flex rounded-full bg-white p-1 ring-1 ring-border/70">
            {[
              { value: 'created', label: 'Date received', title: 'When the booking request was made' },
              { value: 'scheduled', label: 'Visit date', title: 'The patient’s preferred appointment date' },
            ].map((b) => (
              <button
                key={b.value}
                type="button"
                role="radio"
                aria-checked={filter.basis === b.value}
                title={b.title}
                onClick={() => onChange({ basis: b.value })}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${filter.basis === b.value ? 'bg-secondary text-primary-dark' : 'text-text-soft hover:text-text'}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(filter.period === 'month' || filter.period === 'year') && (
        <div className="flex flex-wrap items-center gap-2">
          {filter.period === 'month' && (
            <label className="flex items-center gap-2">
              <span className="sr-only">Month</span>
              <select value={filter.month} onChange={(e) => onChange({ month: Number(e.target.value) })} className={selectCls}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2">
            <span className="sr-only">Year</span>
            <select value={filter.year} onChange={(e) => onChange({ year: Number(e.target.value) })} className={selectCls}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-primary hover:bg-secondary">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Current {filter.period}
          </button>
        </div>
      )}

      {filter.period === 'custom' && (
        <form onSubmit={applyCustom} noValidate className="flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 ring-1 ring-border/70">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-text-soft">From Date</span>
            <input type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className="field !w-auto !py-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-text-soft">To Date</span>
            <input type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="field !w-auto !py-2.5" />
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[13px] font-semibold leading-none text-white transition hover:bg-primary-dark">
            <CalendarRange className="h-4 w-4" aria-hidden="true" /> Apply Filter
          </button>
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-3 text-[13px] font-semibold leading-none hover:bg-muted">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset Filter
          </button>
          {error && (
            <p role="alert" className="w-full text-[12px] font-medium text-red-600">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
