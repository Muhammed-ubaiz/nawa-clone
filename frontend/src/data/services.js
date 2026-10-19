import { images } from './images'

/**
 * Fallback copy of the six service categories, used only when the API is
 * unreachable. The live list is managed in the admin panel (Service model).
 */
const baseServices = [
  {
    slug: 'ayurvedic-therapies',
    title: 'Ayurvedic Therapies',
    short: 'Classical oil therapies and herbal treatments that rebalance the doshas and restore natural vitality.',
    image: images.ayurvedicTherapies,
    intro:
      'Our Ayurvedic therapies follow time-honoured protocols adapted to your constitution. After a consultation with our practitioner, each session combines warm medicated oils, rhythmic techniques and herbal preparations chosen specifically for you.',
    treatments: [
      { name: 'Abhyanga', text: 'Full-body warm oil massage that nourishes tissues, calms the nervous system and improves circulation.' },
      { name: 'Shirodhara', text: 'A steady stream of warm herbal oil poured over the forehead to quiet the mind and support restful sleep.' },
      { name: 'Kizhi (Herbal Poultice)', text: 'Heated bundles of herbs pressed onto the body to ease stiffness, joint pain and muscle tension.' },
      { name: 'Udvartana', text: 'Invigorating dry herbal powder massage that stimulates metabolism and refines the skin.' },
    ],
    benefits: ['Relieves muscle and joint stiffness', 'Supports detoxification', 'Deepens sleep quality', 'Balances Vata, Pitta and Kapha'],
  },
  {
    slug: 'body-scrubs-wraps',
    title: 'Body Scrubs & Wraps',
    short: 'Herbal exfoliation and nourishing wraps that leave skin soft, renewed and naturally radiant.',
    image: images.bodyScrubs,
    intro:
      'Using finely ground herbs, grains and botanical pastes, our scrubs and wraps gently remove dull skin, draw out impurities and lock in deep hydration — an ideal ritual on its own or after an oil therapy.',
    treatments: [
      { name: 'Herbal Body Scrub', text: 'Exfoliating blend of chickpea flour, turmeric and herbs to brighten and smooth the skin.' },
      { name: 'Detox Clay Wrap', text: 'Mineral-rich clay paired with herbal infusions to purify and tone.' },
      { name: 'Aloe & Sandalwood Wrap', text: 'Cooling wrap that soothes heat-sensitive or sun-exposed skin.' },
      { name: 'Coffee & Coconut Polish', text: 'Energising polish that stimulates circulation and leaves skin silky.' },
    ],
    benefits: ['Removes dead skin cells', 'Improves skin texture and tone', 'Promotes lymphatic flow', 'Deeply hydrates and softens'],
  },
  {
    slug: 'ease-your-mind',
    title: 'Ease Your Mind',
    short: 'Calming rituals designed to release stress, soothe anxiety and bring the mind back to stillness.',
    image: images.easeYourMind,
    intro:
      'Mental fatigue often shows up in the body first. These treatments focus on the head, neck and senses to settle an overactive mind, relieve tension headaches and help you reconnect with a sense of calm.',
    treatments: [
      { name: 'Shiro Abhyanga', text: 'Head, neck and shoulder massage with warm herbal oils to melt away tension.' },
      { name: 'Nasya', text: 'Gentle herbal nasal therapy that clears the head and supports mental clarity.' },
      { name: 'Takradhara', text: 'Medicated buttermilk stream therapy that cools the mind and eases restlessness.' },
      { name: 'Guided Relaxation', text: 'Breathwork and stillness practice to extend the benefits of your treatment at home.' },
    ],
    benefits: ['Reduces stress and anxiety', 'Eases tension headaches', 'Improves focus and clarity', 'Encourages restful sleep'],
  },
  {
    slug: 'facial-shine-bright',
    title: 'Facial Shine Bright',
    short: 'Botanical facials using herbs, oils and gentle massage for a clear, glowing complexion.',
    image: images.facialShineBright,
    intro:
      'Our facials treat the skin as a reflection of inner balance. Natural cleansers, herbal masks and marma point massage work together to clarify, firm and illuminate the complexion without harsh chemicals.',
    treatments: [
      { name: 'Kumkumadi Glow Facial', text: 'Saffron-infused ritual that evens tone and restores luminosity.' },
      { name: 'Herbal Detox Facial', text: 'Deep cleansing with neem and tulsi to calm breakouts and congestion.' },
      { name: 'Mukha Lepam', text: 'Traditional herbal face pack to nourish and tighten the skin.' },
      { name: 'Marma Face Massage', text: 'Pressure point massage to relieve facial tension and boost circulation.' },
    ],
    benefits: ['Brightens dull skin', 'Calms inflammation and acne', 'Softens fine lines', 'Natural, chemical-free care'],
  },
  {
    slug: 'hair-packs',
    title: 'Hair Packs',
    short: 'Nourishing herbal hair and scalp treatments that strengthen roots and restore natural shine.',
    image: images.hairPacks,
    intro:
      'Healthy hair starts with a balanced scalp. Our herbal hair packs combine amla, bhringraj, hibiscus and fenugreek with scalp massage to reduce hair fall, control dandruff and bring back softness and shine.',
    treatments: [
      { name: 'Bhringraj Hair Pack', text: 'Strengthening blend that supports healthy growth and reduces hair fall.' },
      { name: 'Hibiscus & Amla Pack', text: 'Conditioning treatment for dry, brittle or colour-treated hair.' },
      { name: 'Anti-Dandruff Herbal Pack', text: 'Neem and fenugreek formula to purify and soothe the scalp.' },
      { name: 'Scalp Oil Therapy', text: 'Warm oil massage that relaxes the scalp and nourishes follicles.' },
    ],
    benefits: ['Reduces hair fall', 'Controls dandruff', 'Restores softness and shine', 'Soothes an irritated scalp'],
  },
  {
    slug: 'wellness-treatments',
    title: 'Wellness Treatments',
    short: 'Holistic programs for detox, immunity and long-term balance, tailored to your constitution.',
    image: images.wellnessTreatments,
    intro:
      'Wellness treatments look at the whole person — digestion, sleep, energy and emotional health. Your practitioner designs a plan that may combine therapies, herbal support and lifestyle guidance to build resilience over time.',
    treatments: [
      { name: 'Detox Programs', text: 'Guided cleansing protocols that support digestion and elimination.' },
      { name: 'Immunity Boost', text: 'Rasayana therapies and herbs that strengthen natural defences.' },
      { name: 'Pain Management', text: 'Targeted therapies for back, neck and joint discomfort.' },
      { name: 'Lifestyle Consultation', text: 'Personalised diet, routine and seasonal guidance from our practitioner.' },
    ],
    benefits: ['Supports whole-body balance', 'Strengthens immunity', 'Improves digestion and energy', 'Sustainable, long-term results'],
  },
]

