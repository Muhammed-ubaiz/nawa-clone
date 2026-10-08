import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/*
 * Client-side appointment report PDF (jsPDF + jspdf-autotable).
 * Receives the COMPLETE dataset for the period (fetched with export=true),
 * never just the visible table page.
 */

const BRAND = {
  teal: [65, 117, 114],
  tealDark: [47, 87, 84],
  mint: [213, 232, 223],
  cream: [242, 240, 236],
  text: [7, 8, 7],
  soft: [91, 95, 91],
  border: [228, 224, 216],
}
const STATUS_RGB = {
  Pending: [184, 142, 45],
  Confirmed: [0, 137, 122],
  Completed: [127, 181, 70],
  Cancelled: [201, 73, 63],
}
const TZ = 'Asia/Dubai'
// jsPDF's built-in Helvetica cannot draw the em dash (U+2014) and silently drops it, so PDFs use a plain hyphen.
const DASH = '-'

/** Appointment.date stores the chosen calendar day at UTC midnight. */
const fmtApptDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : DASH
const fmtDubai = (d, withTime = true) =>
  new Date(d).toLocaleString('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })

const REPORT_TYPES = {
  all: 'All Appointments',
  today: "Today's Report",
  week: 'Weekly Report',
  month: 'Monthly Report',
  year: 'Yearly Report',
  custom: 'Custom Date Report',
}

/** File names required by the spec. */
export function reportFilename(range) {
  const { period, fromDate, toDate, today } = range
  switch (period) {
    case 'all':
      return 'Nawa-Ayurveda-All-Appointments.pdf'
    case 'today':
      return `Nawa-Ayurveda-Today-Report-${fromDate || today}.pdf`
    case 'month':
      return `Nawa-Ayurveda-Monthly-Report-${fromDate.slice(0, 7)}.pdf`
    case 'year':
      return `Nawa-Ayurveda-Yearly-Report-${fromDate.slice(0, 4)}.pdf`
    case 'custom':
      return `Nawa-Ayurveda-Custom-Report-${fromDate}-to-${toDate}.pdf`
    default:
      return `Nawa-Ayurveda-${period}-Report.pdf`
  }
}

/** Human description of the selected date, month or year. */
function periodDescription(range) {
  if (range.period === 'all') return 'All dates'
  if (range.period === 'today') return fmtApptDate(`${range.fromDate}T00:00:00Z`)
  if (range.period === 'custom') return `${fmtApptDate(`${range.fromDate}T00:00:00Z`)} to ${fmtApptDate(`${range.toDate}T00:00:00Z`)}`
  return range.label
}

/**
 * Builds the PDF and returns the jsPDF document.
 * @param {{ range, stats, records, pagination }} report  response of GET /analytics/appointments?export=true
 */
export function buildAppointmentReport(report) {
  const { range, stats, records, pagination } = report
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 40
  const reportType = REPORT_TYPES[range.period] || 'Appointment Report'
  const title = `Nawa Ayurveda - ${reportType}`

  doc.setProperties({ title, subject: 'Appointment report', author: 'Nawa Ayurveda', creator: 'Nawa Ayurveda Admin' })

  // Header band
  doc.setFillColor(...BRAND.tealDark)
  doc.rect(0, 0, W, 96, 'F')
  doc.setFillColor(...BRAND.mint)
  doc.circle(M + 14, 40, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(20)
  doc.text('NAWA AYURVEDA', M + 38, 38)
  doc.setFont('helvetica', 'normal').setFontSize(10)
  doc.setTextColor(...BRAND.mint)
  doc.text('Ayurvedic Medical Center - Abu Dhabi', M + 38, 54)
  doc.setFont('helvetica', 'bold').setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Appointment Report', M + 38, 78)

  doc.setFont('helvetica', 'normal').setFontSize(9)
  doc.setTextColor(...BRAND.mint)
  const meta = [
    `Report type: ${reportType}`,
    `Period: ${periodDescription(range)}`,
    `Generated: ${fmtDubai(new Date())} (Abu Dhabi time)`,
  ]
  meta.forEach((line, i) => doc.text(line, W - M, 36 + i * 14, { align: 'right' }))

  // Summary boxes
  const items = [
    { label: 'Total appointments', value: stats.total, color: BRAND.teal },
    { label: 'Pending', value: stats.Pending, color: STATUS_RGB.Pending },
    { label: 'Confirmed', value: stats.Confirmed, color: STATUS_RGB.Confirmed },
    { label: 'Completed', value: stats.Completed, color: STATUS_RGB.Completed },
    { label: 'Cancelled', value: stats.Cancelled, color: STATUS_RGB.Cancelled },
  ]
  const gap = 10
  const boxW = (W - M * 2 - gap * (items.length - 1)) / items.length
  const boxY = 116
  items.forEach((it, i) => {
    const x = M + i * (boxW + gap)
    doc.setFillColor(...BRAND.cream)
    doc.roundedRect(x, boxY, boxW, 54, 8, 8, 'F')
    doc.setFillColor(...it.color)
    doc.rect(x, boxY + 12, 3, 30, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...BRAND.soft)
    doc.text(it.label, x + 12, boxY + 20)
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(...BRAND.text)
    doc.text(String(it.value ?? 0), x + 12, boxY + 42)
  })

  // Section heading
  let y = boxY + 80
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...BRAND.text)
  doc.text('Appointment details', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...BRAND.soft)
  const countNote = pagination?.truncated
    ? `Showing the first ${records.length} of ${pagination.total} appointments`
    : `${records.length} appointment${records.length === 1 ? '' : 's'} · sorted by appointment date`
  doc.text(countNote, W - M, y, { align: 'right' })
  y += 10

  if (!records.length) {
    doc.setFont('helvetica', 'italic').setFontSize(10).setTextColor(...BRAND.soft)
    doc.text('No appointments found for this period.', M, y + 20)
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: 50, bottom: 46 },
      head: [['#', 'Patient Name', 'Phone', 'Email', 'Service', 'Appointment Date', 'Appointment Time', 'Status']],
      body: records.map((r, i) => [
        i + 1,
        r.name,
        r.phone,
        r.email || DASH,
        r.service,
        fmtApptDate(r.date),
        r.time || DASH,
        r.status,
      ]),
      theme: 'grid',
      showHead: 'everyPage', // repeat the header on every page
      rowPageBreak: 'avoid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: BRAND.text, lineColor: BRAND.border, lineWidth: 0.4, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: BRAND.mint, textColor: BRAND.tealDark, fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 249, 246] },
      columnStyles: {
        0: { cellWidth: 28, halign: 'right', textColor: BRAND.soft },
        1: { cellWidth: 120 },
        2: { cellWidth: 92 },
        3: { cellWidth: 140 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 82 },
        6: { cellWidth: 72 },
        7: { cellWidth: 72, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) data.cell.styles.textColor = STATUS_RGB[data.cell.raw] || BRAND.text
      },
    })
  }

  // Footer on every page: report title + page numbers
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.5)
    doc.line(M, H - 30, W - M, H - 30)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...BRAND.soft)
    doc.text(`${title} · ${periodDescription(range)} · Confidential - contains patient information`, M, H - 16)
    doc.text(`Page ${p} of ${pages}`, W - M, H - 16, { align: 'right' })
  }

  return doc
}
