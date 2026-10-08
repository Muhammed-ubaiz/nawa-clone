import { Link } from 'react-router-dom'
import { aboutHero } from '../../data/images'
import StoryHero from './StoryHero'

const CHAPTERS = [
  {
    eyebrow: 'About Nawa Ayurveda',
    title: 'Nawa Ayurveda',
    text: 'Where ancient Ayurvedic wisdom meets thoughtful, personalized care for a healthier and more balanced life.',
  },
  {
    eyebrow: 'Our Philosophy',
    title: 'Rooted in Ancient Wisdom',
    text: 'Inspired by the timeless principles of Ayurveda, we believe true healing begins by understanding the individual as a whole.',
  },
  {
    eyebrow: 'Personalized Care',
    title: 'Healing Designed Around You',
    text: "Every individual is unique. Our approach combines traditional knowledge with personalized care to support your body's natural balance.",
  },
  {
    eyebrow: 'Your Wellness Journey',
    title: 'A Journey Towards Balance',
    text: 'Discover a calmer, healthier way of living through authentic Ayurvedic care and mindful wellness.',
    actions: [{ to: '/appointment', label: 'Book an Appointment' }],
  },
]

/**
 * About page opening: the scroll-told story over one constant Shirodhara photo (split
 * layout — photo band on phones, right-hand photo on desktop). The photo is mirrored so
 * the treatment faces into the page.
 */
export default function AboutStory({ chapters = CHAPTERS, photo = aboutHero }) {
  return (
    <StoryHero
      label="About Nawa Ayurveda"
      layout="split"
      theme="logo"
      chapters={chapters}
      media={
        <div className="h-full w-full -scale-x-100">
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(min-width: 1280px) 64vw, (min-width: 1024px) 70vw, 100vw"
            alt={photo.alt}
            fetchPriority="high"
            decoding="async"
            className="about-hero-media h-full w-full object-cover object-[16%_42%] lg:object-[12%_45%]"
          />
        </div>
      }
      footer={
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em] text-mist/55 sm:text-[11.5px]">
            <li>
              <Link to="/" className="rounded-sm transition-colors duration-300 hover:text-white focus-visible:outline-logo-gold">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-logo-gold">/</li>
            <li aria-current="page" className="text-mist/90">About</li>
          </ol>
        </nav>
      }
    />
  )
}
