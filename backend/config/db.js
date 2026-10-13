import mongoose from 'mongoose'

/** Host + database only, for log messages — credentials are never printed. */
function describe(uri) {
  try {
    const u = new URL(uri)
    return `${u.host}/${u.pathname.replace(/^\//, '') || '(default "test" database)'}`
  } catch {
    return '(unparseable MONGODB_URI)'
  }
}

/** Catches the common mistakes before Atlas is even contacted. */
function checkUri(uri) {
  if (/<db_password>|<password>|<db_username>|<username>/i.test(uri)) {
    throw new Error(
      'MONGODB_URI still contains a placeholder such as <db_password>. Replace it (angle brackets included) with the real Atlas database-user password in backend/.env.',
    )
  }
  const creds = uri.match(/^mongodb(?:\+srv)?:\/\/([^@/]*)@/)?.[1]
  if (creds) {
    const password = creds.slice(creds.indexOf(':') + 1)
    if (/[@:/?#[\]]/.test(password)) {
      throw new Error(
        'The password in MONGODB_URI contains a character that must be URL-encoded (@ : / ? # [ ]). Encode it (e.g. @ → %40) or set an alphanumeric password in Atlas → Database Access.',
      )
    }
  }
}

/** Plain-language hints for the Atlas errors people actually hit. */
function hint(err) {
  const msg = err?.message || ''
  if (/bad auth|authentication failed/i.test(msg)) {
    return 'Atlas rejected the username/password in MONGODB_URI. Check them against Atlas → Database Access (reset the password there if unsure), and URL-encode any special characters.'
  }
  if (/ENOTFOUND|querySrv|ETIMEOUT/i.test(msg)) {
    return 'The cluster host could not be resolved/reached. Check the host in MONGODB_URI and your internet/DNS connection.'
  }
  if (/whitelist|not allowed to access|IP.*access list|Server selection timed out|ECONNREFUSED/i.test(msg)) {
    return "This machine's IP may not be allowed. Add it in Atlas → Network Access (or check the cluster is running)."
  }
  return ''
}

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGODB_URI (or MONGO_URI) is not set. Copy .env.example to .env and fill it in.')
  }
  checkUri(uri)

  // Ignore filter keys that are not in the schema. User input is additionally
  // coerced to strings in the controllers so it can never inject query operators.
  mongoose.set('strictQuery', true)

  let conn
  try {
    conn = await mongoose.connect(uri)
  } catch (err) {
    const tip = hint(err)
    console.error(`MongoDB connection to ${describe(uri)} failed.`)
    if (tip) console.error(`Hint: ${tip}`)
    throw err // server.js logs it and exits
  }
  console.log(`MongoDB Connected successfully (${conn.connection.host}/${conn.connection.name})`)

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))

  return conn
}
