import mongoose from 'mongoose'

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const appointmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    phone: { type: String, required: [true, 'Phone is required'], trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    date: { type: Date, required: [true, 'Preferred date is required'] },
    time: { type: String, trim: true, maxlength: 20 },
    service: { type: String, required: [true, 'Service is required'], trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'Pending', index: true },
  },
  { timestamps: true },
)

appointmentSchema.index({ createdAt: -1 })
appointmentSchema.index({ date: 1 })

export default mongoose.model('Appointment', appointmentSchema)
