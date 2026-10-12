import bcrypt from 'bcryptjs'
import { defineModel } from './collection.js'

/** Admin accounts (Firestore collection "admins"). Passwords are bcrypt-hashed, never returned. */
const Admin = defineModel('admins', {
  fields: {
    name: { type: 'string', required: true, trim: true, maxlength: 80 },
    email: { type: 'string', required: true, unique: true, lowercase: true, trim: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'] },
    password: { type: 'string', required: true, minlength: 8 },
    role: { type: 'string', enum: ['admin', 'editor'], default: 'admin' },
  },
  timestamps: { createdAt: true, updatedAt: false },
  hidden: ['password'],
})

const hash = (plain) => bcrypt.hash(plain, 12)

export default {
  ...Admin,

  /** Creates an admin; the plain-text password is validated, then hashed. */
  async create(input, opts) {
    Admin.clean(input) // validates the plain password (min length) before hashing
    return Admin.create({ ...input, password: await hash(String(input.password)) }, opts)
  },

  /** Sets a new password (hashed) and optional other fields. */
  async updateWithPassword(id, { password, ...rest }) {
    if (password !== undefined) {
      Admin.clean({ ...rest, password }, { partial: true })
      return Admin.update(id, { ...rest, password: await hash(String(password)) })
    }
    return Admin.update(id, rest)
  },

  /** Compares a candidate password with the stored hash (doc must be loaded withHidden). */
  matchPassword: (admin, candidate) => bcrypt.compare(String(candidate), admin.password || ''),
}
