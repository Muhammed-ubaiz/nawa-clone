import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CLINIC_TZ } from '../services/dateRange'

/*
 * Client-side analytics report PDF (jsPDF + jspdf-autotable).
 * Same layout as the report the former API produced with pdfkit.
 */

const C = {
  teal: [65, 117, 114],
  tealDark: [47, 87, 84],
  mint: [213, 232, 223],
  cream: [242, 240, 236],
  gold: [184, 142, 45],
  text: [7, 8, 7],
  soft: [91, 95, 91],
  border: [228, 224, 216],
  zebra: [250, 249, 246],
  status: { Pending: [184, 142, 45], Confirmed: [0, 137, 122], Completed: [127, 181, 70], Cancelled: [201, 73, 63] },
}
const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const M = 48
const W = 595.28 // A4 portrait
const H = 841.89
const CONTENT_W = W - M * 2
const BOTTOM = H - M - 24

// jsPDF's built-in Helvetica cannot draw en/em dashes, so they become plain hyphens.
const t = (v) => String(v ?? '').replace(/[–—]/g, '-')

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-GB', { timeZone: CLINIC_TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDate = (d, tz) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: tz, day: '2-digit', month: 'short', year: 'numeric' }) : '-')
const pct = (n, total) => (total ? `${Math.round((n / total) * 1000) / 10}%` : '0%')
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * @param {{ summary, appointments, truncated, generatedBy }} input
 * @returns {{ doc: jsPDF, filename: string }}
 */
