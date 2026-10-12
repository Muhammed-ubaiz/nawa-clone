import Appointment from '../models/Appointment.js'
import Blog from '../models/Blog.js'
import Contact from '../models/Contact.js'
import Service from '../models/Service.js'

/** GET /api/dashboard (admin) — headline counts plus recent activity. */
export async function getDashboard(_req, res) {
  const [byStatus, totalAppointments, totalBlogs, publishedBlogs, totalContacts, newContacts, totalServices, recentAppointments, recentBlogs] =
    await Promise.all([
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.countDocuments(),
      Blog.countDocuments(),
      Blog.countDocuments({ published: true }),
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'New' }),
      Service.countDocuments(),
      Appointment.find().sort({ createdAt: -1 }).limit(5).lean(),
      Blog.find().select('title slug category published createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    ])

  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]))

  res.json({
    success: true,
    data: {
      stats: {
        totalAppointments,
        pendingAppointments: counts.Pending || 0,
        confirmedAppointments: counts.Confirmed || 0,
        completedAppointments: counts.Completed || 0,
        cancelledAppointments: counts.Cancelled || 0,
        totalBlogs,
        publishedBlogs,
        totalContacts,
        newContacts,
        totalServices,
      },
      recentAppointments,
      recentBlogs,
    },
  })
}
