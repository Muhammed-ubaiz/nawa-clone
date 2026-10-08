import { useReveal } from '../../hooks/useReveal'

const VARIANTS = {
  up: 'reveal', // fade + rise
  mask: 'reveal reveal--mask', // image frame opens upward; wrap the image in .reveal-media
  group: 'reveal reveal--group', // container static; children with .r-item / .text-mask stagger in
}

/**
 * Reveals its content once when scrolled into view (see the motion system in index.css).
 * `delay` (ms) offsets the whole element — use it to stagger grid items.
 */
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', style, children, ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      className={`${VARIANTS[variant] || VARIANTS.up} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
