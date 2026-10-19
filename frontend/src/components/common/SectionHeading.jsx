import Reveal from './Reveal'

/**
 * Eyebrow label + serif section title (+ optional intro and right-hand action).
 * Reveals as a sequence: eyebrow → title (text mask) → intro → action.
 */
export default function SectionHeading({ eyebrow, title, text, action, align = 'left', light = false, as: Tag = 'h2', className = '' }) {
  const centered = align === 'center'
  return (
    <Reveal
      variant="group"
      className={`flex flex-col gap-6 ${action ? 'md:flex-row md:items-end md:justify-between' : ''} ${centered ? 'items-center text-center' : ''} ${className}`}
    >
      <div className={centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className={`r-item eyebrow mb-4 ${light ? '!text-secondary' : ''}`} style={{ '--d': '0ms' }}>
            {eyebrow}
          </p>
        )}
        <Tag className={`h-section ${light ? '!text-white' : ''}`}>
          <span className="text-mask">
            <span className="text-mask-inner" style={{ '--d': '90ms' }}>
              {title}
            </span>
          </span>
        </Tag>
        {text && (
          <p className={`r-item lead mt-5 ${light ? '!text-white/80' : ''}`} style={{ '--d': '220ms' }}>
            {text}
          </p>
        )}
      </div>
      {action && (
        <div className="r-item shrink-0" style={{ '--d': '300ms' }}>
          {action}
        </div>
      )}
    </Reveal>
  )
}
