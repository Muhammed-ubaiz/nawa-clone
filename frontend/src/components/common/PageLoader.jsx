import { LogoImage } from './Logo'

/** Full-area loader used for lazy routes and session checks. */
export default function PageLoader({ label = 'Loading', fullScreen = false, background = 'bg-muted' }) {
  return (
    <div role="status" aria-live="polite" className={`grid place-items-center ${background} ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
      <div className="flex flex-col items-center gap-5">
        <LogoImage variant="loader" className="h-auto w-[160px] motion-safe:animate-pulse" />
        <span className="label-caps text-primary">{label}&hellip;</span>
      </div>
    </div>
  )
}
