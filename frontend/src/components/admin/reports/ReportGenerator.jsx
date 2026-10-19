import { useState } from 'react'
import { CalendarDays, Download, FileText, Loader2 } from 'lucide-react'
import FilterDropdown from './FilterDropdown'
import { MONTHS, yearOptions } from './useReportDownload'

const TYPES = [
  { value: 'today', label: 'Daily' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all', label: 'All appointments' },
]

const dateCls =
  'h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10'

const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-soft'

/**
 * "Generate Report" card: pick a report type and its date controls, then build the
 * PDF with the existing generator. A daily report for today uses the Today report;
 * another day is exported as a one-day range.
 */
export default function ReportGenerator({ today, busyKey, onDownload, delay }) {
  const now = new Date()
  const [type, setType] = useState('today')
  const [day, setDay] = useState(today || '')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')

  const years = yearOptions().map((y) => ({ value: y, label: String(y) }))
  const busy = busyKey === 'generator'

  const generate = (e) => {
    e.preventDefault()
    let params
    if (type === 'today') {
      const d = day || today
      if (!d) return setError('Choose a date.')
      params = d === today ? { period: 'today' } : { period: 'custom', from: d, to: d }
    } else if (type === 'month') params = { period: 'month', month, year }
    else if (type === 'year') params = { period: 'year', year }
    else if (type === 'custom') {
      if (!from || !to) return setError('Choose both a From and a To date.')
      if (from > to) return setError('From must be on or before To.')
      params = { period: 'custom', from, to }
    } else params = { period: 'all' }
    setError('')
    onDownload('generator', params)
  }

  return (
    <section
      aria-labelledby="generator-title"
      className="animate-fade-up overflow-hidden rounded-2xl border border-border/70 bg-white"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="grid lg:grid-cols-[1fr_1.5fr]">
        <div className="relative border-b border-border/70 bg-canvas p-6 sm:p-7 lg:border-b-0 lg:border-r">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-primary ring-1 ring-border/70">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="generator-title" className="mt-5 font-serif text-[26px] leading-tight">
            Generate Report
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-text-soft">
            Choose a reporting period and download a complete PDF summary of your appointment data.
          </p>
          <p className="mt-4 text-[12px] text-text-soft">Includes every matching appointment, status totals and page numbers.</p>
        </div>

        <form onSubmit={generate} noValidate className="flex flex-col gap-4 p-6 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Report Type</span>
              <FilterDropdown label="Type" value={type} onChange={(v) => (setType(v), setError(''))} options={TYPES} icon={FileText} />
            </div>

            {type === 'today' && (
              <label className="block">
                <span className={label}>Date</span>
                <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={dateCls} />
              </label>
            )}
            {type === 'year' && (
              <div>
                <span className={label}>Year</span>
                <FilterDropdown label="Year" value={year} onChange={setYear} options={years} />
              </div>
            )}
            {type === 'all' && (
              <div className="flex items-end">
                <p className="pb-2.5 text-[13px] text-text-soft">Every appointment on record, all dates.</p>
              </div>
            )}
          </div>

          {type === 'month' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={label}>Month</span>
                <FilterDropdown label="Month" icon={CalendarDays} value={month} onChange={setMonth} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
              </div>
              <div>
                <span className={label}>Year</span>
                <FilterDropdown label="Year" value={year} onChange={setYear} options={years} />
              </div>
            </div>
          )}

          {type === 'custom' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>From</span>
                <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateCls} />
              </label>
              <label className="block">
                <span className={label}>To</span>
                <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateCls} />
              </label>
            </div>
          )}

          {error && (
            <p role="alert" className="text-[12px] font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="mt-auto flex justify-end pt-2">
            <button
              type="submit"
              disabled={!!busyKey}
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[14px] font-semibold text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-70 sm:w-auto"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
              )}
              {busy ? 'Generating PDF…' : 'Generate PDF'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
