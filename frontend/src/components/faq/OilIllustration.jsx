import { useReveal } from '../../hooks/useReveal'
import { BEIGE, INK, Leaf, OLIVE } from '../sections/AyurvedaIllustration'

/*
 * Hand-drawn style ink illustration for the home FAQ: an amber dropper bottle releasing herbal oil
 * into a brass uruli, with tulsi and jasmine. Shares the About artwork's draw-in system
 * (.ayu-art / .ayu-line / .ayu-fill in index.css): each stroke inks in by `--i`, washes follow.
 */

/** Small five-petal jasmine flower. */
function Jasmine({ x, y, r = 9, i }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r}
          rx={r * 0.45}
          ry={r * 0.9}
          transform={`rotate(${a})`}
          pathLength="1"
          className="ayu-line"
          style={{ '--i': i + a / 360 }}
          stroke={INK}
          strokeWidth="0.9"
        />
      ))}
      <circle r="1.8" className="ayu-fill" fill={BEIGE} fillOpacity="0.7" />
    </g>
  )
}

const TULSI = [
  { x: 124, y: 452, rot: -58, l: 46, w: 16, tint: true },
  { x: 118, y: 418, rot: 40, l: 42, w: 14 },
  { x: 116, y: 382, rot: -50, l: 38, w: 13 },
  { x: 116, y: 348, rot: 34, l: 34, w: 12, tint: true },
  { x: 112, y: 316, rot: -40, l: 28, w: 10 },
]

