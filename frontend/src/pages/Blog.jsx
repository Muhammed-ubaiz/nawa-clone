import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { images, spacePhotos } from '../data/images'
import { blogsApi } from '../services/api'
import { useSEO } from '../hooks/useSEO'
import BlogCard from '../components/blog/BlogCard'
import BlogGrid, { BlogGridSkeleton } from '../components/blog/BlogGrid'
import Button from '../components/common/Button'
import Reveal from '../components/common/Reveal'
import { EmptyState, ErrorState } from '../components/common/StatusMessage'
import StoryHero from '../components/sections/StoryHero'

// Hero chapters: they change with scroll (shared story engine, as on the About page).
const CHAPTERS = [
  {
    eyebrow: 'Insights & Wellness',
    title: (
      <>
        Wellness <em className="font-normal italic text-logo-gold">Wisdom</em>
      </>
    ),
    text: 'Practical guidance, seasonal tips and insights into Ayurvedic healing — written by our therapists.',
  },
  {
    eyebrow: 'Seasonal Guidance',
    title: (
      <>
        Living in <em className="font-normal italic text-logo-gold">Rhythm</em>
      </>
    ),
    text: 'Simple Ayurvedic routines, foods and self-care rituals to help you stay balanced through every season.',
  },
  {
    eyebrow: 'From Our Therapists',
    title: (
      <>
        Knowledge for <em className="font-normal italic text-logo-gold">Everyday</em> Healing
      </>
    ),
    text: 'Explore treatments, wellbeing and everyday Ayurveda — then book a consultation whenever you are ready.',
    actions: [{ to: '/appointment', label: 'Book a Consultation' }],
  },
]

const PAGE_SIZE = 7 // 1 featured + 6 cards on the first page

export default function Blog() {
  useSEO({
    title: 'Blog — Therapist Tips & Wellness Wisdom',
    description: 'Ayurveda articles, wellness tips and treatment guides from the practitioners at Nawa Ayurveda, Abu Dhabi.',
    image: images.blogResults,
  })

  const [category, setCategory] = useState('All')
  const [categories, setCategories] = useState(['All'])
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('loading') // loading | ready | error | more
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  // Load page 1 whenever the category changes (or on retry).
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    blogsApi
      .list({ page: 1, limit: PAGE_SIZE, category: category === 'All' ? undefined : category }, { signal: controller.signal })
      .then((res) => {
        setPosts(res.data)
        setPage(1)
        setPages(res.pagination.pages)
        if (category === 'All') setCategories(['All', ...res.categories])
        setStatus('ready')
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err)
        setStatus('error')
      })
    return () => controller.abort()
  }, [category, attempt])

  const loadMore = async () => {
    setStatus('more')
    try {
      const res = await blogsApi.list({ page: page + 1, limit: PAGE_SIZE, category: category === 'All' ? undefined : category })
      setPosts((p) => [...p, ...res.data])
      setPage(res.pagination.page)
      setPages(res.pagination.pages)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('ready')
    }
  }

  const showFeatured = category === 'All' && posts.length > 0
  const [featured, ...rest] = posts
  const grid = showFeatured ? rest : posts

  // .theme-logo (index.css) re-points the theme tokens at the logo palette for the whole page.
  return (
    <div className="theme-logo">
      {/* Hero: the About page's split story hero (logo theme) — the oil-lamp photo dissolving in
          from the right, three chapters that change with scroll, breadcrumb and progress at the foot */}
      <StoryHero
        label="Nawa Ayurveda Blog"
        layout="split"
        theme="logo"
        chapters={CHAPTERS}
        media={
          <img
            src={spacePhotos.lamp.src}
            srcSet={spacePhotos.lamp.srcSet}
            sizes="(min-width: 1280px) 64vw, (min-width: 1024px) 70vw, 100vw"
            alt={spacePhotos.lamp.alt}
            fetchPriority="high"
            decoding="async"
            className="about-hero-media h-full w-full object-cover object-[60%_50%]"
          />
        }
        footer={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/55 sm:text-[11.5px]">
              <li>
                <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-logo-gold">/</li>
              <li aria-current="page" className="text-mist/90">Blog</li>
            </ol>
          </nav>
        }
      />

      <section className="relative isolate overflow-hidden bg-herbal-base py-16 md:py-20 lg:py-24" aria-label="Articles">
        <div
          aria-hidden="true"
          className="edge-fade pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(circle at 12% 20%, rgba(24,121,90,0.14), transparent 40%), radial-gradient(circle at 88% 60%, rgba(221,168,59,0.06), transparent 40%)' }}
        />
        <div className="container-x">
          {status === 'loading' && <BlogGridSkeleton count={6} />}

          {status === 'error' && <ErrorState message={error?.message} onRetry={() => setAttempt((a) => a + 1)} />}

          {(status === 'ready' || status === 'more') && (
            <>
              {showFeatured && (
                <Reveal className="mb-16">
                  <p className="mb-6 flex items-center gap-4 leading-none">
                    <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">Featured Article</span>
                  </p>
                  <BlogCard post={featured} featured variant="logo" />
                </Reveal>
              )}

              <div className="mb-10 flex flex-col gap-6 border-t border-leaf/30 pt-12 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="flex items-center gap-4 leading-none">
                    <span aria-hidden="true" className="h-px w-10 bg-logo-gold sm:w-14" />
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-logo-gold">The Journal</span>
                  </p>
                  <h2 className="mt-5 font-serif text-[36px] font-medium leading-tight !text-white md:text-[48px]">
                    {category === 'All' ? (
                      <>
                        Latest <em className="font-normal italic text-logo-gold">Articles</em>
                      </>
                    ) : (
                      category
                    )}
                  </h2>
                </div>
                {categories.length > 1 && (
                  // Mobile: one swipeable row, edge to edge — no visible scrollbar, chips snap to the left
                  // gutter, a short fade on the right hints at more, and a trailing spacer keeps the last
                  // chip off the screen edge. md+: wraps and right-aligns as before.
                  <div
                    role="tablist"
                    aria-label="Filter by category"
                    className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] [scrollbar-width:none] after:w-2 after:shrink-0 after:content-[''] [&::-webkit-scrollbar]:hidden md:mx-0 md:snap-none md:flex-wrap md:justify-end md:px-0 md:[mask-image:none] md:after:hidden"
                  >
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={category === c}
                        onClick={() => setCategory(c)}
                        className={`shrink-0 snap-start rounded-full border px-5 py-2.5 text-[13px] font-semibold leading-none transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-gold ${
                          category === c
                            ? 'border-logo-gold bg-logo-gold text-herbal-base'
                            : 'border-leaf/40 bg-leaf/10 text-mist hover:border-logo-gold/60 hover:text-logo-gold'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {grid.length ? (
                <BlogGrid posts={grid} variant="logo" />
              ) : (
                !showFeatured && <EmptyState title="No articles yet" message="New wellness articles will appear here soon." />
              )}

              {page < pages && (
                <div className="mt-14 text-center">
                  <Button variant="brand" icon={null} loading={status === 'more'} onClick={loadMore}>
                    {status === 'more' ? 'Loading…' : 'Load More Articles'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
