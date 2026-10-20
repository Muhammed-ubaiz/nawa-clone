/** White dashboard card with optional title row. */
export default function DashCard({ title, subtitle, action, children, className = '', bodyClass = 'px-5 pb-5 sm:px-6 sm:pb-6', delay = 0, as: Tag = 'section' }) {
  return (
    <Tag
      className={`animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both] rounded-[20px] border border-border/70 bg-white ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[16px] font-semibold tracking-tight text-text">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-text-soft">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </Tag>
  )
}

/** Compact inline error with retry, used inside cards. */
export function InlineError({ message = 'Unable to load dashboard data.', onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-[13px] text-red-700 ${className}`}>
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-text ring-1 ring-border transition hover:bg-canvas">
          Try again
        </button>
      )}
    </div>
  )
}
