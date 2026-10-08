import { Fragment } from 'react'

/**
 * Renders the lightweight Markdown used for articles — without HTML injection:
 *   blank line   -> new paragraph
 *   "## Heading" -> h2,  "### Sub" -> h3
 *   "- item"     -> bullet list
 *   **bold**     -> strong
 */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-text">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

export function parseBlocks(content = '') {
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('### ')) return { type: 'h3', text: chunk.slice(4) }
      if (chunk.startsWith('## ')) return { type: 'h2', text: chunk.slice(3) }
      const lines = chunk.split('\n')
      if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) return { type: 'ul', items: lines.map((l) => l.trim().replace(/^[-*]\s+/, '')) }
      return { type: 'p', text: lines.join(' ') }
    })
}

export default function BlogContent({ content, className = '' }) {
  return (
    <div className={`prose-nawa ${className}`}>
      {parseBlocks(content).map((b, i) => {
        if (b.type === 'h2') return <h2 key={i}>{inline(b.text)}</h2>
        if (b.type === 'h3') return <h3 key={i} className="mb-3 mt-8 font-serif text-[26px] leading-tight">{inline(b.text)}</h3>
        if (b.type === 'ul')
          return (
            <ul key={i}>
              {b.items.map((item, k) => (
                <li key={k}>{inline(item)}</li>
              ))}
            </ul>
          )
        return <p key={i}>{inline(b.text)}</p>
      })}
    </div>
  )
}
