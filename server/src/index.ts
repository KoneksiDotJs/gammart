import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { errorHandler } from './middlewares/error.middleware'

// Routes
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import orderRoutes from './routes/order.routes'
import paymentRoutes from './routes/payment.routes'

const app = express()

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Parse JSON — but use raw body for payment webhooks (signature verification needs raw bytes)
app.use((req, res, next) => {
  if (req.path.includes('/webhook')) {
    express.raw({ type: 'application/json' })(req, res, next)
  } else {
    express.json()(req, res, next)
  }
})

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv })
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` })
})

// ─── Error Handler (must be last) ─────────────────────────────────────────────

app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(env.port, () => {
  console.log(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`)
})

export default app