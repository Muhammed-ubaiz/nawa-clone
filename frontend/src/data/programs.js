import { images } from './images'

/** The four featured programs appear on the home page; all appear on /programs. */
export const programs = [
  {
    slug: 'weight-loss-therapy',
    title: 'Weight Loss Therapy',
    text: 'Udvartana powder massage, herbal steam and a personalised diet plan to boost metabolism and support healthy, lasting weight management.',
    image: images.weightLoss,
    duration: '14 – 28 days',
    featured: true,
  },
  {
    slug: 'skin-care-therapy',
    title: 'Skin Care Therapy',
    text: 'Internal and external care for eczema, acne and pigmentation, combining herbal remedies, cleansing therapies and botanical skin rituals.',
    image: images.skinCare,
    duration: '7 – 21 days',
    featured: true,
  },
  {
    slug: 'eye-care-therapy',
    title: 'Eye Care Therapy',
    text: 'Netra Tarpana and soothing eye treatments that relieve screen strain, dryness and fatigue while nourishing the delicate eye area.',
    image: images.eyeCare,
    duration: '5 – 7 days',
    featured: true,
  },
  {
    slug: 'hair-care-therapy',
    title: 'Hair Care Therapy',
    text: 'Scalp therapies, herbal oils and hair packs that address hair fall, dandruff and premature greying from the root.',
    image: images.hairCare,
    duration: '7 – 14 days',
    featured: true,
  },
  {
    slug: 'panchakarma',
    title: 'Panchakarma',
    text: 'The classical five-fold Ayurvedic detox, carefully supervised to cleanse accumulated toxins and reset the body at a deep level.',
    image: images.panchakarma,
    duration: '7 – 21 days',
    // Short inclusions, taken only from the program description above.
    inclusions: ['Classical five-fold detox', 'Carefully supervised throughout', 'Cleanses accumulated toxins'],
  },
  {
    slug: 'prenatal-postnatal',
    title: 'Prenatal & Postnatal for Mothers',
    text: 'Gentle, nurturing care for mothers before and after childbirth to ease discomfort, restore strength and support emotional wellbeing.',
    image: images.prenatal,
    duration: 'Flexible',
  },
  {
    slug: 'stress-management',
    title: 'Stress Management',
    text: 'A calming program of Shirodhara, head massage and breathwork to settle the nervous system and restore restful sleep.',
    image: images.stressManagement,
    duration: '5 – 14 days',
    inclusions: ['Shirodhara & head massage', 'Guided breathwork', 'Supports restful sleep'],
  },
  {
    slug: 'rejuvenation',
    title: 'Rejuvenation',
    text: 'Rasayana therapies that replenish energy, slow the signs of ageing and leave you feeling renewed from within.',
    image: images.rejuvenation,
    duration: '7 – 14 days',
    inclusions: ['Rasayana therapies', 'Replenishes energy', 'Renewal from within'],
  },
]

export const featuredPrograms = programs.filter((p) => p.featured)
