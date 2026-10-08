import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/** Inner-page banner: large serif title, breadcrumb and an arch image. `className` overrides the ground. */
export default function PageHero({ title, text, image, crumbs = [], className = 'bg-muted' }) {
  return (
    <section className={`relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40 lg:pt-44 ${className}`}>
      <div aria-hidden="true" className="page-hero-glow pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-secondary/70 blur-3xl" />
      <div className="container-x relative grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="animate-fade-up">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-text-soft">
              <li>
                <Link to="/" className="hover:text-primary">Home</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  {c.to ? (
                    <Link to={c.to} className="hover:text-primary">{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-primary">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="h-display">{title}</h1>
          {text && <p className="lead mt-6 max-w-xl">{text}</p>}
        </div>
        {image && (
          <div className="animate-reveal hidden lg:block" style={{ animationDelay: '200ms' }}>
            <img src={image} alt="" className="arch ml-auto aspect-[4/5] w-full max-w-[380px] object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}
