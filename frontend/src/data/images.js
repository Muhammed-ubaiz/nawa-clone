/**
 * Central image registry.
 *
 * Every image used on the site is referenced from here, so swapping in the
 * clinic's own photography is a one-file change. To use a local file, drop it
 * into src/assets/images/ and replace the URL with an import, e.g.:
 *
 *   import heroAyurveda from '../assets/images/hero-ayurveda.jpg'
 *   export const images = { heroAyurveda, ... }
 *
 * Current placeholders are royalty-free photos served from Unsplash.
 */
const u = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

/**
 * Home hero background video — a therapist pressing warm Kizhi herbal bundles onto a client's
 * back, candle bokeh behind, shallow depth of field, one slow continuous take (no cuts).
 * Source: Pexels (pexels.com/video/woman-getting-a-herbal-compress-massage-6629916), by
 * Kaboompics, real footage, Pexels License (free commercial use, no attribution required).
 *
 * Encoded locally from the 2732x1440 source: seconds 1–15 into a 12.5 s seamless loop (1.5 s
 * cross-fade at the seam), a light warm/desaturated grade, no audio, fast-start, 2 s keyframes:
 *   webm   1920x1012 VP9                 ~1.2 MB  (Chrome / Edge / Firefox)
 *   mp4    1920x1012 H.264 High          ~2.7 MB  (Safari / fallback)
 *   mobile  540x960  H.264 Main portrait ~0.6 MB  (phones; framed on the hands and bundles)
 *   poster first frame, WebP             ~40 KB   (instant paint + fallback)
 * Self-hosted so it is served as video/* with byte-range support (iOS Safari).
 */
export const heroVideo = {
  webm: '/videos/home-hero-1080.webm',
  mp4: '/videos/home-hero-1080.mp4',
  mobile: '/videos/home-hero-mobile.mp4',
  poster: '/videos/home-hero-poster.webp',
}

/**
 * Footer background — warm hot-stone Ayurvedic treatment with white flowers.
 * Responsive sizes so phones download a small file (Unsplash resizes on the fly).
 */
const FOOTER_BG_ID = '1600334129128-685c5582fd35'
export const footerBackground = {
  src: u(FOOTER_BG_ID, 1600),
  srcSet: [800, 1280, 1920].map((w) => `${u(FOOTER_BG_ID, w)} ${w}w`).join(', '),
  alt: 'Warm hot-stone Ayurvedic therapy with white flowers',
}

/**
 * About page hero — traditional Shirodhara: warm oil streaming from a brass dhara
 * vessel onto the forehead in a Kerala-style treatment room. Real photograph by
 * Charanjeet Dhiman on Unsplash (unsplash.com/photos/kvf5kfVMqng), Unsplash License.
 * Landscape 3:2; the subject sits in the left half of the original frame.
 */
const ABOUT_HERO_ID = '1775133263714-848c8fe09e73'
export const aboutHero = {
  src: u(ABOUT_HERO_ID, 1600),
  srcSet: [640, 960, 1400, 1920, 2400].map((w) => `${u(ABOUT_HERO_ID, w)} ${w}w`).join(', '),
  alt: 'Shirodhara therapy: warm herbal oil streaming from a brass vessel onto the forehead',
}

/**
 * About — "The Nawa Approach": hands grinding herbs in a stone mortar. Real photograph by
 * Katherine Hanlon on Unsplash (unsplash.com/photos/bd_fCZhy_W8), Unsplash License.
 * Landscape original; the section crops it to a 4:5 portrait around the hands and mortar.
 */
const HERBAL_PREP_ID = '1492552085122-36706c238263'
export const herbalPreparation = {
  src: u(HERBAL_PREP_ID, 1600),
  srcSet: [800, 1200, 1600, 2400].map((w) => `${u(HERBAL_PREP_ID, w)} ${w}w`).join(', '),
  alt: 'Hands grinding dried herbs in a stone mortar for an Ayurvedic preparation',
}

/**
 * About — "Our Philosophy": meditation at sunrise on a wooden deck under palms (the same
 * photo as images.meditation), with responsive sizes for the full-height chapter.
 */
const MEDITATION_ID = '1506126613408-eca07ce68773'
export const meditationPhoto = {
  src: u(MEDITATION_ID, 1600),
  srcSet: [800, 1200, 1600, 2200].map((w) => `${u(MEDITATION_ID, w)} ${w}w`).join(', '),
  alt: 'Meditation at sunrise on a wooden deck beneath palm trees',
}

/**
 * About — "Our Heritage": cinnamon bark and fresh leaves on dark wood. Real photograph by
 * Nandhu Kumar on Unsplash (unsplash.com/photos/r__CpgX6wIc), Unsplash License.
 */
const HERITAGE_ID = '1759141936083-d10203b4d4f6'
export const heritagePhoto = {
  src: u(HERITAGE_ID, 1200),
  srcSet: [700, 1000, 1400, 1800].map((w) => `${u(HERITAGE_ID, w)} ${w}w`).join(', '),
  alt: 'Cinnamon bark and fresh leaves on dark wood, traditional Ayurvedic ingredients',
}

/**
 * About — Programs (dark section). Moody art for the programs shown there; the /programs
 * page keeps its own images. Real photographs by Charanjeet Dhiman on Unsplash
 * (unsplash.com/photos/q7sqPQVazGc, unsplash.com/photos/gtsFNzCNPkw), Unsplash License.
 */
export const programMoods = {
  'stress-management': u('1775133263816-8b2a1c5d13e8', 1000), // Shirodhara in low light
  rejuvenation: u('1775133163619-219dff93bf15', 1000), // after-treatment, black & white
}

