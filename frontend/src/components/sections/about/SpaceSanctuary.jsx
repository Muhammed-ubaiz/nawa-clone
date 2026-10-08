import { spacePhotos } from '../../../data/images'
import Reveal from '../../common/Reveal'
import { ChapterEyebrow, ChapterGlow } from './ChapterParts'

const TILES = [
  {
    key: 'room',
    tag: 'Treatment rooms',
    title: 'Private & Unhurried',
    text: 'Private treatment rooms filled with soft natural light.',
    sizes: '(min-width: 1024px) 50vw, 100vw',
    area: 'md:col-span-2 lg:col-span-2 lg:row-span-2',
    ratio: 'aspect-[4/5] md:aspect-[16/10] lg:aspect-auto',
    position: '50% 55%',
  },
  {
    key: 'herbs',
    tag: 'Herbs & oils',
    title: 'Prepared by Hand',
    text: 'Pure herbs, oils and botanicals prepared according to classical methods.',
    sizes: '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw',
    area: 'lg:col-start-3 lg:row-start-1',
    ratio: 'aspect-[4/3] md:aspect-[4/5] lg:aspect-auto',
    position: '50% 50%',
  },
  {
    key: 'lamp',
    tag: 'Warmth & aroma',
    title: 'A Place to Slow Down',
    text: 'The scent of warm herbal oils, in rooms designed for quiet.',
    sizes: '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw',
    area: 'lg:col-start-4 lg:row-span-2 lg:row-start-1',
    ratio: 'aspect-[4/3] md:aspect-[4/5] lg:aspect-auto',
    position: '50% 50%',
  },
]

const HIGHLIGHTS = ['Private treatment rooms', 'Soft natural light', 'Warm herbal aromas']

/** Photo tile: moody gradient, label set into the image, gentle zoom on hover. */
function Tile({ tile }) {
  const photo = spacePhotos[tile.key]
  return (
    <figure className={`group relative overflow-hidden rounded-[18px] bg-forest ${tile.ratio} h-full`}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={tile.sizes}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover saturate-[0.9] transition-transform duration-700 ease-premium group-hover:scale-105"
        style={{ objectPosition: tile.position }}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-forest-deep/15" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-forest-deep/90 via-forest-deep/40 to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-accent">{tile.tag}</p>
        <p className="mt-3 font-serif text-[26px] font-medium leading-[1.1] text-ivory sm:text-[28px]">{tile.title}</p>
        <p className="mt-2 max-w-[340px] text-[13.5px] leading-[1.6] text-emerald-100/70">{tile.text}</p>
      </figcaption>
    </figure>
  )
}

/**
 * About — "The Space" (Our Sanctuary). Dark section with a soft emerald glow; header, then a
 * bento gallery. Desktop (4 columns × 2 rows): a large treatment-room tile (2 × 2), herbs (top),
 * a tall lamp tile (right, 1 × 2) and a glass highlight box under the herbs. Tablet: the room
 * full width, two tiles side by side, the box full width. Phones: everything stacked.
 */
export default function SpaceSanctuary() {
  return (
    <section className="relative isolate overflow-hidden bg-herbal-base py-24 text-white md:py-32" aria-labelledby="space-title">
      <ChapterGlow spots={[{ x: '30%', y: '35%', size: '70vw', color: 'rgba(16,185,129,0.06)' }]} />
      <div className="container-x">
        <Reveal variant="group" className="grid gap-y-7 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <div className="lg:col-span-7">
            <ChapterEyebrow index="09" className="r-item" style={{ '--d': '0ms' }}>
              Our Sanctuary
            </ChapterEyebrow>
            <h2 id="space-title" className="chap-title mt-7 font-serif font-medium !text-white sm:mt-8">
              <span className="text-mask">
                <span className="text-mask-inner" style={{ '--d': '120ms' }}>
                  A Calming Sanctuary Crafted for <em className="font-normal italic text-cream">Deep</em> Healing
                </span>
              </span>
            </h2>
          </div>
          <p className="r-item max-w-md text-[15px] leading-[1.8] text-emerald-100/70 sm:text-[16px] lg:col-span-4 lg:col-start-9 lg:pb-2" style={{ '--d': '280ms' }}>
            Private treatment rooms, soft natural light and the scent of warm herbal oils — every detail is chosen to help you slow down.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:mt-20 lg:h-[680px] lg:grid-cols-4 lg:grid-rows-2 lg:gap-6">
          {TILES.map((tile, i) => (
            <Reveal key={tile.key} delay={i * 130} className={`${tile.area} lg:h-full`}>
              <Tile tile={tile} />
            </Reveal>
          ))}

          {/* Highlight box: minimal glass, no photo */}
          <Reveal delay={390} className="md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-2 lg:h-full">
            <div className="flex h-full flex-col justify-between rounded-[18px] border border-emerald-800/40 bg-emerald-950/30 p-7 backdrop-blur-md">
              <div className="flex items-end justify-between gap-4 border-b border-cream/15 pb-4">
                <span className="font-serif text-[44px] font-medium leading-[0.8] text-cream/90">09</span>
                <span className="text-right text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-cream/55">The space</span>
              </div>
              <ul className="mt-6 space-y-3.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-[11.5px] font-semibold uppercase leading-none tracking-[0.2em] text-cream/85">
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-secondary" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
