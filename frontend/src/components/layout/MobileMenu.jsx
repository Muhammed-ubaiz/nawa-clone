import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, Clock, Phone, X } from 'lucide-react'
import { navLinks, site } from '../../data/site'
import { useServices } from '../../context/ServicesContext'
import Logo from '../common/Logo'
import Button from '../common/Button'
import BrandLinks from '../common/BrandLinks'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Full-screen slide-in mobile navigation in the logo palette. An editorial index: gold "Menu"
 * eyebrow; each link is a row of gold italic numeral, large serif label and a quiet arrow that
 * warms to gold; the current page is gold with a short gold bar. Services opens an accordion of
 * the treatments (gold dots). The rows rise in, staggered, when the drawer opens (.mm-item in
 * index.css). Foot: phone + hours, gold booking button, social links.
 */
export default function MobileMenu({ open, onClose }) {
  const { services } = useServices()
  const { pathname } = useLocation()
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  /** One index row: numeral, label, trailing control (arrow or accordion toggle). */
  const row = (item, i, active, trailing) => (
    <div className="group relative flex items-center gap-4">
      {/* Gold bar on the current page */}
      <span
        aria-hidden="true"
        className={`absolute -left-4 top-1/2 h-6 w-[2px] -translate-y-1/2 bg-[#DDA83B] transition-opacity duration-300 sm:-left-6 ${active ? 'opacity-100' : 'opacity-0'}`}
      />
      <span aria-hidden="true" className={`w-6 shrink-0 font-serif text-[13px] italic leading-none transition-colors duration-300 ${active ? 'text-[#DDA83B]' : 'text-[#DDA83B]/45 group-hover:text-[#DDA83B]/80'}`}>
        {pad(i + 1)}
      </span>
      <NavLink
        to={item.to}
        end={item.to === '/' || !!item.dropdown}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={({ isActive }) =>
          `flex-1 py-[15px] font-serif text-[23px] font-medium [@media(max-height:700px)]:py-3 [@media(max-height:700px)]:text-[21px] leading-none tracking-[0.01em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B] ${
            isActive || active ? 'text-[#DDA83B]' : 'text-[#F6F2E9]/90 group-hover:text-[#DDA83B]'
          }`
        }
      >
        {item.label}
      </NavLink>
      {trailing}
    </div>
  )

  const arrow = (
    <ArrowUpRight
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-[#C2DDD4]/30 transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#DDA83B]"
    />
  )

  return (
    <div className={`fixed inset-0 z-[60] lg:hidden ${open ? 'visible' : 'invisible'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={open ? 'true' : 'false'}
        className={`mm absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-[#18795A]/25 bg-[#08231C] text-[#C2DDD4] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-md ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Soft brand light: leaf green high, gold low */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 12% 12%, rgba(24,121,90,0.20), transparent 50%), radial-gradient(circle at 95% 92%, rgba(221,168,59,0.08), transparent 45%)' }}
        />

        <div className="relative flex items-center justify-between border-b border-[#18795A]/25 px-4 py-3.5 sm:px-6">
          <Logo variant="drawer" onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            tabIndex={open ? 0 : -1}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#DDA83B]/50 bg-[#18795A]/20 text-[#DDA83B] transition-colors duration-300 hover:border-[#DDA83B] hover:bg-[#DDA83B] hover:text-[#08231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DDA83B]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* One scroll area: links, then the foot pinned to the bottom on tall screens (mt-auto) and
            simply following the links on short ones — so the list is never squeezed. */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <nav aria-label="Mobile" className="px-4 pb-6 pt-7 sm:px-6 [@media(max-height:700px)]:pt-5">
          <p className="mm-item flex items-center gap-3 text-[11px] font-semibold uppercase leading-none tracking-[0.25em] text-[#DDA83B]" style={{ '--i': 0 }}>
            <span aria-hidden="true" className="h-px w-8 bg-[#DDA83B]" />
            Menu
          </p>
          <ul className="mt-4">
            {navLinks.map((item, i) => {
              const active = item.dropdown ? pathname.startsWith('/services') : item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
              return (
                <li key={item.to} className="mm-item border-b border-[#18795A]/20" style={{ '--i': i + 1 }}>
                  {item.dropdown ? (
                    <>
                      {row(
                        item,
                        i,
                        active,
                        <button
                          type="button"
                          onClick={() => setServicesOpen((o) => !o)}
                          aria-expanded={servicesOpen}
                          aria-controls="mobile-services"
                          aria-label="Toggle services submenu"
                          tabIndex={open ? 0 : -1}
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DDA83B] ${
                            servicesOpen ? 'border-[#DDA83B] bg-[#DDA83B] text-[#08231C]' : 'border-[#DDA83B]/45 text-[#DDA83B] hover:bg-[#DDA83B]/15'
                          }`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>,
                      )}
                      <div
                        id="mobile-services"
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          servicesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <ul className="overflow-hidden">
                          <li className="ml-10 border-l border-[#18795A]/35 pb-3 pl-4 pt-0.5">
                            <ul className="space-y-0.5">
                              {services.map((s) => (
                                <li key={s.slug}>
                                  <NavLink
                                    to={`/services/${s.slug}`}
                                    onClick={onClose}
                                    tabIndex={servicesOpen && open ? 0 : -1}
                                    className={({ isActive }) =>
                                      `group/s flex items-center gap-3 py-1.5 text-[14px] font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DDA83B] ${
                                        isActive ? 'text-[#DDA83B]' : 'text-[#C2DDD4]/80 hover:text-[#DDA83B]'
                                      }`
                                    }
                                  >
                                    <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#DDA83B]/70 transition-transform duration-300 group-hover/s:scale-150" />
                                    {s.name}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    row(item, i, active, arrow)
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mm-item relative mt-auto border-t border-[#18795A]/25 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6" style={{ '--i': navLinks.length + 1 }}>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <a
              href={site.phoneHref}
              tabIndex={open ? 0 : -1}
              className="group flex items-center gap-3 text-[15px] font-semibold text-[#F6F2E9] transition-colors hover:text-[#DDA83B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDA83B]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[#DDA83B]/45 text-[#DDA83B] transition-colors duration-300 group-hover:bg-[#DDA83B] group-hover:text-[#08231C]">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              {site.phone}
            </a>
            <p className="flex items-center gap-2 text-[12.5px] text-[#C2DDD4]/75">
              <Clock className="h-3.5 w-3.5 text-[#DDA83B]" aria-hidden="true" />
              {site.hours}
            </p>
          </div>
          <Button to="/appointment" variant="brand" className="mt-5 w-full !text-[#08231C]" onClick={onClose} tabIndex={open ? 0 : -1}>
            Book Appointment
          </Button>
          <BrandLinks
            className="mt-5 justify-center"
            itemClass="border border-[#18795A]/40 bg-[#18795A]/15 text-[#C2DDD4] hover:border-[#DDA83B] hover:bg-[#DDA83B] hover:text-[#08231C]"
          />
        </div>
        </div>
      </div>
    </div>
  )
}
