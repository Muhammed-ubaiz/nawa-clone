import { useEffect, useRef } from 'react'
import { CheckCircle2, X } from 'lucide-react'

/** Lightweight accessible confirmation dialog (no external dependency). */
export default function SuccessModal({ open, title, message, onClose }) {
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    btnRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 animate-[fade-up_0.4s_ease_both] bg-text/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-msg"
        className="relative w-full max-w-md animate-fade-up rounded-[28px] bg-white p-8 text-center shadow-2xl md:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted text-text hover:bg-secondary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 id="success-title" className="mt-6 font-serif text-[30px] leading-tight">{title}</h2>
        <p id="success-msg" className="mt-3 text-[15px] leading-relaxed text-text-soft">{message}</p>
        <button
          ref={btnRef}
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-[14px] font-semibold leading-none text-white transition hover:bg-primary-dark"
        >
          Done
        </button>
      </div>
    </div>
  )
}
