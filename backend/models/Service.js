import { defineModel } from './collection.js'

/** Service categories (Firestore collection "services"). */
export default defineModel('services', {
  fields: {
    name: { type: 'string', required: true, requiredMessage: 'Name is required', trim: true, maxlength: 120 },
    slug: { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: 'string', trim: true, maxlength: 300 },
    description: { type: 'string', trim: true, maxlength: 5000 },
    image: { type: 'string', trim: true },
    benefits: { type: 'stringArray', default: () => [] },
    // Treatment steps / therapies that make up this service, shown as "Treatment Details".
    process: {
      type: 'objectArray',
      of: { title: { type: 'string', required: true, trim: true, maxlength: 80 }, text: { type: 'string', trim: true, maxlength: 400 } },
      default: () => [],
    },
    published: { type: 'boolean', default: true },
    order: { type: 'number', default: 0 },
  },
})
