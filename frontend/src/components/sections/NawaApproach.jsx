import { herbalPreparation } from '../../data/images'
import CinematicChapter from './CinematicChapter'

/** About — "The Nawa Approach": dark chapter two (hands preparing herbs). */
export default function NawaApproach() {
  return (
    <CinematicChapter
      id="approach-title"
      eyebrow="The Nawa Approach"
      title={
        <>
          <span className="block">Wellness Begins</span>
          <span className="block">
            With <em className="font-normal italic text-logo-gold">Balance</em>
          </span>
        </>
      }
      lead="Ayurveda is more than a treatment. It is a way of understanding the relationship between body, mind and everyday life."
      note="At Nawa Ayurveda, we bring this timeless perspective into a thoughtful, personalized approach to wellbeing."
      index="02"
      meta="A thoughtful approach"
      items={[
        ['Restore', 'Return the body to balance.'],
        ['Reconnect', 'Listen to what the body needs.'],
        ['Renew', 'Create healthier everyday rhythms.'],
      ]}
      photo={herbalPreparation}
      position={{ base: '42% 50%', lg: '38% 50%' }}
      theme="logo"
    />
  )
}