/** Steps shared by every service detail page. */
export const serviceProcess = [
  { step: '01', title: 'Consultation', text: 'We assess your constitution, health history and goals in a one-to-one consultation.' },
  { step: '02', title: 'Personal Plan', text: 'Your practitioner recommends therapies, frequency and any herbal support.' },
  { step: '03', title: 'Treatment', text: 'Sessions take place in a calm private room with our trained therapists.' },
  { step: '04', title: 'Aftercare', text: 'Take-home guidance on diet and routine helps the results last.' },
]

/** "Core focus" disciplines shown at the top of the Services page. */
export const coreFocus = [
  {
    eyebrow: 'Our Core Focus',
    title: 'Chiropractic Care',
    text: 'Gentle manual adjustments that improve spinal alignment, relieve back and neck pain and help the body move freely again.',
    image: images.chiropractic,
  },
  {
    eyebrow: 'Complementary',
    title: 'Massage Therapy',
    text: 'Therapeutic massage that releases deep muscle tension, improves circulation and supports faster recovery.',
    image: images.massage,
  },
  {
    eyebrow: 'Rehabilitative',
    title: 'Physical Therapy',
    text: 'Guided movement and strengthening routines that restore mobility after injury and prevent future strain.',
    image: images.physical,
  },
]

/** Same shape as the API Service model: name, slug, shortDescription, description, image, benefits, process. */
export const fallbackServices = baseServices.map((s, i) => ({
  _id: `fallback-${s.slug}`,
  name: s.title,
  slug: s.slug,
  shortDescription: s.short,
  description: s.intro,
  image: s.image,
  benefits: s.benefits,
  process: s.treatments.map((t) => ({ title: t.name, text: t.text })),
  published: true,
  order: i,
}))
