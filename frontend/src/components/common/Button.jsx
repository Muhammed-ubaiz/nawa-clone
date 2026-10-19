import { Link } from 'react-router-dom'
import { ArrowUpRight, Loader2 } from 'lucide-react'

const variants = {
  // Mint pill → teal on hover (reference default button)
  primary: 'bg-secondary text-text border-secondary hover:bg-primary hover:border-primary hover:text-white',
  // Gold pill for high-emphasis CTAs
  accent: 'bg-accent text-white border-accent hover:bg-primary hover:border-primary',
  // Teal solid
  dark: 'bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark',
  // Outlined, for light backgrounds
  outline: 'bg-transparent text-text border-text/20 hover:bg-text hover:border-text hover:text-white',
  // Logo-gold pill with deep herbal text; the border warms to leaf green with a soft halo on hover
  brand:
    'bg-logo-gold text-herbal-deep border-logo-gold hover:bg-[#e6b54d] hover:border-leaf hover:shadow-[0_0_0_3px_rgba(24,121,90,0.45),0_18px_40px_-18px_rgba(221,168,59,0.55)] focus-visible:!outline-logo-gold',
  // Cream pill with forest text, for deep-green heroes
  cream: 'bg-cream text-forest border-cream hover:bg-white hover:border-white hover:scale-[1.02] focus-visible:!outline-cream',
  // Outlined, for dark/image backgrounds
  light: 'bg-white/10 text-white border-white/40 backdrop-blur-sm hover:bg-white hover:text-herbal-base',
}

const sizes = {
  sm: 'px-5 py-3 text-[13px]',
  md: 'px-[30px] py-4 text-[14px]',
}

/**
 * Pill button. Renders a router <Link> for internal paths, <a> for external
 * hrefs (tel:, mailto:, http) and <button> otherwise.
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon = ArrowUpRight,
  iconLeft,
  loading = false,
  className = '',
  children,
  ...rest
}) {
  const Icon = loading ? null : icon
  const LeftIcon = loading ? Loader2 : iconLeft
  const cls = `group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border font-semibold leading-none tracking-[0.02em] transition-[background-color,border-color,color,box-shadow,transform,translate,scale] duration-[450ms] ease-premium hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`

  const content = (
    <>
      {LeftIcon && <LeftIcon className={`h-4 w-4 shrink-0 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />}
      <span>{children}</span>
      {Icon && !LeftIcon && (
        <Icon className="h-4 w-4 shrink-0 transition-transform duration-[450ms] ease-premium group-hover:translate-x-1 group-hover:-translate-y-0.5" aria-hidden="true" />
      )}
    </>
  )

  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>
  return (
    <button className={cls} aria-busy={loading || undefined} {...rest} disabled={rest.disabled || loading}>
      {content}
    </button>
  )
}
