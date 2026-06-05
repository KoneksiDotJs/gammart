import { Router, Request, Response } from 'express'
import { orderController } from './order.routes'

const router = Router()

/**
 * POST /api/payments/webhook/midtrans
 *
 * Midtrans will POST to this URL when payment status changes.
 * Register this URL in your Midtrans dashboard under Settings > Configuration.
 * Must be a publicly accessible URL (use ngrok locally for testing).
 *
 * No authentication — Midtrans signs the notification with a hash you can verify.
 */
router.post('/webhook/midtrans', orderController.midtransWebhook)

export default router