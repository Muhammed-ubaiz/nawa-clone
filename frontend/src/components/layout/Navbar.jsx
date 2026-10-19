import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { navLinks } from '../../data/site'
import { useServices } from '../../context/ServicesContext'

const linkBase =
  'relative inline-flex items-center gap-1 py-2 text-[14px] font-medium leading-none tracking-[0.01em] transition-colors duration-300 ease-premium after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#DDA83B] after:transition-transform after:duration-500 after:ease-premium hover:after:scale-x-100'

/** Desktop navigation with an accessible hover/click/keyboard Services dropdown. */
export default function Navbar() {
  const { services } = useServices()
  // The header is always dark: pale-mint links that warm to gold; the current page is white
  // with a gold underline.
  const idle = 'text-[#C2DDD4] hover:text-[#DDA83B] duration-200'
  const current = 'text-white after:scale-x-100'
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const closeTimer = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const enter = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-7 xl:gap-9">
        {navLinks.map((item) =>
          item.dropdown ? (
            <li key={item.to} ref={wrapRef} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
              <div className="flex items-center">
                <NavLink
                  to={item.to}
                  className={() =>
                    `${linkBase} ${pathname.startsWith('/services') ? current : idle}`
                  }
                >
                  {item.label}
                </NavLink>
                <button
                  type="button"
                  aria-label="Toggle services menu"
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls="services-menu"
                  onClick={() => setOpen((o) => !o)}
                  className="ml-0.5 grid h-7 w-6 place-items-center rounded text-[#C2DDD4] transition-colors duration-200 hover:text-[#DDA83B]"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              </div>

              <div
                id="services-menu"
                className={`absolute left-1/2 top-full z-50 w-[280px] -translate-x-1/2 pt-4 transition-all duration-300 ${
                  open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'
                }`}
              >
                <ul className="overflow-hidden rounded-[20px] border border-[#18795A]/30 bg-[#08231C]/95 p-2 text-[#C2DDD4] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <NavLink
                        to={`/services/${s.slug}`}
                        tabIndex={open ? 0 : -1}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium leading-tight transition-colors duration-200 hover:bg-[#18795A]/20 hover:text-[#DDA83B] ${
                            isActive ? 'bg-[#18795A]/25 text-white' : 'text-[#C2DDD4]'
                          }`
                        }
                      >
                        {s.name}
                      </NavLink>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-[#18795A]/30 pt-1">
                    <Link
                      to="/services"
                      tabIndex={open ? 0 : -1}
                      className="block rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DDA83B] transition-colors duration-200 hover:bg-[#18795A]/20"
                    >
                      View all services &rarr;
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          ) : (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `${linkBase} ${isActive ? current : idle}`}
              >
                {item.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}
