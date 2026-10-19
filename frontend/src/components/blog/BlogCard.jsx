import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { images } from '../../data/images'
import { formatDate, mediaUrl } from '../../utils/format'
import { handleImageError } from '../../utils/imageFallback'

/**
 * Logo-palette card (Blog page): deep-green glass panel with a leaf frame that warms to gold,
 * tinted photo with a gold category pill, gold calendar + mint meta, white serif title warming
 * to gold, mint excerpt, and a gold "Read Article" cue over a leaf rule.
 */
function LogoBlogCard({ post, featured }) {
  const { slug, title, category, createdAt, featuredImage, excerpt, readTime } = post
  return (
    <article
      className={`group flex h-full overflow-hidden rounded-[24px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-500 ease-premium hover:-translate-y-1.5 hover:border-logo-gold/50 hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.75)] ${
        featured ? 'flex-col lg:flex-row' : 'flex-col'
      }`}
    >
      <Link
        to={`/blog/${slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block overflow-hidden bg-[#0c2f24] ${featured ? 'aspect-[16/10] lg:aspect-auto lg:w-1/2' : 'aspect-[16/11]'}`}
      >
        <img
          src={mediaUrl(featuredImage) || images.herbs}
          alt=""
          loading="lazy"
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover saturate-[0.85] transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
        />
        <span className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/70 to-transparent" />
        {category && (
          <span className="label-caps absolute left-4 top-4 rounded-full border border-logo-gold/40 bg-herbal-base/75 px-3 py-1.5 text-logo-gold backdrop-blur-sm">
            {category}
          </span>
        )}
      </Link>
      <div className={`flex flex-1 flex-col p-6 md:p-7 ${featured ? 'lg:justify-center lg:p-12' : ''}`}>
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-mist/80">
          <CalendarDays className="h-4 w-4 text-logo-gold" aria-hidden="true" />
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          {readTime && <span aria-hidden="true" className="text-logo-gold/50">&middot;</span>}
          {readTime && <span>{readTime}</span>}
        </p>
        <h3 className={`mt-3 font-serif font-medium leading-tight text-white ${featured ? 'text-[31px] md:text-[42px]' : 'text-[25px]'}`}>
          <Link to={`/blog/${slug}`} className="transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold">
            {title}
          </Link>
        </h3>
        {excerpt && <p className={`mt-3 line-clamp-3 leading-relaxed text-mist ${featured ? 'text-[16px] md:text-[17px]' : 'text-[15px]'}`}>{excerpt}</p>}
        <Link
          to={`/blog/${slug}`}
          className="mt-auto flex items-center justify-between gap-4 border-t border-leaf/30 pt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
        >
          <span>Read Article</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-logo-gold/50 text-logo-gold transition-colors duration-300 group-hover:bg-logo-gold group-hover:text-herbal-base">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="sr-only">: {title}</span>
        </Link>
      </div>
    </article>
  )
}

/** Blog card. `variant="logo"`: the logo-palette card (Blog page). */
export default function BlogCard({ post, featured = false, variant }) {
  if (variant === 'logo') return <LogoBlogCard post={post} featured={featured} />
  const { slug, title, category, createdAt, featuredImage, excerpt, readTime } = post
  return (
    <article
      className={`group flex h-full overflow-hidden rounded-[25px] border border-border bg-white transition-[transform,box-shadow,border-color] duration-500 ease-premium hover:-translate-y-1.5 hover:border-border/40 hover:shadow-[0_26px_52px_-30px_rgba(7,8,7,0.4)] ${
        featured ? 'flex-col lg:flex-row' : 'flex-col'
      }`}
    >
      <Link
        to={`/blog/${slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block overflow-hidden bg-muted ${featured ? 'aspect-[16/10] lg:aspect-auto lg:w-1/2' : 'aspect-[16/11]'}`}
      >
        <img
          src={mediaUrl(featuredImage) || images.herbs}
          alt=""
          loading="lazy"
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
        />
        {category && <span className="label-caps absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-primary">{category}</span>}
      </Link>
      <div className={`flex flex-1 flex-col p-6 md:p-7 ${featured ? 'lg:justify-center lg:p-12' : ''}`}>
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-text-soft">
          <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          {readTime && <span aria-hidden="true">&middot;</span>}
          {readTime && <span>{readTime}</span>}
        </p>
        <h3 className={`mt-3 font-serif leading-tight ${featured ? 'text-[31px] md:text-[40px]' : 'text-[24px]'}`}>
          <Link to={`/blog/${slug}`} className="transition-colors duration-300 hover:text-primary">
            {title}
          </Link>
        </h3>
        {excerpt && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-text-soft">{excerpt}</p>}
        <Link
          to={`/blog/${slug}`}
          className="mt-auto inline-flex items-center gap-2 pt-5 text-[14px] font-semibold text-text transition-colors hover:text-primary"
        >
          Read More
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          <span className="sr-only">about {title}</span>
        </Link>
      </div>
    </article>
  )
}