/**
 * About — "The Space". Mood photography standing in for the clinic's own rooms (replace with
 * real photos of Nawa's treatment rooms before launch). Unsplash License:
 * treatment room — Mayur Roxan (unsplash.com/photos/JnsuyfJrxQw); herbs & jars — Bundo Kim
 * (unsplash.com/photos/ur2zmbseUIA); oil lamp — Hans Vivek (unsplash.com/photos/UiMkBvDQSAA).
 */
const sized = (id, widths) => ({ src: u(id, widths[1]), srcSet: widths.map((w) => `${u(id, w)} ${w}w`).join(', ') })
export const spacePhotos = {
  room: { ...sized('1787651343620-8d5303006ecb', [700, 1100, 1600]), alt: 'A calm treatment room with a massage bed, wooden panelling and soft daylight' },
  herbs: { ...sized('1545840716-c82e9eec6930', [500, 800, 1200]), alt: 'Glass jars and copper containers of dried herbs and spices' },
  lamp: { ...sized('1489659639091-8b687bc4386e', [500, 800, 1200]), alt: 'A small oil lamp burning in a dim, quiet room' },
}

/**
 * Services hero — a therapist's hands on the forehead in a dim room, lit by a warm amber glow.
 * Real photograph from Unsplash (unsplash.com/photos/WAm_HaI4W2E), Unsplash License.
 */
export const servicesHeroPhoto = {
  ...sized('1598901986949-f593ff2a31a6', [800, 1400, 2000, 2600]),
  alt: "A therapist gently massaging a client's forehead in a dim room lit by a warm amber glow",
}

/**
 * Services — pinned "signature care" showcase, one photograph per slide. Real photographs from
 * Unsplash, Unsplash License: Shirodhara (unsplash.com/s/photos/ayurveda); oil poured into a
 * mortar of botanicals (unsplash.com/photos/mod2s3-qFOc); Kizhi herbal bundles
 * (unsplash.com/photos/YeekhTXpTgY).
 */
export const servicesShowcasePhotos = {
  purification: {
    ...sized('1775133263714-848c8fe09e73', [800, 1400, 2000, 2600]),
    alt: 'Shirodhara therapy: warm herbal oil streaming from a brass vessel onto the forehead',
  },
  rejuvenation: {
    ...sized('1492552181161-62217fc3076d', [800, 1400, 2000, 2600]),
    alt: 'Herbal oil being poured into a stone mortar of fresh botanicals',
  },
  clinical: {
    ...sized('1775133262667-316bd4d9e5b5', [800, 1400, 2000, 2600]),
    alt: "A therapist pressing warm Kizhi herbal bundles onto a client's back",
  },
}

/**
 * Service details — hero photograph per service (split story hero, photo on the right).
 * Services without their own entry use `serviceHeroFallback`.
 */
export const serviceHeroPhotos = {
  'ayurvedic-therapies': servicesShowcasePhotos.clinical, // Kizhi herbal bundles
}
export const serviceHeroFallback = servicesHeroPhoto

export const images = {
  // Hero / brand
  heroAyurveda: u('1600334089648-b0d9d3028eb2', 1400),
  heroSecondary: u('1519824145371-296894a0daa9', 700),
  aboutAyurveda: u('1540555700478-4be289fbecef', 1000),
  aboutSecondary: u('1507652313519-d4e9174996dd', 700),
  whoWeAre: u('1544161515-4ab6ce6db874', 1000),
  therapy: u('1515377905703-c4788e51af15', 1000),
  shirodhara: u('1600334129128-685c5582fd35', 1000),
  herbs: u('1603398938378-e54eab446dde', 1000),
  spices: u('1597481499750-3e6b22637e12', 1000),
  oils: u('1608571423902-eed4a5ad8108', 1000),
  candles: u('1519415510236-718bdfcd89c8', 1200),
  meditation: u('1506126613408-eca07ce68773', 1000),
  space: u('1600428877878-1a0fd85beda8', 1400),
  ctaBackground: u('1596178060671-7a80dc8059ea', 1600),

  // Services
  ayurvedicTherapies: u('1552693673-1bf958298935'),
  bodyScrubs: u('1570172619644-dfd03ed5d881'),
  easeYourMind: u('1545205597-3d9d02c29597'),
  facialShineBright: u('1512290923902-8a9f81dc236c'),
  hairPacks: u('1560066984-138dadb4c035'),
  wellnessTreatments: u('1591343395082-e120087004b4'),
  chiropractic: u('1620733723572-11c53f73a416'),
  massage: u('1544161515-4ab6ce6db874'),
  physical: u('1517836357463-d25dfeac3438'),

  // Programs
  weightLoss: u('1512621776951-a57141f2eefd'),
  skinCare: u('1616394584738-fc6e612e71b9'),
  eyeCare: u('1487412947147-5cebf100ffc2'),
  hairCare: u('1522337360788-8b13dee7a37e'),
  panchakarma: u('1471943311424-646960669fbc'),
  prenatal: u('1531299204812-e6d44d9a185c'),
  stressManagement: u('1544367567-0f2fcb009e0b'),
  rejuvenation: u('1556228578-8c89e6adf883'),

  // People
  founder: u('1580489944761-15a19d654956', 900),
  client1: u('1438761681033-6461ffad8d80', 200),
  client2: u('1507003211169-0a1dd7228f2d', 200),
  client3: u('1531746020798-e6953c6e8e04', 200),

  // Blog
  blogResults: u('1505576399279-565b52d4ac71'),
  blogEczema: u('1559599101-f09722fb4948'),
  blogStress: u('1588286840104-8957b019727f'),
  blogMigraine: u('1556760544-74068565f05c'),
  blogBackPain: u('1576091160550-2173dba999ef'),
  blogPanchakarma: u('1582750433449-648ed127bb54'),
}
