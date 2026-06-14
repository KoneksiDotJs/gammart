import dotenv from 'dotenv'
dotenv.config()

// ─── Validate required env vars on startup ────────────────────────────────────
// Fail fast with a clear message rather than a cryptic runtime error.

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const

const missing = REQUIRED.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`\n❌  Missing required environment variables:\n  ${missing.join('\n  ')}\n`)
  process.exit(1)
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_SECRET === 'fallback_secret_change_in_prod'
) {
  console.error('\n❌  JWT_SECRET must be changed from the default in production\n')
  process.exit(1)
}

export const env = {
  port:         parseInt(process.env.PORT || '5000', 10),
  nodeEnv:      process.env.NODE_ENV    || 'development',
  jwtSecret:    process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl:  process.env.FRONTEND_URL   || 'http://localhost:5173',
  midtrans: {
    serverKey:    process.env.MIDTRANS_SERVER_KEY  || '',
    clientKey:    process.env.MIDTRANS_CLIENT_KEY  || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from:         process.env.EMAIL_FROM     || 'Gammart <noreply@gammart.id>',
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
} as const