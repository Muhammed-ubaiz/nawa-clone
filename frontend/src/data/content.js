import { Headset, Leaf, ShieldCheck, Clock, HeartPulse, Sprout, Sparkles } from 'lucide-react'
import { images } from './images'

export const whyChooseUs = [
  {
    icon: Headset,
    title: 'Customer Services Support',
    text: 'Our friendly and knowledgeable team ensures every guest enjoys a smooth, stress-free experience from consultation to recovery.',
  },
  {
    icon: Leaf,
    title: 'Treatment Services',
    text: 'Discover a range of authentic Ayurvedic therapies carefully tailored to your individual needs from relaxation to detox and healing.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guarantee',
    text: 'We use traditional Ayurvedic oils, herbs, and techniques rooted in Ayurvedic healing traditions.',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    text: 'Your wellness matters every moment. Reach us anytime for guidance, appointments, or aftercare support.',
  },
]

/**
 * Therapists. `image: null` shows the botanical "Therapist Profile" placeholder; to add a real
 * portrait, set `image` to an imported file or URL (portrait, ideally 4:5) and it appears automatically.
 * `credentials` (e.g. 'BAMS, MD (Ayu)') and `experience` (e.g. '12 years clinical experience') are
 * optional and shown on the About page cards when filled in. Leave them null until verified —
 * they are qualifications of real practitioners and must be accurate.
 */
export const team = [
  { name: 'Dr. Anjali Menon', role: 'Chief Ayurvedic Physician', image: null, credentials: null, experience: null },
  { name: 'Dr. Rahul Nair', role: 'Ayurveda & Panchakarma Specialist', image: null, credentials: null, experience: null },
  { name: 'Dr. Priya Das', role: 'Senior Wellness Therapist', image: null, credentials: null, experience: null },
]

export const pillars = [
  { icon: HeartPulse, title: 'Calm Mind', text: 'Therapies that settle the nervous system and bring lasting mental clarity.' },
  { icon: Sprout, title: 'Natural Care', text: 'Pure herbs, oils and botanicals prepared according to classical methods.' },
  { icon: Sparkles, title: 'Healthy Living', text: 'Practical diet and routine guidance that keeps you well between visits.' },
]

export const expectations = [
  { title: 'Experience', text: 'A calm, private and unhurried visit where you are listened to from the very first conversation.' },
  { title: 'Our Approach to Healing', text: 'We address the root cause of imbalance, combining therapies, herbs and lifestyle guidance.' },
  { title: 'What Makes Us Different', text: 'Qualified practitioners, authentic preparations and plans that adapt as you progress.' },
  { title: 'Our Healing Philosophy', text: 'Health is harmony between body, mind and spirit — and every person deserves a path that fits them.' },
]

// `treatment` only restates what each review itself says.
export const testimonials = [
  {
    name: 'Sarah M.',
    location: 'Abu Dhabi',
    image: images.client1,
    treatment: 'Shirodhara',
    text: 'The Shirodhara session was the most relaxing hour I have had in years. The team took time to understand what I needed and I slept beautifully that night.',
  },
  {
    name: 'Omar K.',
    location: 'Al Reem Island',
    image: images.client2,
    treatment: 'Back pain · 2-week program',
    text: 'I came in for lower back pain after months of discomfort. After a two-week program I am moving freely again. Professional, warm and genuinely caring.',
  },
  {
    name: 'Leena R.',
    location: 'Khalifa City',
    image: images.client3,
    treatment: 'Skin care',
    text: 'My skin has never looked calmer. I appreciated the honest advice on diet and routine as much as the treatments themselves.',
  },
]

export const stats = [
  { value: '10+', label: 'Years of Experience' },
  { value: '1000+', label: 'Happy Patients' },
  { value: '25+', label: 'Authentic Therapies' },
  { value: '5.0', label: 'Google Rating' },
]