export function buildAnalyticsReport({ summary, appointments, truncated, generatedBy }) {
  const { range, appointments: counts, timeline, services, contacts, blogs } = summary
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setProperties({ title: t(`Nawa Ayurveda Analytics - ${range.label}`), author: 'Nawa Ayurveda', subject: 'Analytics report' })
  let y = 0

  const font = (style, size, color) => doc.setFont('helvetica', style).setFontSize(size).setTextColor(...color)
  const ensureSpace = (needed) => {
    if (y + needed > BOTTOM) {
      doc.addPage()
      y = M
    }
  }
  const sectionTitle = (title, subtitle) => {
    ensureSpace(60)
    y += 10
    font('bold', 13, C.text)
    doc.text(t(title), M, y, { baseline: 'top' })
    y += 17
    if (subtitle) {
      font('normal', 9, C.soft)
      doc.text(t(subtitle), M, y, { baseline: 'top' })
      y += 12
    }
    y += 6
  }
  const emptyNote = (text) => {
    font('italic', 9, C.soft)
    doc.text(t(text), M, y, { baseline: 'top' })
    y += 20
  }
  const table = (columns, rows) => {
    ensureSpace(40)
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: M, bottom: H - BOTTOM },
      head: [columns.map((c) => t(c.label))],
      body: rows.map((r) => r.map((cell) => t(cell && typeof cell === 'object' ? cell.text : cell))),
      theme: 'plain',
      showHead: 'everyPage',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 6, bottom: 6, left: 6, right: 6 }, textColor: C.text, overflow: 'ellipsize' },
      headStyles: { fillColor: C.mint, textColor: C.tealDark, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: Object.fromEntries(columns.map((c, i) => [i, { cellWidth: c.width, halign: c.align || 'left' }])),
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const raw = rows[data.row.index][data.column.index]
        if (raw && typeof raw === 'object') {
          if (raw.bold) data.cell.styles.fontStyle = 'bold'
          if (raw.dot) data.cell.styles.cellPadding = { top: 6, bottom: 6, left: 16, right: 6 }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const raw = rows[data.row.index][data.column.index]
          if (raw && typeof raw === 'object' && raw.dot) {
            doc.setFillColor(...raw.dot)
            doc.circle(data.cell.x + 9, data.cell.y + data.cell.height / 2, 3, 'F')
          }
          if (data.column.index === 0) {
            doc.setDrawColor(...C.border).setLineWidth(0.4)
            doc.line(M, data.cell.y + data.cell.height, M + CONTENT_W, data.cell.y + data.cell.height)
          }
        }
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // Header band
  doc.setFillColor(...C.tealDark)
  doc.rect(0, 0, W, 128, 'F')
  doc.setFillColor(...C.mint)
  doc.circle(M + 16, 52, 16, 'F')
  font('bold', 20, [255, 255, 255])
  doc.text('Nawa Ayurveda', M + 44, 38, { baseline: 'top' })
  font('normal', 10, C.mint)
  doc.text('Analytics Report', M + 44, 62, { baseline: 'top' })
  font('bold', 14, [255, 255, 255])
  doc.text(doc.splitTextToSize(t(range.label), CONTENT_W * 0.6), M, 92, { baseline: 'top' })
  font('normal', 8.5, C.mint)
  doc.text(
    [
      `Generated ${fmtDateTime(new Date())}${generatedBy ? ` by ${t(generatedBy)}` : ''}`,
      `Appointments by ${range.basis === 'scheduled' ? 'preferred visit date' : 'date received'} · Times in ${CLINIC_TZ}`,
    ],
    W - M,
    92,
    { align: 'right', baseline: 'top' },
  )
  y = 150

  // Summary KPIs
  sectionTitle('Summary')
  const kpis = [
    { label: 'Total appointments', value: counts.total, color: C.teal },
    ...STATUSES.map((s) => ({ label: s, value: counts[s], color: C.status[s] })),
    { label: 'Contact messages', value: contacts.total, color: C.gold },
    { label: 'Unread messages', value: contacts.unread },
    { label: 'Articles created', value: blogs.created },
  ]
  const cols = 4
  const gap = 10
  const kw = (CONTENT_W - gap * (cols - 1)) / cols
  const kh = 58
  const krows = Math.ceil(kpis.length / cols)
  ensureSpace(krows * (kh + gap))
  const top = y
  kpis.forEach((it, i) => {
    const x = M + (i % cols) * (kw + gap)
    const ky = top + Math.floor(i / cols) * (kh + gap)
    doc.setFillColor(...C.cream)
    doc.roundedRect(x, ky, kw, kh, 10, 10, 'F')
    if (it.color) {
      doc.setFillColor(...it.color)
      doc.rect(x, ky + 12, 3, kh - 24, 'F')
    }
    font('normal', 8.5, C.soft)
    doc.text(t(it.label), x + 12, ky + 11, { baseline: 'top' })
    font('bold', 19, C.text)
    doc.text(String(it.value ?? 0), x + 12, ky + 28, { baseline: 'top' })
  })
  y = top + krows * (kh + gap) - gap + 6

  // Appointments per bucket
  sectionTitle(
    'Appointments overview',
    `Appointments per ${timeline.granularity}${timeline.withoutTimeSlot ? ` · ${timeline.withoutTimeSlot} without a time slot not shown` : ''}`,
  )
  if (counts.total) {
    const buckets = timeline.buckets
    const ch = 150
    ensureSpace(ch + 40)
    const x0 = M + 28
    const y0 = y
    const cw = CONTENT_W - 28
    const max = Math.max(1, ...buckets.map((b) => b.total))
    const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4
    font('normal', 7, C.soft)
    doc.setDrawColor(...C.border).setLineWidth(0.5)
    for (let i = 0; i <= 4; i++) {
      const v = Math.round((niceMax / 4) * i)
      const gy = y0 + ch - (ch * v) / niceMax
      doc.line(x0, gy, x0 + cw, gy)
      doc.text(String(v), M + 22, gy, { align: 'right', baseline: 'middle' })
    }
    const slot = cw / buckets.length
    const barW = Math.max(2, Math.min(28, slot - 3))
    const every = Math.ceil(buckets.length / 16)
    buckets.forEach((b, i) => {
      const bh = (ch * b.total) / niceMax
      const x = x0 + i * slot + (slot - barW) / 2
      if (b.total) {
        doc.setFillColor(...C.teal)
        const r = Math.min(3, barW / 2, bh / 2)
        doc.roundedRect(x, y0 + ch - bh, barW, bh, r, r, 'F')
      }
      if (i % every === 0) {
        font('normal', 6.5, C.soft)
        doc.text(t(b.label), x0 + i * slot + slot / 2, y0 + ch + 5, { align: 'center', baseline: 'top' })
      }
    })
    y = y0 + ch + 22
  } else emptyNote('No appointments in this period.')

  sectionTitle('Appointment status')
  table(
    [
      { label: 'Status', width: CONTENT_W * 0.5 },
      { label: 'Appointments', width: CONTENT_W * 0.25, align: 'right' },
      { label: 'Share', width: CONTENT_W * 0.25, align: 'right' },
    ],
    [
      ...STATUSES.map((s) => [{ text: s, dot: C.status[s] }, counts[s], pct(counts[s], counts.total)]),
      [{ text: 'Total', bold: true }, { text: counts.total, bold: true }, { text: counts.total ? '100%' : '0%', bold: true }],
    ],
  )

  sectionTitle('Most requested services')
  if (services.length) {
    table(
      [
        { label: '#', width: CONTENT_W * 0.07 },
        { label: 'Service', width: CONTENT_W * 0.45 },
        { label: 'Requests', width: CONTENT_W * 0.16, align: 'right' },
        { label: 'Completed', width: CONTENT_W * 0.16, align: 'right' },
        { label: 'Share', width: CONTENT_W * 0.16, align: 'right' },
      ],
      services.map((s, i) => [i + 1, s.service, s.total, s.completed, `${s.share}%`]),
    )
  } else emptyNote('No service requests in this period.')

  sectionTitle('Contacts & content')
  table(
    [
      { label: 'Metric', width: CONTENT_W * 0.7 },
      { label: 'Count', width: CONTENT_W * 0.3, align: 'right' },
    ],
    [
      ['Contact messages received', contacts.total],
      ['Read', contacts.read],
      ['Unread', contacts.unread],
      ['Articles created', blogs.created],
      ['Articles published (of those created)', blogs.published],
    ],
  )

  sectionTitle('Appointments in this period', truncated ? `Showing the first ${appointments.length} of ${counts.total}` : `${appointments.length} appointment(s)`)
  if (appointments.length) {
    table(
      [
        { label: 'Preferred date', width: CONTENT_W * 0.16 },
        { label: 'Time', width: CONTENT_W * 0.11 },
        { label: 'Name', width: CONTENT_W * 0.2 },
        { label: 'Phone', width: CONTENT_W * 0.17 },
        { label: 'Service', width: CONTENT_W * 0.22 },
        { label: 'Status', width: CONTENT_W * 0.14 },
      ],
      appointments.map((a) => [fmtDate(a.date, 'UTC'), a.time || '-', a.name, a.phone, a.service, { text: a.status, dot: C.status[a.status] || C.soft }]),
    )
    if (range.basis !== 'scheduled') {
      font('normal', 7.5, C.soft)
      doc.text(`Listed in the order requests were received (${CLINIC_TZ}).`, M, y, { baseline: 'top' })
    }
  } else emptyNote('No appointments in this period.')

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const fy = H - M + 6
    doc.setDrawColor(...C.border).setLineWidth(0.5)
    doc.line(M, fy - 8, M + CONTENT_W, fy - 8)
    font('normal', 7.5, C.soft)
    doc.text('Nawa Ayurvedic Medical Center · Confidential - contains patient information', M, fy, { baseline: 'top' })
    doc.text(`Page ${p} of ${pages}`, W - M, fy, { align: 'right', baseline: 'top' })
  }

  return { doc, filename: `nawa-analytics-${slug(range.label) || 'report'}.pdf` }
}
