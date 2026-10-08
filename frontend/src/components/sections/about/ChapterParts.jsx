/**
 * Shared pieces for the About page's dark chapters (Heritage, Practitioners, Journey,
 * Impact), so they speak the same visual language as the cinematic chapters above.
 */

/** "──── 04  OUR HERITAGE" — thin line, serif-adjacent number, tracked label. */
export function ChapterEyebrow({ index, children, className = '', style }) {
  return (
    <p
      className={`flex items-center gap-4 text-[11px] font-semibold uppercase leading-none tracking-[0.25em] text-logo-gold sm:text-[12px] ${className}`}
      style={style}
    >
      <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
      {index && <span className="tabular-nums text-white/70">{index}</span>}
      {children}
    </p>
  )
}

/**
 * Soft atmospheric light: absolutely positioned radial glows behind the content. Masked with
 * .edge-fade so a glow never reaches the section's top or bottom (no seam between chapters).
 * `spots` — [{ x, y, size, color }] in % / px / rgba.
 */
export function ChapterGlow({ spots }) {
  return (
    <div aria-hidden="true" className="edge-fade pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {spots.map(({ x, y, size, color }, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: x,
            top: y,
            width: size,
            height: size,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(closest-side, ${color}, transparent)`,
          }}
        />
      ))}
    </div>
  )
}
