import { images } from '../data/images'
import { useSEO } from '../hooks/useSEO'
import AboutStory from '../components/sections/AboutStory'
import BehindThePractice from '../components/sections/BehindThePractice'
import NawaApproach from '../components/sections/NawaApproach'
import OurPhilosophy from '../components/sections/about/OurPhilosophy'
import Practitioners from '../components/sections/about/Practitioners'
import HealingJourney from '../components/sections/about/HealingJourney'
import ValuesImpact from '../components/sections/about/ValuesImpact'
import ProgramsShowcase from '../components/sections/about/ProgramsShowcase'
import PatientStories from '../components/sections/about/PatientStories'

export default function About() {
  useSEO({
    title: 'About Us',
    description: 'Learn about Nawa Ayurvedic Medical Center in Abu Dhabi — our practitioners, philosophy and approach to authentic Ayurvedic healing.',
    image: images.aboutAyurveda,
  })

  return (
    <>
      {/* One continuous #08231C canvas under every chapter. Each section paints the same base,
          and its glows fade out before its edges (.edge-fade), so no join is ever visible. */}
      <div className="w-full bg-herbal-base">
        <AboutStory />
        <BehindThePractice />

        <NawaApproach />

        <OurPhilosophy />

        <Practitioners />

        <HealingJourney />

        <ValuesImpact />

        <ProgramsShowcase />

        <PatientStories />
      </div>
    </>
  )
}
