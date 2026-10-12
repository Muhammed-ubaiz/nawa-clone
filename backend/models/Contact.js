import { defineModel } from './collection.js'

export const CONTACT_STATUSES = ['New', 'Read']

/** Contact-form messages and newsletter sign-ups (Firestore collection "contacts"). */
export default defineModel('contacts', {
  fields: {
    name: { type: 'string', required: true, requiredMessage: 'Name is required', trim: true, maxlength: 100 },
    email: { type: 'string', required: true, requiredMessage: 'Email is required', trim: true, lowercase: true, maxlength: 120 },
    phone: { type: 'string', trim: true, maxlength: 30 },
    message: { type: 'string', required: true, requiredMessage: 'Message is required', trim: true, maxlength: 3000 },
    status: { type: 'string', enum: CONTACT_STATUSES, default: 'New' },
  },
})
