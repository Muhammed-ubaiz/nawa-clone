import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTop, { ScrollManager } from '../common/ScrollToTop'

/** Shell for the public website: header, page outlet, footer. */
export default function PublicLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-primary px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="overflow-x-clip">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  )
}
