import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { errorHandler } from './middlewares/error.middleware'

// Routes
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import orderRoutes from './routes/order.routes'
import paymentRoutes from './routes/payment.routes'
import reviewRoutes from './routes/review.routes'
import sellerRoutes from './routes/seller.routes'
import disputeRoutes from './routes/dispute.routes'
import applicationRoutes from './routes/application.routes'

const app = express()

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Parse JSON for all routes.
// Midtrans webhook verification works with parsed JSON — it re-fetches
// the transaction status server-side using the order_id from the body,
// so raw bytes are not needed.
app.use(express.json())

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv })
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/orders/:orderId/review', reviewRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/sellers', sellerRoutes)
app.use('/api/orders', disputeRoutes)
app.use('/api/disputes', disputeRoutes)
app.use('/api/applications', applicationRoutes)

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