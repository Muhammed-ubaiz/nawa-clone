/** White section container with a title row; shared by every reports section. */
export default function ReportCard({ title, subtitle, action, children, className = '', bodyClass = 'p-5 sm:p-6', delay = 0 }) {
  return (
    <section
      className={`animate-fade-up rounded-2xl border border-border/70 bg-white ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="font-sans text-[16px] font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-text-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClass}>{children}</div>
    </section>
  )
}
