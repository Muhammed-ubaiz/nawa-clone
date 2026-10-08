import Reveal from '../common/Reveal'
import ServiceCard from './ServiceCard'

const COLS = {
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/** Responsive grid of service cards with staggered reveal. `variant` is passed to each ServiceCard. */
export default function ServiceGrid({ services, columns = 3, className = '', variant }) {
  return (
    <div className={`grid gap-x-6 gap-y-12 ${COLS[columns]} ${className}`}>
      {services.map((s, i) => (
        <Reveal key={s._id || s.slug} delay={(i % columns) * 100}>
          <ServiceCard service={s} index={i} variant={variant} />
        </Reveal>
      ))}
    </div>
  )
}
