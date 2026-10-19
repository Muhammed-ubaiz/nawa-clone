import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.')
  }

  // Ignore filter keys that are not in the schema. User input is additionally
  // coerced to strings in the controllers so it can never inject query operators.
  mongoose.set('strictQuery', true)

  const conn = await mongoose.connect(uri)
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))

  return conn
}
