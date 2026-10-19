import PDFDocument from 'pdfkit'
import { CLINIC_TZ } from './dateRange.js'

/* Brand palette (matches the website). Status colours are the validated chart palette. */
const C = {
  teal: '#417572',
  tealDark: '#2f5754',
  mint: '#D5E8DF',
  cream: '#F2F0EC',
  gold: '#B88E2D',
  text: '#070807',
  soft: '#5B5F5B',
  border: '#E4E0D8',
  status: { Pending: '#B88E2D', Confirmed: '#00897A', Completed: '#7FB546', Cancelled: '#C9493F' },
}
const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const PAGE = { margin: 48, width: 595.28, height: 841.89 } // A4
const CONTENT_W = PAGE.width - PAGE.margin * 2
const BOTTOM = PAGE.height - PAGE.margin - 24

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-GB', { timeZone: CLINIC_TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDate = (d, tz) => new Date(d).toLocaleDateString('en-GB', { timeZone: tz, day: '2-digit', month: 'short', year: 'numeric' })
const pct = (n, total) => (total ? `${Math.round((n / total) * 1000) / 10}%` : '0%')
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function ensureSpace(doc, needed) {
  if (doc.y + needed > BOTTOM) {
    doc.addPage()
    doc.y = PAGE.margin
  }
}

function sectionTitle(doc, title, subtitle) {
  ensureSpace(doc, 60)
  doc.moveDown(0.6)
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text).text(title, PAGE.margin, doc.y)
  if (subtitle) doc.font('Helvetica').fontSize(9).fillColor(C.soft).text(subtitle)
  doc.moveDown(0.5)
}

function header(doc, { range }, generatedBy) {
  doc.rect(0, 0, PAGE.width, 128).fill(C.tealDark)
  doc.circle(PAGE.margin + 16, 52, 16).fill(C.mint)
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#FFFFFF')
    .text('Nawa Ayurveda', PAGE.margin + 44, 38)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(C.mint)
    .text('Analytics Report', PAGE.margin + 44, 62)

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#FFFFFF')
    .text(range.label, PAGE.margin, 92, { width: CONTENT_W * 0.6 })
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(C.mint)
    .text(
      `Generated ${fmtDateTime(new Date())}${generatedBy ? ` by ${generatedBy}` : ''}\nAppointments by ${
        range.basis === 'scheduled' ? 'preferred visit date' : 'date received'
      } · Times in ${CLINIC_TZ}`,
      PAGE.margin + CONTENT_W * 0.45,
      90,
      { width: CONTENT_W * 0.55, align: 'right' },
    )
  doc.y = 150
}

function kpiGrid(doc, items) {
  const cols = 4
  const gap = 10
  const w = (CONTENT_W - gap * (cols - 1)) / cols
  const h = 58
  const rows = Math.ceil(items.length / cols)
  ensureSpace(doc, rows * (h + gap))
  const top = doc.y
  items.forEach((it, i) => {
    const x = PAGE.margin + (i % cols) * (w + gap)
    const y = top + Math.floor(i / cols) * (h + gap)
    doc.roundedRect(x, y, w, h, 10).fill(C.cream)
    if (it.color) doc.rect(x, y + 12, 3, h - 24).fill(it.color)
    doc.font('Helvetica').fontSize(8.5).fillColor(C.soft).text(it.label, x + 12, y + 11, { width: w - 20 })
    doc.font('Helvetica-Bold').fontSize(19).fillColor(C.text).text(String(it.value), x + 12, y + 28, { width: w - 20 })
  })
  doc.y = top + rows * (h + gap) - gap + 6
}

/** Vertical bar chart of total appointments per bucket. */
function barChart(doc, buckets) {
  const h = 150
  ensureSpace(doc, h + 40)
  const x0 = PAGE.margin + 28
  const y0 = doc.y
  const w = CONTENT_W - 28
  const max = Math.max(1, ...buckets.map((b) => b.total))
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4

  // Recessive gridlines + axis labels
  doc.font('Helvetica').fontSize(7).fillColor(C.soft)
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((niceMax / 4) * i)
    const y = y0 + h - (h * v) / niceMax
    doc.moveTo(x0, y).lineTo(x0 + w, y).lineWidth(0.5).strokeColor(C.border).stroke()
    doc.text(String(v), PAGE.margin, y - 3, { width: 22, align: 'right' })
  }

  const slot = w / buckets.length
  const barW = Math.max(2, Math.min(28, slot - 3))
  const every = Math.ceil(buckets.length / 16)
  buckets.forEach((b, i) => {
    const bh = (h * b.total) / niceMax
    const x = x0 + i * slot + (slot - barW) / 2
    if (b.total) doc.roundedRect(x, y0 + h - bh, barW, bh, Math.min(3, barW / 2)).fill(C.teal)
    if (i % every === 0) {
      doc.font('Helvetica').fontSize(6.5).fillColor(C.soft).text(b.label, x0 + i * slot - 10, y0 + h + 5, { width: slot + 20, align: 'center' })
    }
  })
  doc.y = y0 + h + 22
}

