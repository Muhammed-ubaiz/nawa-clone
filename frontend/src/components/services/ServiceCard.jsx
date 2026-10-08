import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { mediaUrl } from '../../utils/format'

/**
 * Logo-palette card (Services page): leaf-green arch frame with a warm herbal tint and a deep
 * foot, gold number + arrow badge, white serif title that warms to gold, mint copy over a leaf
 * rule. The frame's border warms to gold and the photo zooms gently on hover.
 */
function LogoServiceCard({ service, index = 0, showText }) {
  const { slug, name, shortDescription, image } = service
  return (
    <Link
      to={`/services/${slug}`}
      className="group flex h-full flex-col rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-logo-gold"
      aria-label={`${name} — learn more`}
    >
      <div className="arch relative aspect-[4/5] overflow-hidden border border-leaf/35 bg-[#0c2f24] shadow-[0_30px_60px_-36px_rgba(0,0,0,0.75)] transition-[border-color,translate] duration-700 ease-premium group-hover:-translate-y-1.5 group-hover:border-logo-gold/50">
        {image && (
          <img
            src={mediaUrl(image)}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.05]"
          />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_45%,rgba(8,35,28,0.55)_100%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/90 to-transparent" />
        <span aria-hidden="true" className="absolute bottom-5 left-5 font-serif text-[22px] italic leading-none text-logo-gold">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-logo-gold/50 bg-herbal-base/70 text-logo-gold backdrop-blur-sm transition-all duration-500 group-hover:rotate-45 group-hover:border-logo-gold group-hover:bg-logo-gold group-hover:text-herbal-base">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="px-1 pt-6">
        <h3 className="font-serif text-[26px] font-medium leading-tight text-white transition-colors duration-300 group-hover:text-logo-gold">{name}</h3>
        {showText && shortDescription && (
          <p className="mt-3 border-t border-leaf/30 pt-3 text-[15px] leading-relaxed text-mist">{shortDescription}</p>
        )}
      </div>
    </Link>
  )
}

/** Arch-topped image card used for service categories. `variant="logo"`: the logo-palette card. */
export default function ServiceCard({ service, showText = true, variant, index }) {
  if (variant === 'logo') return <LogoServiceCard service={service} index={index} showText={showText} />
  const { slug, name, shortDescription, image } = service
  return (
    <Link to={`/services/${slug}`} className="group flex h-full flex-col focus-visible:outline-none" aria-label={`${name} — learn more`}>
      <div className="arch relative aspect-[4/5] overflow-hidden bg-muted ring-primary ring-offset-4 ring-offset-background transition-[transform,box-shadow] duration-500 ease-premium group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_50px_-30px_rgba(7,8,7,0.5)] group-focus-visible:ring-2">
        {image && (
          <img
            src={mediaUrl(image)}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-white text-herbal-base shadow-md transition-all duration-500 group-hover:rotate-45 group-hover:bg-accent group-hover:text-white">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="px-1 pt-6">
        <h3 className="font-sans text-[20px] font-semibold leading-snug transition-colors duration-300 group-hover:text-primary">{name}</h3>
        {showText && shortDescription && <p className="mt-2 text-[15px] leading-relaxed text-text-soft">{shortDescription}</p>}
      </div>
    </Link>
  )
}
