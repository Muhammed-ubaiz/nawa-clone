import { useState } from 'react'
import { analyticsApi } from '../../../services/api'
import { toast } from '../../../utils/alerts'

/**
 * Wraps the existing PDF flow: fetch the COMPLETE dataset for a period
 * (export=true — no pagination or search narrowing) and build the PDF with jsPDF.
 * Returns { download(key, params), busyKey }.
 */
export function useReportDownload() {
  const [busyKey, setBusyKey] = useState(null)

  const download = async (key, params) => {
    if (busyKey) return
    setBusyKey(key)
    try {
      const [{ data }, pdf] = await Promise.all([
        analyticsApi.appointments({ ...params, export: true }),
        import('../../../utils/appointmentReportPdf'), // jsPDF loads only when needed
      ])
      const doc = pdf.buildAppointmentReport(data)
      const name = pdf.reportFilename(data.range)
      doc.save(name)
      toast.success('Report downloaded successfully')
      if (data.pagination.truncated) toast.error(`Report limited to the first ${data.records.length} of ${data.pagination.total} appointments.`)
    } catch (err) {
      toast.error(err.message || 'Could not create the PDF.')
    } finally {
      setBusyKey(null)
    }
  }

  return { download, busyKey }
}

/** Query params for a period. */
export const periodParams = (period, { month, year, from, to } = {}) => {
  if (period === 'month') return { period, month, year }
  if (period === 'year') return { period, year }
  if (period === 'custom') return { period, from, to }
  return { period }
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Year options from next year back five years. */
export const yearOptions = () => {
  const y = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => y + 1 - i)
}

export const formatCount = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '—')
