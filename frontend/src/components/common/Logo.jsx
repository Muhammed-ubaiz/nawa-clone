import { Link } from 'react-router-dom'
import { site } from '../../data/site'

/**
 * The official full Nawa Ayurvedic Medical Centre logo — one asset everywhere.
 * Variants only change the rendered size; the artwork, colours and aspect ratio
 * are never altered (height/width auto + object-contain, never object-cover).
 */
const VARIANTS = {
  header: 'h-[68px] w-auto lg:h-[80px]', // ≈119px / 140px wide
  drawer: 'h-[60px] w-auto', // mobile menu
  footer: 'h-auto w-[170px]',
  admin: 'h-auto w-[180px] max-w-full', // admin sidebar
  adminHeader: 'h-11 w-auto', // admin top bar on mobile/tablet
  login: 'h-auto w-[210px] max-w-full',
  loader: 'h-auto w-[160px]',
}

/** Just the <img>, for places that are not links (loaders). */
export function LogoImage({ variant = 'header', className = '', ...rest }) {
  const { src, alt, width, height } = site.logo
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      className={`${className || VARIANTS[variant]} object-contain`}
      {...rest}
    />
  )
}

/**
 * Logo linking home (or `to`). `imgClassName` overrides the variant size,
 * e.g. for the smaller sticky header.
 */
export default function Logo({ variant = 'header', to = '/', imgClassName = '', className = '', onClick, label }) {
  const image = <LogoImage variant={variant} className={imgClassName} />

  return (
    <Link to={to} onClick={onClick} aria-label={label || `${site.logo.alt} — home`} className={`inline-flex shrink-0 items-center ${className}`}>
      {variant === 'footer' ? (
        // White plate keeps the original gold/green artwork legible on the dark footer.
        <span className="inline-flex rounded-[24px] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(7,8,7,0.35)]">{image}</span>
      ) : (
        image
      )}
    </Link>
  )
}
