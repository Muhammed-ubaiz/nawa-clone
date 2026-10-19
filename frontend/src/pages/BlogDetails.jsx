import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, UserRound } from 'lucide-react'
import { images } from '../data/images'
import { useServices } from '../context/ServicesContext'
import { blogsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useSEO } from '../hooks/useSEO'
import { formatDate, mediaUrl } from '../utils/format'
import { handleImageError } from '../utils/imageFallback'
import BlogContent from '../components/blog/BlogContent'
import BlogGrid from '../components/blog/BlogGrid'
import Button from '../components/common/Button'
import Reveal from '../components/common/Reveal'
import PageLoader from '../components/common/PageLoader'
import { ErrorState } from '../components/common/StatusMessage'
import CTASection from '../components/sections/CTASection'
import NotFound from './NotFound'

export default function BlogDetails() {
  const { slug } = useParams()
  const { services } = useServices()
  const { data, loading, error, reload } = useApi((signal) => blogsApi.getBySlug(slug, { signal }), [slug])
  const post = data?.data
  const related = data?.related ?? []

  useSEO({
    title: post?.title ?? (loading ? 'Blog' : 'Article not found'),
    description: post?.excerpt,
    image: mediaUrl(post?.featuredImage),
  })

  if (loading) return <PageLoader />
  if (error?.status === 404) return <NotFound />
  if (error)
    return (
      <div className="container-x pb-20 pt-40">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    )

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for the whole page,
  // including the article body (.prose-nawa reads them).
  return (
    <div className="theme-logo">
      <article>
        {/* Header: centred on the #08231C canvas with leaf/gold light; the header sits clear over it */}
        <header className="relative isolate overflow-hidden bg-herbal-base pb-16 pt-36 md:pb-20 md:pt-44" data-header-dark="">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, rgba(24,121,90,0.20), transparent 45%), radial-gradient(circle at 80% 85%, rgba(221,168,59,0.08), transparent 40%)',
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-herbal-base" />
          <div className="svh container-x max-w-4xl text-center">
            <Link
              to="/blog"
              className="svh-in group inline-flex items-center gap-2 rounded-full border border-logo-gold/40 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-logo-gold transition-colors duration-300 hover:bg-logo-gold hover:text-herbal-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold"
              style={{ '--d': '100ms' }}
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" /> Back to Blog
            </Link>
            {post.category && (
              <p className="svh-in mt-9 flex items-center justify-center gap-4 leading-none" style={{ '--d': '250ms' }}>
                <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">{post.category}</span>
                <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
              </p>
            )}
            <h1 className="svh-in mt-6 font-serif text-[38px] font-medium leading-[1.08] !text-white [overflow-wrap:anywhere] sm:text-[50px] lg:text-[64px]" style={{ '--d': '400ms' }}>
              {post.title}
            </h1>
            <ul className="svh-in mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[14px] text-mist" style={{ '--d': '550ms' }}>
              {post.author && (
                <li className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                  {post.author}
                </li>
              )}
              <li className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
              </li>
              {post.readTime && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-logo-gold" aria-hidden="true" />
                  {post.readTime}
                </li>
              )}
            </ul>
          </div>
        </header>

        {/* Featured image: leaf frame, warm herbal tint, deep foot. Shown at the upload's own aspect
            ratio (never cropped); the frame hugs the image and tall images are capped by height. */}
        <div className="bg-herbal-base">
          <div className="container-x">
            <div className="mx-auto flex max-w-[1120px] justify-center">
              <div className="relative animate-reveal overflow-hidden rounded-[22px] border border-leaf/35 bg-[#0c2f24] shadow-[0_40px_90px_-44px_rgba(0,0,0,0.8)] md:rounded-[30px]">
              <img
                src={mediaUrl(post.featuredImage) || images.herbs}
                alt={post.title}
                onError={handleImageError}
                className="block h-auto max-h-[760px] w-auto max-w-full saturate-[0.9]"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-herbal-base/15 mix-blend-multiply" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgba(8,35,28,0.5)_100%)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Body + sidebar */}
        <div className="relative isolate overflow-hidden bg-herbal-base">
          <div
            aria-hidden="true"
            className="edge-fade pointer-events-none absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(circle at 15% 30%, rgba(24,121,90,0.12), transparent 40%), radial-gradient(circle at 85% 70%, rgba(221,168,59,0.06), transparent 40%)' }}
          />
          {/* Same 1120px column as the image: article aligns with its left edge, sidebar with its right.
              minmax(0,1fr) lets the article shrink, so long words never cause horizontal scrolling. */}
          <div className="container-x">
            <div className="mx-auto grid max-w-[1120px] gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
            <BlogContent content={post.content} className="article-logo w-full min-w-0 max-w-[720px] text-[17px] leading-[1.9] [overflow-wrap:anywhere]" />
            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              {related.length > 0 && (
                <div className="rounded-[24px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-7 backdrop-blur-sm">
                  <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] !text-logo-gold">Recent Posts</h2>
                  <ul className="mt-5 space-y-4">
                    {related.map((r) => (
                      <li key={r._id}>
                        <Link to={`/blog/${r.slug}`} className="group flex items-center gap-4 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-gold">
                          <img
                            src={mediaUrl(r.featuredImage) || images.herbs}
                            alt=""
                            loading="lazy"
                            onError={handleImageError}
                            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-leaf/40 transition-[box-shadow] duration-300 group-hover:ring-logo-gold/70"
                          />
                          <span className="text-[14px] font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-logo-gold">{r.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-[24px] border border-leaf/35 bg-gradient-to-b from-[#0e3a2c]/60 to-[#0c2f24]/30 p-7 backdrop-blur-sm">
                <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] !text-logo-gold">Services</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {services.map((s) => (
                    <li key={s._id || s.slug}>
                      <Link
                        to={`/services/${s.slug}`}
                        className="inline-block rounded-full border border-leaf/40 bg-leaf/10 px-4 py-2 text-[13px] font-medium text-mist transition-colors duration-300 hover:border-logo-gold/60 hover:text-logo-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-[24px] border border-logo-gold/30 bg-gradient-to-br from-[#0e3a2c] to-herbal-base p-7">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full"
                  style={{ background: 'radial-gradient(closest-side, rgba(221,168,59,0.16), transparent)' }}
                />
                <p className="relative font-serif text-[26px] font-medium leading-tight text-white">
                  Ready to <em className="font-normal italic text-logo-gold">begin?</em>
                </p>
                <p className="relative mt-2 text-[14px] leading-relaxed text-mist">Book a consultation with our practitioners.</p>
                <Button to="/appointment" variant="brand" size="sm" className="relative mt-5 w-full">
                  Book Appointment
                </Button>
              </div>
            </aside>
            </div>
          </div>
        </div>
      </article>

      <div className="bg-herbal-base pt-6">
        <CTASection />
      </div>

      {related.length > 0 && (
        <section className="relative isolate overflow-hidden bg-herbal-base py-20 md:py-24" aria-labelledby="related-posts">
          <div
            aria-hidden="true"
            className="edge-fade pointer-events-none absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(circle at 12% 25%, rgba(24,121,90,0.14), transparent 40%), radial-gradient(circle at 88% 70%, rgba(221,168,59,0.06), transparent 40%)' }}
          />
          <div className="container-x">
            <Reveal className="max-w-2xl">
              <p className="flex items-center gap-4 leading-none">
                <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Keep Reading</span>
              </p>
              <h2 id="related-posts" className="mt-6 font-serif text-[38px] font-medium leading-[1.05] !text-white sm:text-[50px]">
                Related <em className="font-normal italic text-logo-gold">Articles</em>
              </h2>
            </Reveal>
            <BlogGrid posts={related} variant="logo" className="mt-12" />
          </div>
        </section>
      )}
    </div>
  )
}
