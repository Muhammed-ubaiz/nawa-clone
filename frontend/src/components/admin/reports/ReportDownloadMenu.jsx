import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, CalendarDays, CalendarRange, ChevronDown, Download, Layers, Loader2, Sun } from 'lucide-react'
import { MONTHS } from './useReportDownload'

/** "Download Report" button with a menu of the five PDF report types. */
export default function ReportDownloadMenu({ month, year, custom, busyKey, onDownload }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const customReady = !!(custom?.from && custom?.to)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = [
    { key: 'all', label: 'Download All Appointments', hint: 'Every appointment on record', icon: Layers, params: { period: 'all' } },
    { key: 'today', label: "Download Today's Report", hint: 'Scheduled for today', icon: Sun, params: { period: 'today' } },
    { key: 'month', label: 'Download Monthly Report', hint: `${MONTHS[month - 1]} ${year}`, icon: CalendarDays, params: { period: 'month', month, year } },
    { key: 'year', label: 'Download Yearly Report', hint: String(year), icon: CalendarCheck, params: { period: 'year', year } },
    {
      key: 'custom',
      label: 'Download Custom Report',
      hint: customReady ? `${custom.from} → ${custom.to}` : 'Apply a custom range first',
      icon: CalendarRange,
      params: { period: 'custom', ...custom },
      disabled: !customReady,
    },
  ]

  const busy = !!busyKey

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary pl-5 pr-4 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-primary-dark disabled:opacity-80"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
        )}
        {busy ? 'Generating PDF…' : 'Download Report'}
        {!busy && <ChevronDown className={`h-4 w-4 opacity-80 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />}
      </button>

      <div
        role="menu"
        aria-label="Download a PDF report"
        className={`absolute right-0 z-40 mt-2 w-[min(320px,calc(100vw-2rem))] origin-top-right rounded-2xl border border-border bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(7,8,7,0.35)] transition-all duration-200 ${
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'
        }`}
      >
        {items.map(({ key, label, hint, icon: Icon, params, disabled }) => (
          <button
            key={key}
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            disabled={disabled || busy}
            onClick={() => {
              setOpen(false)
              onDownload(key, params)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/70 text-primary">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold">{label}</span>
              <span className="block truncate text-[12px] text-text-soft">{hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
