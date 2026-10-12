import { defineModel } from './collection.js'

/** Estimated reading time based on ~200 words per minute. */
const readTime = (doc) => {
  const words = (doc.content || '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}

/** Blog articles (Firestore collection "blogs"). */
export default defineModel('blogs', {
  fields: {
    title: { type: 'string', required: true, requiredMessage: 'Title is required', trim: true, maxlength: 180 },
    slug: { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: 'string', trim: true, maxlength: 400 },
    // Lightweight Markdown: paragraphs, "## " headings and "- " bullet lists.
    content: { type: 'string', required: true, requiredMessage: 'Content is required' },
    featuredImage: { type: 'string', trim: true },
    category: { type: 'string', trim: true, default: 'Wellness', maxlength: 60 },
    author: { type: 'string', trim: true, default: 'Nawa Ayurveda Team', maxlength: 80 },
    published: { type: 'boolean', default: false },
  },
  virtuals: { readTime },
  idAlias: true,
})
