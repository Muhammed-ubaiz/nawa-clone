import Reveal from '../common/Reveal'
import BlogCard from './BlogCard'

/** Three-column grid of blog cards. `variant` is passed to each BlogCard. */
export default function BlogGrid({ posts, className = '', variant }) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {posts.map((b, i) => (
        <Reveal key={b._id || b.slug} delay={(i % 3) * 100}>
          <BlogCard post={b} variant={variant} />
        </Reveal>
      ))}
    </div>
  )
}

/** Placeholder cards shown while articles load. */
export function BlogGridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[25px] border border-border">
          <div className="aspect-[16/11] animate-pulse bg-muted" />
          <div className="space-y-3 p-7">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-5/6 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
