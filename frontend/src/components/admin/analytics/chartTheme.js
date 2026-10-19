/**
 * Chart palette for appointment statuses.
 * Validated with the dataviz palette checker (lightness band, chroma floor,
 * colour-blind separation). Pending and Completed fall under 3:1 contrast on
 * white, so every chart pairs colour with a legend/label and a table view.
 */
export const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

export const STATUS_COLORS = {
  Pending: '#B88E2D',
  Confirmed: '#00897A',
  Completed: '#7FB546',
  Cancelled: '#C9493F',
}

/** Single-series magnitude colour (services ranking). */
export const SERIES_COLOR = '#417572'

export const AXIS = {
  tick: { fill: '#5b5f5b', fontSize: 12 },
  line: '#e4e0d8',
  grid: '#eeebe5',
}

export const pct = (n, total) => (total ? `${Math.round((n / total) * 1000) / 10}%` : '0%')
