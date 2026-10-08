import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { images } from '../../data/images'
import { formatShortDate, mediaUrl } from '../../utils/format'
import Reveal from '../common/Reveal'

/*
 * Home page blog: one featured article (left) + compact horizontal articles (right).
 * Uses the same post fields, images (with the same `images.herbs` fallback) and /blog/:slug links
 * as BlogCard; the Blog page keeps BlogCard/BlogGrid unchanged.
 * Logo palette: leaf-green photo frames (warm herbal tint, deep foot) that warm to gold, gold
 * categories and read links, white serif titles warming to gold, mint excerpts, leaf rules.
 */

/** Photo frame shared by both article sizes. */
function Cover({ post, href, className = '', imgClassName = '', badge }) {
  return (
    <Link
      to={href}
      tabIndex={-1}
      aria-hidden="true"
      className={`relative block overflow-hidden border border-leaf/35 bg-[#0c2f24] transition-[border-color] duration-500 group-hover:border-logo-gold/50 ${className}`}
    >
      <img
        src={cover(post)}
        alt=""
        loading="lazy"
        decoding="async"
        className={`w-full object-cover object-center saturate-[0.85] transition-transform duration-[900ms] ease-premium md:group-hover:scale-[1.04] ${imgClassName}`}
      />
      <span className="pointer-events-none absolute inset-0 bg-herbal-base/20 mix-blend-multiply" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-herbal-base/70 to-transparent" />
      {badge && (
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-logo-gold/40 bg-herbal-base/75 px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-logo-gold backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-logo-gold" />
          {badge}
        </span>
      )}
    </Link>
  )
}

const cover = (post) => mediaUrl(post.featuredImage) || images.herbs

/** "AYURVEDA • 05 OCT 2026" — small, tracked, muted. */
function Meta({ post, className = '' }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}>
      {post.category && <span className="text-logo-gold">{post.category}</span>}
      {post.category && post.createdAt && (
        <span aria-hidden="true" className="text-logo-gold/40">
          &bull;
        </span>
      )}
      {post.createdAt && (
        <time dateTime={post.createdAt} className="text-mist/70">
          {formatShortDate(post.createdAt)}
        </time>
      )}
    </p>
  )
}

/** Text link with an underline that grows and an arrow that nudges right on the card's hover. */
function ReadLink({ to, title, label = 'Read Article' }) {
  return (
    <Link
      to={to}
      className="group/read inline-flex items-center gap-2 rounded-sm text-[13px] font-semibold uppercase tracking-[0.16em] text-mist transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold"
    >
      <span className="relative pb-1">
        {label}
        <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-[0.35] bg-logo-gold transition-transform duration-500 ease-premium group-hover:scale-x-100 group-hover/read:scale-x-100" />
      </span>
      <ArrowRight className="h-4 w-4 text-logo-gold transition-transform duration-500 ease-premium group-hover:translate-x-1 group-hover/read:translate-x-1" aria-hidden="true" />
      <span className="sr-only">: {title}</span>
    </Link>
  )
}

function FeaturedArticle({ post }) {
  const href = `/blog/${post.slug}`
  return (
    <article className="group">
      <Cover post={post} href={href} badge="Featured" className="rounded-[22px]" imgClassName="aspect-[4/3] lg:aspect-[16/11]" />
      <div className="pt-8 lg:pr-10">
        <Meta post={post} />
        <h3 className="mt-4 font-serif text-[31px] font-medium leading-[1.15] text-white transition-transform duration-500 ease-premium md:text-[40px] md:group-hover:-translate-y-0.5 xl:text-[44px]">
          <Link to={href} className="transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-4 line-clamp-3 max-w-[620px] text-[16px] leading-[1.8] text-mist">{post.excerpt}</p>}
        <div className="mt-7">
          <ReadLink to={href} title={post.title} />
        </div>
      </div>
    </article>
  )
}

function CompactArticle({ post }) {
  const href = `/blog/${post.slug}`
  return (
    <article className="group grid gap-5 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] sm:items-center md:grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-7">
      <Cover post={post} href={href} className="rounded-[16px]" imgClassName="aspect-[4/3] lg:aspect-[4/5]" />
      <div>
        <Meta post={post} />
        <h3 className="mt-3 font-serif text-[24px] font-medium leading-[1.25] text-white transition-transform duration-500 ease-premium md:group-hover:-translate-y-0.5 xl:text-[25px]">
          <Link to={href} className="transition-colors duration-300 hover:text-logo-gold group-hover:text-logo-gold">
            {post.title}
          </Link>
        </h3>
        <div className="mt-4">
          <ReadLink to={href} title={post.title} label="Read More" />
        </div>
      </div>
    </article>
  )
}

/** Featured + secondary layout for up to three posts. */
export default function HomeBlogEditorial({ posts }) {
  const [featured, ...rest] = posts
  return (
    <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
      <Reveal className="lg:col-span-7">
        <FeaturedArticle post={featured} />
      </Reveal>
      {rest.length > 0 && (
        <div className="grid gap-10 border-t border-leaf/30 pt-10 md:grid-cols-2 md:gap-x-8 lg:col-span-5 lg:grid-cols-1 lg:content-start lg:gap-0 lg:border-t-0 lg:pt-0">
          {rest.slice(0, 2).map((post, i) => (
            <Reveal key={post._id || post.slug} delay={120 + i * 110} className={i ? 'lg:border-t lg:border-leaf/30 lg:pt-10' : 'lg:pb-10'}>
              <CompactArticle post={post} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}

/** Loading placeholder in the same shape (no layout jump when posts arrive). */
export function HomeBlogEditorialSkeleton() {
  return (
    <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16" aria-hidden="true">
      <div className="lg:col-span-7">
        <div className="aspect-[4/3] animate-pulse rounded-[20px] bg-muted lg:aspect-[16/11]" />
        <div className="mt-8 h-3 w-40 animate-pulse rounded-full bg-muted" />
        <div className="mt-5 h-8 w-5/6 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-8 w-2/3 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid gap-10 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
        {[0, 1].map((i) => (
          <div key={i} className="grid gap-5 sm:grid-cols-[0.42fr_1fr] sm:items-center md:grid-cols-1 lg:grid-cols-[0.85fr_1fr] lg:gap-7">
            <div className="aspect-[4/3] animate-pulse rounded-[16px] bg-muted lg:aspect-[4/5]" />
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
