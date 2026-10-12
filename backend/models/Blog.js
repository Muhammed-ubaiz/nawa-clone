import mongoose from 'mongoose'

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 400 },
    // Lightweight Markdown: paragraphs, "## " headings and "- " bullet lists.
    content: { type: String, required: [true, 'Content is required'] },
    featuredImage: { type: String, trim: true },
    category: { type: String, trim: true, default: 'Wellness', maxlength: 60 },
    author: { type: String, trim: true, default: 'Nawa Ayurveda Team', maxlength: 80 },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

blogSchema.index({ published: 1, createdAt: -1 })

/** Estimated reading time based on ~200 words per minute. */
blogSchema.virtual('readTime').get(function readTime() {
  const words = (this.content || '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
})

blogSchema.set('toJSON', { virtuals: true, versionKey: false })

export default mongoose.model('Blog', blogSchema)
