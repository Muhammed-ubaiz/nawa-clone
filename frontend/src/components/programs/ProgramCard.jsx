import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from 'lucide-react'

/**
 * Home page variant, in the logo palette: a deep-green glass panel with a leaf-green frame that
 * warms to gold; the photo carries a warm herbal tint, a gold duration pill and a gold number;
 * white serif title warming to gold, mint copy, and a leaf-ruled "Book Program" footer whose
 * gold arrow fills on hover.
 */
function EditorialProgramCard({ program, index = 0 }) {
  const { title, text, image, duration } = program
  return (
    <Link
      to="/appointment"
      state={{ service: title }}
      className="group flex h-full flex-col rounded-[22px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/70 to-[#0c2f24]/40 p-2.5 backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-500 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-logo-gold focus-visible:ring-offset-4 focus-visible:ring-offset-herbal-base md:hover:-translate-y-1.5 md:hover:border-logo-gold/50 md:hover:shadow-[0_30px_60px_-34px_rgba(0,0,0,0.75)]"
      aria-label={`Book ${title}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[15px] bg-[#0c2f24]">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover saturate-[0.85] transition-transform duration-[1000ms] ease-premium md:group-hover:scale-[1.04]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/80 to-transparent" />
        {duration && (
          <span className="label-caps absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-logo-gold/40 bg-herbal-base/75 px-3 py-1.5 text-logo-gold backdrop-blur-sm">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {duration}
          </span>
        )}
        <span aria-hidden="true" className="absolute bottom-3 left-4 font-serif text-[22px] italic leading-none text-logo-gold">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-6 md:px-5">
        <h3 className="font-serif text-[26px] font-medium leading-[1.2] text-white transition-colors duration-500 group-hover:text-logo-gold">{title}</h3>
        <p className="mb-6 mt-3 text-[15px] leading-[1.7] text-mist">{text}</p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-leaf/30 pt-5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-mist transition-colors duration-500 group-hover:text-logo-gold">
            Book Program
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-logo-gold/50 text-logo-gold transition-[background-color,border-color,color,transform] duration-500 ease-premium group-hover:rotate-45 group-hover:border-logo-gold group-hover:bg-logo-gold group-hover:text-herbal-base">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Program card. Default: large image card with a gradient overlay and serif title; text reveals on hover.
 * `variant="editorial"`: framed photo + white content panel (home page).
 */
export default function ProgramCard({ program, tall = false, variant, index }) {
  if (variant === 'editorial') return <EditorialProgramCard program={program} index={index} />
  const { title, text, image, duration } = program
  return (
    <Link
      to="/appointment"
      state={{ service: title }}
      className={`group relative block overflow-hidden rounded-[25px] bg-muted transition-[transform,box-shadow] duration-500 ease-premium hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-30px_rgba(7,8,7,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 ${
        tall ? 'aspect-[3/4]' : 'aspect-[4/5] sm:aspect-[3/4]'
      }`}
      aria-label={`Book ${title}`}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1000ms] ease-premium group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-text/85 via-text/25 to-transparent transition-opacity duration-500 group-hover:from-primary-dark/90" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
        {duration && (
          <span className="label-caps mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {duration}
          </span>
        )}
        <div className="flex items-end justify-between gap-4">
          <h3 className="h-card !text-white">{title}</h3>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-text transition-all duration-500 group-hover:rotate-45 group-hover:bg-accent group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
          <p className="overflow-hidden text-[14px] leading-relaxed text-white/85">
            <span className="block pt-3">{text}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
