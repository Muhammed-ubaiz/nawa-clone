import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import FilterDropdown from './FilterDropdown'
import { MONTHS, yearOptions } from './useReportDownload'

export const PERIODS = [
  { value: 'all', label: 'All', long: 'All Time' },
  { value: 'today', label: 'Today', long: 'Today' },
  { value: 'month', label: 'Month', long: 'This Month' },
  { value: 'year', label: 'Year', long: 'This Year' },
  { value: 'custom', label: 'Custom', long: 'Custom Range' },
]

/** Segmented period control (All / Today / Month / Year / Custom). */
export function PeriodSegments({ period, onChange }) {
  return (
    <div role="tablist" aria-label="Report period" className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-white p-1 sm:w-auto">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          role="tab"
          aria-selected={period === p.value}
          onClick={() => onChange(p.value)}
          className={`flex-1 shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-300 sm:flex-none ${
            period === p.value ? 'bg-primary text-white shadow-sm' : 'text-text-soft hover:bg-canvas hover:text-text'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Secondary controls for the selected period: month/year pickers or a
 * custom range that only applies on "Apply". Expands with a smooth height transition.
 */
export function PeriodDetails({ period, month, year, custom, onMonth, onYear, onApplyCustom }) {
  const [draft, setDraft] = useState(custom)
  const [error, setError] = useState('')
  useEffect(() => setDraft(custom), [custom])

  const open = period === 'month' || period === 'year' || period === 'custom'
  const years = yearOptions().map((y) => ({ value: y, label: String(y) }))

  const apply = (e) => {
    e.preventDefault()
    if (!draft.from || !draft.to) return setError('Choose both dates.')
    if (draft.from > draft.to) return setError('From Date must be on or before To Date.')
    setError('')
    onApplyCustom(draft)
  }

  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!open}>
      <div className="overflow-hidden">
        <div className="pt-3">
          {(period === 'month' || period === 'year') && (
            <div className="flex flex-wrap gap-2">
              {period === 'month' && (
                <FilterDropdown
                  label="Month"
                  icon={CalendarDays}
                  value={month}
                  onChange={onMonth}
                  options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
                  className="w-full sm:w-52"
                />
              )}
              <FilterDropdown label="Year" value={year} onChange={onYear} options={years} className="w-full sm:w-40" />
            </div>
          )}
          {period === 'custom' && (
            <form onSubmit={apply} noValidate className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-soft">From Date</span>
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 sm:w-44"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-soft">To Date</span>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 sm:w-44"
                />
              </label>
              <button
                type="submit"
                className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-text px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Apply
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              {error && (
                <p role="alert" className="text-[12px] font-medium text-red-600 sm:w-full">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
