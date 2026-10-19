import { Router } from 'express'
import {
  appointmentsAnalytics,
  overview,
  periodSummary,
  report,
  servicesAnalytics,
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// Every analytics endpoint requires a valid admin JWT.
router.use(protect)

/*
 * Common query parameters:
 *   basis=created|scheduled   count by date received (default) or preferred visit date
 *   month=1-12&year=YYYY       for /month (defaults to the current month)
 *   year=YYYY                  for /year
 *   from=YYYY-MM-DD&to=YYYY-MM-DD   for /custom (inclusive)
 *   period=today|week|month|year|custom   for /services, /appointments and /report
 */
router.get('/overview', overview)
router.get('/today', periodSummary('today'))
router.get('/week', periodSummary('week'))
router.get('/month', periodSummary('month'))
router.get('/year', periodSummary('year'))
router.get('/custom', periodSummary('custom'))
router.get('/services', servicesAnalytics)
router.get('/appointments', appointmentsAnalytics)
router.get('/report', report)

export default router
