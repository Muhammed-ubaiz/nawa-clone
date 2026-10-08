import { useId } from 'react'
import { Plus } from 'lucide-react'

/**
 * Editorial row: large thin serif number, question, and a hairline plus that folds into a minus.
 * Opening draws a short accent along the rule; the answer reveals with height + opacity.
 * Colours come from the theme tokens (logo palette: leaf rules, gold numerals/icon, white question).
 */
function EditorialFAQItem({ question, answer, open, onToggle, index }) {
  const id = useId()
  return (
    <div className="relative border-b border-border">
      <span
        aria-hidden="true"
        className={`absolute -top-px left-0 h-px bg-primary transition-[width] duration-500 ease-premium ${open ? 'w-16' : 'w-0'}`}
      />
      <h3 className="font-sans">
        <button
          type="button"
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group grid w-full grid-cols-[3.75rem_minmax(0,1fr)_1.5rem] items-baseline gap-x-3 py-7 text-left sm:grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] sm:gap-x-5 md:py-8"
        >
          <span
            aria-hidden="true"
            className={`font-serif text-[42px] leading-none transition-colors duration-500 sm:text-[57px] ${open ? 'text-primary' : 'text-primary/35 group-hover:text-primary/60'}`}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className={`text-[17px] font-medium leading-snug transition-colors duration-500 md:text-[21px] ${
              open ? 'text-primary-dark' : 'text-text group-hover:text-primary-dark'
            }`}
          >
            {question}
          </span>
          {/* Plus -> minus: the vertical stroke turns flat and fades */}
          <span aria-hidden="true" className="relative h-4 w-4 self-center justify-self-end text-primary">
            <span className={`absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 transition-colors duration-500 ${open ? 'bg-primary' : 'bg-current'}`} />
            <span
              className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-[transform,opacity] duration-500 ease-premium ${
                open ? 'rotate-90 opacity-0' : 'opacity-100'
              }`}
            />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-premium ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[560px] pb-8 pl-[calc(3.75rem+0.75rem)] pr-6 text-[15px] leading-[1.85] text-text-soft sm:pl-[calc(5.5rem+1.25rem)] md:text-[16px]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Single accordion row; height animates via CSS grid rows. `variant="editorial"` renders the numbered list style. */
export default function FAQItem({ question, answer, open, onToggle, variant, index = 0 }) {
  const id = useId()
  if (variant === 'editorial') return <EditorialFAQItem question={question} answer={answer} open={open} onToggle={onToggle} index={index} />
  return (
    <div className={`rounded-[20px] border transition-colors duration-300 ${open ? 'border-primary/30 bg-background' : 'border-border bg-background/60'}`}>
      <h3 className="font-sans">
        <button
          type="button"
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-semibold leading-snug text-text md:px-7 md:text-[18px]"
        >
          <span>{question}</span>
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 ${
              open ? 'rotate-45 bg-primary text-white' : 'bg-secondary text-text'
            }`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-6 text-[15px] leading-relaxed text-text-soft md:px-7">{answer}</p>
        </div>
      </div>
    </div>
  )
}
