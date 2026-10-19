import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, Phone } from 'lucide-react'
import { site } from '../../data/site'
import Logo from '../common/Logo'
import Navbar from './Navbar'
import MobileMenu from './MobileMenu'
import Button from '../common/Button'

/**
 * Fixed site header in the Nawa logo palette: a dark #08231C glass bar with a thin leaf-green
 * rule. It is fully transparent only at the very top of a dark hero (home video, About story).
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [overDark, setOverDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const close = useCallback(() => setMenuOpen(false), [])
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Home opens on a dark video hero, and pages can mark a dark section with [data-header-dark]
  // (the About story): at the very top of either the bar dissolves into it; everywhere else it
  // is the dark glass.
  const clear = !scrolled && (isHome || overDark)
  const progressRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 20) // React skips the render when the value is unchanged
      const dark = document.querySelector('[data-header-dark]')
      setOverDark(!!dark && dark.getBoundingClientRect().bottom > 80)
      // Home-only reading progress: written straight to the DOM (no re-render per scroll).
      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-premium ${
          pathname === '/about' ? 'header-drop' : ''
        } ${
          clear
            ? 'border-transparent bg-transparent'
            : 'border-[#18795A]/25 bg-[#08231C]/75 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.6)] backdrop-blur-lg'
        }`}
      >
        {isHome && (
          <span
            ref={progressRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-[-1px] h-[2px] origin-left scale-x-0 bg-[#DDA83B] transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div
          className={`container-x flex items-center justify-between gap-6 transition-[height] duration-500 ease-premium ${
            scrolled ? 'h-[76px]' : 'h-[88px] lg:h-[100px]'
          }`}
        >
          <Logo
            variant="header"
            imgClassName={`w-auto transition-[height] duration-500 ${scrolled ? 'h-[60px]' : 'h-[68px] lg:h-[80px]'}`}
          />
          <Navbar />
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3 xl:gap-5">
            <a
              href={site.phoneHref}
              className="group hidden items-center gap-2 text-[14px] font-semibold text-[#C2DDD4] transition-colors duration-200 hover:text-[#DDA83B] xl:inline-flex"
            >
              <Phone className="h-4 w-4 text-[#DDA83B] transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true" />
              {site.phone}
            </a>
            {/* Booking CTA — tablets/desktop: the full "Appointment" pill (wrapped, because the
                Button's own inline-flex would override `hidden`); phones: a compact "Book" pill sized
                to sit beside the menu button without crowding (fits from 320px). */}
            <span className="hidden sm:block">
              <Button to="/appointment" variant="brand" size="sm" className="!text-[#08231C] shadow-md">
                Appointment
              </Button>
            </span>
            <Link
              to="/appointment"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#DDA83B] px-4 text-[12.5px] font-semibold tracking-[0.02em] text-[#08231C] shadow-md transition-colors duration-300 hover:bg-[#e5b34a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DDA83B] sm:hidden"
              aria-label="Book an appointment"
            >
              Book
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#DDA83B]/50 sm:h-11 sm:w-11 bg-[#18795A]/30 text-[#C2DDD4] backdrop-blur-sm transition-colors duration-300 hover:bg-[#DDA83B] hover:text-[#08231C] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={close} />
    </>
  )
}
