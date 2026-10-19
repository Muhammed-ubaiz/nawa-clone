import { useReveal } from '../../hooks/useReveal'

/*
 * Hand-drawn style Ayurveda botanical composition (inline SVG, no assets).
 * Every stroke has pathLength=1 so CSS can "ink" it in with stroke-dashoffset (see .ayu-art in index.css);
 * `--i` staggers each stroke. Washes and leaf tints fade in after the line work, then the artwork floats slowly.
 */

export const INK = '#2f5754' // primary-dark: deep forest green
export const SAGE = '#7f9a8c'
export const OLIVE = '#9c9258'
export const BEIGE = '#b88e2d'

/** Pointed leaf at the origin, tip pointing up (-y). Slightly asymmetric so it reads as hand-drawn. */
function leafPaths(l, w) {
  return {
    outline: `M0 0 C ${w} ${-l * 0.22} ${w * 0.82} ${-l * 0.74} ${w * 0.04} ${-l} C ${-w * 0.92} ${-l * 0.7} ${-w * 1.04} ${-l * 0.3} 0 0Z`,
    rib: `M0 0 Q ${w * 0.12} ${-l * 0.5} ${w * 0.03} ${-l * 0.94}`,
    veins: [0.26, 0.46, 0.64]
      .map((t, k) => {
        const y = -l * t
        const s = k % 2 ? 1 : -1
        const reach = (1 - t) * 0.75 // narrower toward the tip
        return `M${w * 0.06} ${y} q ${s * w * reach * 0.55} ${-l * 0.05} ${s * w * reach} ${-l * 0.13}`
      })
      .join(' '),
  }
}

export function Leaf({ x, y, rot, l, w, i, tint = false, color = INK }) {
  const p = leafPaths(l, w)
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {tint && <path d={p.outline} className="ayu-fill" fill={SAGE} fillOpacity="0.12" stroke="none" />}
      <path d={p.outline} pathLength="1" className="ayu-line" style={{ '--i': i }} stroke={color} strokeWidth="1.15" />
      <path d={p.rib} pathLength="1" className="ayu-line" style={{ '--i': i + 0.5 }} stroke={color} strokeWidth="0.8" />
      <path d={p.veins} pathLength="1" className="ayu-line" style={{ '--i': i + 1 }} stroke={color} strokeWidth="0.6" strokeOpacity="0.7" />
    </g>
  )
}

/** Point on a cubic Bezier segment [p0, c1, c2, p1] at t. */
function bezier([p0, c1, c2, p1], t) {
  const u = 1 - t
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
  return [0, 1].map((a) => k[0] * p0[a] + k[1] * c1[a] + k[2] * c2[a] + k[3] * p1[a])
}

// Main tulsi/neem-like branch, as two cubic segments (the second is the smooth "S" continuation).
const STEM = [
  [[352, 590], [372, 500], [272, 430], [300, 330]],
  [[300, 330], [328, 230], [318, 180], [268, 70]],
]
const STEM_D = 'M352 590 C 372 500 272 430 300 330 C 328 230 318 180 268 70'

/** Leaves alternate sides and shrink toward the tip; [segment, t, side, length, width, tinted]. */
const MAIN_LEAVES = [
  [0, 0.2, -1, 92, 30, true],
  [0, 0.42, 1, 86, 28],
  [0, 0.64, -1, 80, 27, true],
  [0, 0.86, 1, 74, 25],
  [1, 0.12, -1, 66, 22, true],
  [1, 0.32, 1, 58, 20],
  [1, 0.52, -1, 50, 17],
  [1, 0.7, 1, 42, 14, true],
  [1, 0.86, -1, 34, 11],
].map(([seg, t, side, l, w, tint]) => {
  const [x, y] = bezier(STEM[seg], t)
  return { x, y, rot: side * (58 - (seg * 4 + t * 6) * 3), l, w, tint }
})

const SPRIG = [[118, 470], [140, 430], [150, 380], [214, 330]]
const SPRIG_LEAVES = [
  [0.22, -1, 44, 14],
  [0.42, 1, 40, 13, true],
  [0.64, -1, 34, 11],
  [0.84, 1, 28, 9],
].map(([t, side, l, w, tint]) => {
  const [x, y] = bezier(SPRIG, t)
  return { x, y, rot: side * 52, l, w, tint, color: OLIVE }
})

