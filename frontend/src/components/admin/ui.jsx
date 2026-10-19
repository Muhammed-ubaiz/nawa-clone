/* Small presentational building blocks shared by the admin pages. */
import { useEffect, useId, useRef } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[30px] leading-tight md:text-[36px]">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] text-text-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-[24px] border border-border/70 bg-white shadow-[0_1px_2px_rgba(7,8,7,0.04)] ${className}`} {...rest}>
      {children}
    </div>
  )
}

const BADGE = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Confirmed: 'bg-secondary text-primary-dark ring-primary/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  Published: 'bg-secondary text-primary-dark ring-primary/20',
  Draft: 'bg-muted text-text-soft ring-border',
  New: 'bg-accent/10 text-accent-dark ring-accent/30',
  Read: 'bg-muted text-text-soft ring-border',
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ring-1 ring-inset ${BADGE[status] || BADGE.Draft}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {status}
    </span>
  )
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint }) {
  const tones = {
    primary: 'bg-secondary text-primary',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-primary text-white',
    green: 'bg-emerald-50 text-emerald-600',
    gold: 'bg-accent/10 text-accent',
    olive: 'bg-olive/15 text-olive',
  }
  return (
    <Card className="p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(7,8,7,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-text-soft">{label}</p>
          <p className="mt-3 font-serif text-[40px] leading-none">{value ?? '—'}</p>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {hint && <p className="mt-4 text-[12px] text-text-soft">{hint}</p>}
    </Card>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field !pl-11" />
    </label>
  )
}

export function Select({ value, onChange, options, label, className = '' }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field cursor-pointer appearance-none pr-10">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function LoadingBlock({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-[14px] text-text-soft">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      {label}&hellip;
    </div>
  )
}

export function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return total ? <p className="px-6 py-4 text-[13px] text-text-soft">{total} total</p> : null
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-4 sm:px-6">
      <p className="text-[13px] text-text-soft">
        Page {page} of {pages} &middot; {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Accessible modal dialog with focus on open and Escape to close. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    ref.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-[fade-up_0.3s_ease_both] bg-text/45 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[92vh] w-full ${widths[size]} animate-fade-up flex-col rounded-t-[28px] bg-white shadow-2xl outline-none sm:rounded-[28px]`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <h2 id={titleId} className="font-serif text-[24px] leading-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted hover:bg-secondary">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/** Labelled form control wrapper with error text. */
export function FormField({ label, htmlFor, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-text">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 pl-1 text-[12px] text-text-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 pl-1 text-[12px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

/** On/off switch built on a checkbox for accessibility. */
export function Toggle({ checked, onChange, label, description }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-4">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-[14px] font-semibold">{label}</span>
        {description && <span className="block text-[12px] text-text-soft">{description}</span>}
      </span>
    </label>
  )
}

/** Small icon button used in table action columns. */
export function IconButton({ label, icon: Icon, onClick, tone = 'default', disabled, ...rest }) {
  const tones = {
    default: 'text-text-soft hover:bg-muted hover:text-text',
    danger: 'text-text-soft hover:bg-red-50 hover:text-red-600',
    primary: 'text-text-soft hover:bg-secondary hover:text-primary',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition disabled:opacity-40 ${tones[tone]}`}
      {...rest}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