/** Simple table with header row repeated after page breaks. */
function table(doc, columns, rows, { zebra = true } = {}) {
  const rowH = 20
  const drawHeader = () => {
    const y = doc.y
    doc.rect(PAGE.margin, y, CONTENT_W, rowH).fill(C.mint)
    let x = PAGE.margin
    columns.forEach((c) => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tealDark).text(c.label, x + 6, y + 6, { width: c.width - 12, align: c.align || 'left' })
      x += c.width
    })
    doc.y = y + rowH
  }

  ensureSpace(doc, rowH * 2)
  drawHeader()
  rows.forEach((row, ri) => {
    if (doc.y + rowH > BOTTOM) {
      doc.addPage()
      doc.y = PAGE.margin
      drawHeader()
    }
    const y = doc.y
    if (zebra && ri % 2) doc.rect(PAGE.margin, y, CONTENT_W, rowH).fill('#FAF9F6')
    let x = PAGE.margin
    columns.forEach((c, ci) => {
      const raw = row[ci]
      // Only objects carry options (note: plain strings have a legacy .bold() method).
      const cell = raw && typeof raw === 'object' ? raw : { text: raw }
      const value = cell.text
      if (cell.dot) doc.circle(x + 9, y + 10, 3).fill(cell.dot)
      doc
        .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(C.text)
        .text(String(value ?? ''), x + (cell.dot ? 16 : 6), y + 6, { width: c.width - (cell.dot ? 20 : 12), height: 10, align: c.align || 'left', ellipsis: true })
      x += c.width
    })
    doc.moveTo(PAGE.margin, y + rowH).lineTo(PAGE.margin + CONTENT_W, y + rowH).lineWidth(0.4).strokeColor(C.border).stroke()
    doc.y = y + rowH
  })
  doc.moveDown(0.4)
}

function emptyNote(doc, text) {
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.soft).text(text, PAGE.margin, doc.y)
  doc.moveDown(0.6)
}

function footer(doc) {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    const y = PAGE.height - PAGE.margin + 6
    doc.moveTo(PAGE.margin, y - 8).lineTo(PAGE.margin + CONTENT_W, y - 8).lineWidth(0.5).strokeColor(C.border).stroke()
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(C.soft)
      .text('Nawa Ayurvedic Medical Center · Confidential — contains patient information', PAGE.margin, y, { width: CONTENT_W * 0.7, lineBreak: false })
      .text(`Page ${i + 1} of ${range.count}`, PAGE.margin + CONTENT_W * 0.7, y, { width: CONTENT_W * 0.3, align: 'right', lineBreak: false })
    doc.page.margins.bottom = savedBottom
  }
}

/** Writes the PDF to the Express response. Resolves once fully sent. */
export function streamAnalyticsReport(res, { summary, appointments, truncated, generatedBy }) {
  const { range, appointments: counts, timeline, services, contacts, blogs } = summary
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE.margin,
    bufferPages: true,
    info: { Title: `Nawa Ayurveda Analytics — ${range.label}`, Author: 'Nawa Ayurveda', Subject: 'Analytics report' },
  })

  const filename = `nawa-analytics-${slug(range.label) || 'report'}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-store')

  const done = new Promise((resolve, reject) => {
    res.on('finish', resolve)
    res.on('error', reject)
  })
  doc.pipe(res)

  header(doc, summary, generatedBy)

  sectionTitle(doc, 'Summary')
  kpiGrid(doc, [
    { label: 'Total appointments', value: counts.total, color: C.teal },
    ...STATUSES.map((s) => ({ label: s, value: counts[s], color: C.status[s] })),
    { label: 'Contact messages', value: contacts.total, color: C.gold },
    { label: 'Unread messages', value: contacts.unread },
    { label: 'Articles created', value: blogs.created },
  ])

  sectionTitle(
    doc,
    'Appointments overview',
    `Appointments per ${timeline.granularity}${timeline.withoutTimeSlot ? ` · ${timeline.withoutTimeSlot} without a time slot not shown` : ''}`,
  )
  if (counts.total) barChart(doc, timeline.buckets)
  else emptyNote(doc, 'No appointments in this period.')

  sectionTitle(doc, 'Appointment status')
  table(
    doc,
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

  sectionTitle(doc, 'Most requested services')
  if (services.length) {
    table(
      doc,
      [
        { label: '#', width: CONTENT_W * 0.07 },
        { label: 'Service', width: CONTENT_W * 0.45 },
        { label: 'Requests', width: CONTENT_W * 0.16, align: 'right' },
        { label: 'Completed', width: CONTENT_W * 0.16, align: 'right' },
        { label: 'Share', width: CONTENT_W * 0.16, align: 'right' },
      ],
      services.map((s, i) => [i + 1, s.service, s.total, s.completed, `${s.share}%`]),
    )
  } else emptyNote(doc, 'No service requests in this period.')

  sectionTitle(doc, 'Contacts & content')
  table(
    doc,
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

  sectionTitle(doc, 'Appointments in this period', truncated ? `Showing the first ${appointments.length} of ${counts.total}` : `${appointments.length} appointment(s)`)
  if (appointments.length) {
    const tz = range.basis === 'scheduled' ? 'UTC' : CLINIC_TZ
    table(
      doc,
      [
        { label: 'Preferred date', width: CONTENT_W * 0.16 },
        { label: 'Time', width: CONTENT_W * 0.11 },
        { label: 'Name', width: CONTENT_W * 0.2 },
        { label: 'Phone', width: CONTENT_W * 0.17 },
        { label: 'Service', width: CONTENT_W * 0.22 },
        { label: 'Status', width: CONTENT_W * 0.14 },
      ],
      appointments.map((a) => [
        fmtDate(a.date, 'UTC'),
        a.time || '—',
        a.name,
        a.phone,
        a.service,
        { text: a.status, dot: C.status[a.status] },
      ]),
    )
    if (range.basis !== 'scheduled') {
      doc.font('Helvetica').fontSize(7.5).fillColor(C.soft).text(`Listed in the order requests were received (${tz}).`, PAGE.margin, doc.y, { width: CONTENT_W })
    }
  } else emptyNote(doc, 'No appointments in this period.')

  footer(doc)
  doc.end()
  return done
}
