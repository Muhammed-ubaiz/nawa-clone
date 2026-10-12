import { defineModel } from './collection.js'

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

/** Appointment requests (Firestore collection "appointments"). */
export default defineModel('appointments', {
  fields: {
    name: { type: 'string', required: true, requiredMessage: 'Name is required', trim: true, maxlength: 100 },
    phone: { type: 'string', required: true, requiredMessage: 'Phone is required', trim: true, maxlength: 30 },
    email: { type: 'string', trim: true, lowercase: true, maxlength: 120 },
    date: { type: 'date', required: true, requiredMessage: 'Preferred date is required' },
    time: { type: 'string', trim: true, maxlength: 20 },
    service: { type: 'string', required: true, requiredMessage: 'Service is required', trim: true, maxlength: 120 },
    message: { type: 'string', trim: true, maxlength: 2000 },
    status: { type: 'string', enum: APPOINTMENT_STATUSES, default: 'Pending' },
  },
})
