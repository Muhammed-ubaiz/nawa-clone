import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import ApiError from '../utils/ApiError.js'

const signToken = (admin) =>
  jwt.sign({ id: admin._id.toString(), role: admin.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })

/** POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body
  const admin = await Admin.findOne({ email: String(email).toLowerCase() }).select('+password')

  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!admin || !(await admin.matchPassword(String(password)))) {
    throw ApiError.unauthorized('Invalid email or password.')
  }

  const token = signToken(admin)
  const { exp } = jwt.decode(token)
  res.json({
    success: true,
    token,
    expiresAt: exp * 1000,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  })
}

/** GET /api/auth/me — validates the current token and returns the admin profile. */
export async function me(req, res) {
  const { _id, name, email, role, createdAt } = req.admin
  res.json({ success: true, admin: { id: _id, name, email, role, createdAt } })
}
