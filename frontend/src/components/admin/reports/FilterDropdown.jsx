import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Compact listbox-style dropdown ("Status: All ▾").
 * Keyboard: Enter/Space/↓ opens, ↑/↓ moves, Enter selects, Esc closes.
 */
export default function FilterDropdown({ label, value, options, onChange, icon: Icon, align = 'left', matchWidth = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const listRef = useRef(null)
  const id = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    requestAnimationFrame(() => listRef.current?.focus())
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, options, value])

  const choose = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  const onListKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(options.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'ArrowDown' && (e.preventDefault(), setOpen(true))}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border bg-white pl-3 pr-2.5 text-left text-[13px] transition-colors ${
          open ? 'border-primary/50 ring-2 ring-primary/10' : 'border-border hover:border-text/20'
        }`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-text-soft" aria-hidden="true" />}
        <span className="shrink-0 text-text-soft">{label}:</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-text">{current?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-soft transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <ul
        id={`${id}-list`}
        ref={listRef}
        role="listbox"
        tabIndex={-1}
        aria-label={label}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onKeyDown={onListKey}
        className={`absolute max-h-72 overflow-auto rounded-xl border border-border bg-white p-1 shadow-[0_16px_40px_-20px_rgba(7,8,7,0.3)] outline-none transition-all duration-200 ${
          matchWidth
            ? // Exactly as wide as the trigger, 8px below it, both edges aligned.
              'inset-x-0 top-[calc(100%+8px)] z-50 w-full'
            : `z-40 mt-1.5 min-w-full sm:min-w-[220px] ${align === 'right' ? 'right-0' : 'left-0'}`
        } ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}
      >
        {options.map((o, i) => {
          const selected = o.value === value
          return (
            <li
              key={o.value || 'all'}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
              className={
                matchWidth
                  ? `flex h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-[13px] transition-colors duration-150 ${
                      selected ? 'bg-secondary/45 font-semibold text-primary-dark' : i === active ? 'bg-canvas text-text' : 'text-text'
                    }`
                  : `flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] ${
                      i === active ? 'bg-canvas' : ''
                    } ${selected ? 'font-semibold text-primary' : 'text-text'}`
              }
            >
              <span className="truncate">{o.label}</span>
              {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