export default function AyurvedaIllustration({ className = '' }) {
  const [ref, drawn] = useReveal({ threshold: 0.25, rootMargin: '0px 0px -40px 0px' })
  let n = 0 // running stroke index for the stagger
  const next = (step = 1) => (n += step)

  return (
    <div ref={ref} className={`ayu-art ${drawn ? 'is-drawn' : ''} ${className}`}>
      <svg viewBox="0 0 580 620" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ayu-float h-auto w-full overflow-visible" role="img" aria-labelledby="ayu-art-title">
        <title id="ayu-art-title">Botanical line drawing of Ayurvedic herbs with a mortar and pestle and drops of herbal oil</title>
        <defs>
          <filter id="ayu-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* Warm watercolour wash behind the bowl (fades into the white page) */}
        <g className="ayu-fill" filter="url(#ayu-soft)">
          <ellipse cx="200" cy="500" rx="120" ry="70" fill={BEIGE} fillOpacity="0.1" />
        </g>

        {/* Frame: thin circle + organic oval + dots */}
        <circle cx="300" cy="306" r="248" pathLength="1" className="ayu-line" style={{ '--i': 0 }} stroke="#000" strokeOpacity="0.07" strokeWidth="1" />
        <ellipse cx="296" cy="312" rx="222" ry="268" transform="rotate(-14 296 312)" pathLength="1" className="ayu-line" style={{ '--i': 1 }} stroke="#000" strokeOpacity="0.06" strokeWidth="0.9" />
        <g className="ayu-fill" fill={BEIGE} fillOpacity="0.55">
          <circle cx="62" cy="268" r="2.6" />
          <circle cx="538" cy="350" r="2.6" />
          <circle cx="300" cy="58" r="2" />
          <circle cx="470" cy="128" r="1.8" />
          <circle cx="120" cy="520" r="1.8" />
        </g>

        {/* Main branch (crosses the frame at the top) */}
        <path d={STEM_D} pathLength="1" className="ayu-line" style={{ '--i': next(2) }} stroke={INK} strokeWidth="1.5" />
        <path d="M355 590 C 376 505 277 432 304 332" pathLength="1" className="ayu-line" style={{ '--i': next(0.5) }} stroke={INK} strokeOpacity="0.35" strokeWidth="0.7" />
        {MAIN_LEAVES.map((leaf) => (
          <Leaf key={`m${leaf.y}`} {...leaf} i={next(0.7)} />
        ))}

        {/* Tulsi flower spike at the tip */}
        <path d="M268 70 q -6 -22 4 -46" pathLength="1" className="ayu-line" style={{ '--i': next() }} stroke={INK} strokeWidth="1" />
        <g className="ayu-fill" fill="none" stroke={OLIVE} strokeWidth="1">
          {[62, 52, 42, 33].map((y, k) => (
            <g key={y}>
              <ellipse cx={268 - 6 - k * 0.5} cy={y} rx="3.4" ry="2.2" transform={`rotate(-30 ${262 - k * 0.5} ${y})`} />
              <ellipse cx={268 + 6 + k * 0.5} cy={y - 2} rx="3.4" ry="2.2" transform={`rotate(30 ${274 + k * 0.5} ${y - 2})`} />
            </g>
          ))}
        </g>

        {/* Small olive sprig from the left, crossing the oval */}
        <path d="M118 470 C 140 430 150 380 214 330" pathLength="1" className="ayu-line" style={{ '--i': next() }} stroke={OLIVE} strokeWidth="1.1" />
        {SPRIG_LEAVES.map((leaf) => (
          <Leaf key={`s${leaf.y}`} {...leaf} i={next(0.6)} />
        ))}
        {/* Berries */}
        <g className="ayu-fill" stroke={OLIVE} strokeWidth="1">
          <circle cx="226" cy="322" r="4.5" fill={OLIVE} fillOpacity="0.25" />
          <circle cx="234" cy="312" r="3.6" />
          <circle cx="222" cy="309" r="3" />
        </g>

        {/* Mortar & pestle */}
        <g transform="translate(-6 0)">
          <ellipse cx="214" cy="512" rx="74" ry="13" pathLength="1" className="ayu-line" style={{ '--i': next() }} stroke={INK} strokeWidth="1.3" />
          <path d="M140 513 C 142 560 178 580 214 580 C 252 580 286 560 288 513" pathLength="1" className="ayu-line" style={{ '--i': next(0.6) }} stroke={INK} strokeWidth="1.3" />
          <path d="M150 530 C 160 556 184 570 214 571" pathLength="1" className="ayu-line" style={{ '--i': next(0.6) }} stroke={INK} strokeOpacity="0.35" strokeWidth="0.7" />
          <path d="M188 580 L 182 596 L 248 596 L 242 580" pathLength="1" className="ayu-line" style={{ '--i': next(0.6) }} stroke={INK} strokeWidth="1.2" />
          <path d="M192 506 L 132 438 C 125 430 112 440 119 448 L 178 514" pathLength="1" className="ayu-line" style={{ '--i': next(0.6) }} stroke={INK} strokeWidth="1.2" />
          <path className="ayu-fill" d="M156 516 C 180 524 250 524 272 516 C 262 540 238 552 214 552 C 190 552 166 540 156 516Z" fill={OLIVE} fillOpacity="0.14" />
          {/* Ground herbs in the bowl */}
          <g className="ayu-fill" fill={INK} fillOpacity="0.45">
            <circle cx="186" cy="510" r="1.6" />
            <circle cx="198" cy="514" r="1.2" />
            <circle cx="214" cy="508" r="1.5" />
            <circle cx="230" cy="514" r="1.3" />
          </g>
        </g>

        {/* Ground line */}
        <path d="M96 598 C 180 592 300 600 440 594" pathLength="1" className="ayu-line" style={{ '--i': next() }} stroke={INK} strokeOpacity="0.3" strokeWidth="0.9" />

        {/* Herbal oil drops falling from a leaf tip */}
        <g className="ayu-fill ayu-drip" stroke={BEIGE} strokeWidth="1.1">
          <path d="M409 446 C 409 446 400 459 400 466 a 9 9 0 0 0 18 0 C 418 459 409 446 409 446Z" fill={BEIGE} fillOpacity="0.18" />
          <path d="M413 494 C 413 494 408 502 408 506 a 5 5 0 0 0 10 0 C 418 502 413 494 413 494Z" fill={BEIGE} fillOpacity="0.18" />
        </g>
        <path d="M399 429 C 404 431 408 436 409 442" pathLength="1" className="ayu-line" style={{ '--i': next() }} stroke={BEIGE} strokeWidth="1" />
      </svg>
    </div>
  )
}
