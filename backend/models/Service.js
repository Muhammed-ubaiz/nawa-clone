import mongoose from 'mongoose'

const stepSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    text: { type: String, trim: true, maxlength: 400 },
  },
  { _id: false },
)

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000 },
    image: { type: String, trim: true },
    benefits: { type: [String], default: [] },
    // Treatment steps / therapies that make up this service, shown as "Treatment Details".
    process: { type: [stepSchema], default: [] },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

serviceSchema.set('toJSON', { versionKey: false })

export default mongoose.model('Service', serviceSchema)
