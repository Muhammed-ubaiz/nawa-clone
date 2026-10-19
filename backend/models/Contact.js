import mongoose from 'mongoose'

export const CONTACT_STATUSES = ['New', 'Read']

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 3000 },
    status: { type: String, enum: CONTACT_STATUSES, default: 'New', index: true },
  },
  { timestamps: true },
)

contactSchema.index({ createdAt: -1 })

export default mongoose.model('Contact', contactSchema)