export default function OilIllustration({ className = '' }) {
  const [ref, drawn] = useReveal({ threshold: 0.25, rootMargin: '0px 0px -40px 0px' })
  return (
    <div ref={ref} className={`ayu-art ${drawn ? 'is-drawn' : ''} ${className}`}>
      <svg viewBox="0 70 480 575" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ayu-float h-auto w-full overflow-visible" role="img" aria-labelledby="oil-art-title">
        <title id="oil-art-title">Line drawing of an amber dropper bottle releasing drops of herbal oil into a brass bowl, with tulsi leaves and jasmine</title>
        <defs>
          <filter id="oil-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>

        {/* Warm wash behind the bowl + thin frame circle */}
        <g className="ayu-fill" filter="url(#oil-soft)">
          <ellipse cx="240" cy="540" rx="150" ry="60" fill={BEIGE} fillOpacity="0.12" />
        </g>
        <circle cx="244" cy="320" r="196" pathLength="1" className="ayu-line" style={{ '--i': 0 }} stroke="#000" strokeOpacity="0.07" strokeWidth="1" />
        <g className="ayu-fill" fill={BEIGE} fillOpacity="0.55">
          <circle cx="58" cy="250" r="2.4" />
          <circle cx="436" cy="380" r="2.4" />
          <circle cx="250" cy="118" r="1.8" />
        </g>

        {/* Tulsi sprig rising behind the bowl */}
        <path d="M134 500 C 112 440 128 380 108 300" pathLength="1" className="ayu-line" style={{ '--i': 1 }} stroke={OLIVE} strokeWidth="1.1" />
        {TULSI.map((leaf, k) => (
          <Leaf key={leaf.y} {...leaf} color={OLIVE} i={1.6 + k * 0.6} />
        ))}
        <path d="M108 300 q -4 -16 4 -32" pathLength="1" className="ayu-line" style={{ '--i': 4.8 }} stroke={OLIVE} strokeWidth="0.9" />
        <g className="ayu-fill" stroke={OLIVE} strokeWidth="0.9">
          {[292, 284, 276].map((y, k) => (
            <g key={y}>
              <ellipse cx={105 - k * 0.4} cy={y} rx="3.2" ry="2" transform={`rotate(-30 ${105 - k * 0.4} ${y})`} />
              <ellipse cx={115 + k * 0.4} cy={y - 2} rx="3.2" ry="2" transform={`rotate(30 ${115 + k * 0.4} ${y - 2})`} />
            </g>
          ))}
        </g>

        {/* Amber dropper bottle, tilted so the tip points down-left (tip at 250,300) */}
        <g transform="translate(250 300) rotate(210)">
          <path
            className="ayu-fill"
            d="M-35 84 C -35 70 -20 62 -13 58 L 13 58 C 20 62 35 70 35 84 L 35 186 C 35 196 28 202 18 202 L -18 202 C -28 202 -35 196 -35 186 Z"
            fill={BEIGE}
            fillOpacity="0.32"
          />
          {/* Oil inside, pooled toward the tilted tip */}
          <path className="ayu-fill" d="M-35 84 C -35 70 -20 62 -13 58 L 13 58 C 20 62 35 70 35 84 L 35 120 L -35 120 Z" fill={BEIGE} fillOpacity="0.35" />
          <path
            d="M-35 84 C -35 70 -20 62 -13 58 L 13 58 C 20 62 35 70 35 84 L 35 186 C 35 196 28 202 18 202 L -18 202 C -28 202 -35 196 -35 186 Z"
            pathLength="1"
            className="ayu-line"
            style={{ '--i': 2 }}
            stroke={INK}
            strokeWidth="1.4"
          />
          {/* Glass highlight */}
          <path d="M-24 92 L -24 180" pathLength="1" className="ayu-line" style={{ '--i': 3 }} stroke={INK} strokeOpacity="0.35" strokeWidth="0.8" />
          {/* Label */}
          <path d="M-35 108 L 35 108 M-35 168 L 35 168" pathLength="1" className="ayu-line" style={{ '--i': 3.4 }} stroke={INK} strokeWidth="1" />
          <path d="M-18 128 L 18 128 M-12 138 L 12 138 M-15 148 L 15 148" pathLength="1" className="ayu-line" style={{ '--i': 3.8 }} stroke={INK} strokeOpacity="0.5" strokeWidth="0.8" />
          <Leaf x={0} y={162} rot={0} l={14} w={5} i={4} color={OLIVE} />
          {/* Collar + glass dropper tip */}
          <path d="M-17 58 L -17 30 C -17 27 -15 26 -12 26 L 12 26 C 15 26 17 27 17 30 L 17 58" pathLength="1" className="ayu-line" style={{ '--i': 4.2 }} stroke={INK} strokeWidth="1.3" />
          <path d="M-17 36 L 17 36 M-17 44 L 17 44 M-17 52 L 17 52" pathLength="1" className="ayu-line" style={{ '--i': 4.6 }} stroke={INK} strokeOpacity="0.45" strokeWidth="0.7" />
          <path d="M-5 26 L -4 6 C -3 1 3 1 4 6 L 5 26" pathLength="1" className="ayu-line" style={{ '--i': 5 }} stroke={INK} strokeWidth="1.1" />
        </g>

        {/* Falling drops: all three start at the nozzle tip (y 302-328) and fall 176 units to the oil surface (y 504).
            --rest = where each sits when reduced motion is on; the loop is in .oil-drop (index.css). */}
        <g className="ayu-fill" stroke={BEIGE} strokeWidth="1.2">
          {[
            { delay: '0s', rest: '0px' },
            { delay: '1s', rest: '62px' },
            { delay: '2s', rest: '124px' },
          ].map(({ delay, rest }) => (
            <path
              key={delay}
              className="oil-drop"
              style={{ animationDelay: delay, '--rest': rest }}
              d="M249 302 C 249 302 241 314 241 320 a 8 8 0 0 0 16 0 C 257 314 249 302 249 302Z"
              fill={BEIGE}
              fillOpacity="0.3"
            />
          ))}
        </g>

        {/* Brass uruli */}
        <ellipse cx="240" cy="500" rx="132" ry="22" pathLength="1" className="ayu-line" style={{ '--i': 6 }} stroke={INK} strokeWidth="1.4" />
        <path d="M108 500 C 116 572 178 600 240 600 C 302 600 364 572 372 500" pathLength="1" className="ayu-line" style={{ '--i': 6.6 }} stroke={INK} strokeWidth="1.4" />
        <path d="M128 528 C 144 566 190 584 240 586" pathLength="1" className="ayu-line" style={{ '--i': 7.2 }} stroke={INK} strokeOpacity="0.3" strokeWidth="0.8" />
        {/* Side handles */}
        <path d="M108 498 C 94 496 88 504 94 512 C 98 516 106 514 110 510" pathLength="1" className="ayu-line" style={{ '--i': 7.4 }} stroke={INK} strokeWidth="1.2" />
        <path d="M372 498 C 386 496 392 504 386 512 C 382 516 374 514 370 510" pathLength="1" className="ayu-line" style={{ '--i': 7.6 }} stroke={INK} strokeWidth="1.2" />
        {/* Stand */}
        <path d="M206 600 L 198 618 L 282 618 L 274 600" pathLength="1" className="ayu-line" style={{ '--i': 7.8 }} stroke={INK} strokeWidth="1.2" />
        {/* Oil surface + ripples where the drops land */}
        <ellipse className="ayu-fill" cx="240" cy="504" rx="112" ry="15" fill={BEIGE} fillOpacity="0.22" />
        <g className="oil-ripple">
          <ellipse cx="249" cy="505" rx="16" ry="3.5" pathLength="1" className="ayu-line" style={{ '--i': 8.4 }} stroke={BEIGE} strokeWidth="1" />
        </g>
        <g className="oil-ripple oil-ripple--outer">
          <ellipse cx="249" cy="505" rx="34" ry="6.5" pathLength="1" className="ayu-line" style={{ '--i': 8.8 }} stroke={BEIGE} strokeOpacity="0.6" strokeWidth="0.9" />
        </g>

        {/* Ground line, loose leaves and jasmine */}
        <path d="M60 622 C 160 616 300 626 420 618" pathLength="1" className="ayu-line" style={{ '--i': 8 }} stroke={INK} strokeOpacity="0.3" strokeWidth="0.9" />
        <Leaf x={326} y={620} rot={68} l={40} w={13} i={9} tint />
        <Leaf x={344} y={620} rot={40} l={30} w={10} i={9.6} />
        <Jasmine x={414} y={600} i={10} />
        <Jasmine x={70} y={604} r={7} i={10.4} />
      </svg>
    </div>
  )
}
