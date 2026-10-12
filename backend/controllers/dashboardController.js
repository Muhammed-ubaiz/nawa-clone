import Appointment from '../models/Appointment.js'
import Blog from '../models/Blog.js'
import Contact from '../models/Contact.js'
import Service from '../models/Service.js'
import { countBy, project, sortBy } from '../utils/query.js'

/** GET /api/dashboard (admin) — headline counts plus recent activity. */
export async function getDashboard(_req, res) {
  const [appointments, blogs, totalContacts, newContacts, totalServices] = await Promise.all([
    Appointment.find(),
    Blog.find(),
    Contact.count(),
    Contact.count({ status: 'New' }),
    Service.count(),
  ])

  const counts = countBy(appointments, 'status')

  res.json({
    success: true,
    data: {
      stats: {
        totalAppointments: appointments.length,
        pendingAppointments: counts.Pending || 0,
        confirmedAppointments: counts.Confirmed || 0,
        completedAppointments: counts.Completed || 0,
        cancelledAppointments: counts.Cancelled || 0,
        totalBlogs: blogs.length,
        publishedBlogs: blogs.filter((b) => b.published).length,
        totalContacts,
        newContacts,
        totalServices,
      },
      recentAppointments: sortBy(appointments, { createdAt: -1 }).slice(0, 5),
      recentBlogs: sortBy(blogs, { createdAt: -1 })
        .slice(0, 5)
        .map((b) => project(b, ['title', 'slug', 'category', 'published', 'createdAt'])),
    },
  })
}
