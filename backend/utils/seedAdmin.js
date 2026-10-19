/**
 * Creates the first admin account from environment variables.
 *
 *   npm run seed-admin            -> creates the admin if the email does not exist
 *   npm run seed-admin -- --reset -> also resets the password of an existing admin
 *
 * Required env: ADMIN_EMAIL, ADMIN_PASSWORD (min 8 chars). Optional: ADMIN_NAME.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Admin from '../models/Admin.js'

const { ADMIN_NAME = 'Clinic Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
const reset = process.argv.includes('--reset')

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.')
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.')
  if (ADMIN_PASSWORD === 'change-this-password') throw new Error('Please change ADMIN_PASSWORD from the example value.')

  await connectDB()
  const email = ADMIN_EMAIL.toLowerCase().trim()
  const existing = await Admin.findOne({ email }).select('+password')

  if (existing && !reset) {
    console.log(`Admin ${email} already exists. Use "npm run seed-admin -- --reset" to reset the password.`)
  } else if (existing) {
    existing.password = ADMIN_PASSWORD // hashed by the pre-save hook
    existing.name = ADMIN_NAME
    await existing.save()
    console.log(`Password reset for admin ${email}.`)
  } else {
    await Admin.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' })
    console.log(`Admin ${email} created.`)
  }
}

run()
  .catch((err) => {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.connection.close())
