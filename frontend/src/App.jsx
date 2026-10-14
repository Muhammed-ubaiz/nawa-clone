import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import PageLoader from './components/common/PageLoader'
import ProtectedRoute from './components/admin/ProtectedRoute'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import ServiceDetails from './pages/ServiceDetails'
import Programs from './pages/Programs'
import Blog from './pages/Blog'
import BlogDetails from './pages/BlogDetails'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

// Admin code is split out so public visitors never download it.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'))
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'))
const AddBlog = lazy(() => import('./pages/admin/AddBlog'))
const EditBlog = lazy(() => import('./pages/admin/EditBlog'))
const AdminServices = lazy(() => import('./pages/admin/Services'))
const AdminContacts = lazy(() => import('./pages/admin/Contacts'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))

/** Legacy /service/:slug links redirect to the canonical /services/:slug. */
function LegacyServiceRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/services/${slug}`} replace />
}

export default function App() {
  // Only admin pages are lazy-loaded, so this fallback is admin-only: pure white.
  return (
    <Suspense fallback={<PageLoader fullScreen background="bg-white" />}>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetails />} />
          <Route path="service/:slug" element={<LegacyServiceRedirect />} />
          <Route path="programs" element={<Programs />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="contact-us" element={<Navigate to="/contact" replace />} />
          <Route path="appointment" element={<Appointment />} />
          <Route path="privacy-policy" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin (separate layout, Firebase Auth-protected) */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="blogs/add" element={<AddBlog />} />
            <Route path="blogs/edit/:id" element={<EditBlog />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
