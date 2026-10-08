import { AlertCircle, Inbox, RotateCw } from 'lucide-react'

/** Friendly error block with an optional retry action. */
export function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }) {
  return (
    <div role="alert" className={`mx-auto max-w-lg rounded-[25px] border border-red-400/25 bg-red-500/[0.07] px-6 py-10 text-center ${className}`}>
      <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="mt-4 text-[15px] font-medium text-text">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-[13px] font-semibold text-text ring-1 ring-border transition hover:bg-secondary"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  )
}

/** Empty-result block. */
export function EmptyState({ title = 'Nothing here yet', message, action, className = '' }) {
  return (
    <div className={`mx-auto max-w-lg rounded-[25px] bg-muted px-6 py-12 text-center ${className}`}>
      <Inbox className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
      <p className="mt-4 font-serif text-[26px] leading-tight">{title}</p>
      {message && <p className="mt-2 text-[14px] text-text-soft">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
