import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { orderService } from '../services/order.service'
import { asyncHandler } from '../utils/appError'
import { AuthenticatedRequest } from '../types'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { PaymentMethod } from '@prisma/client'

// ─── Controller ──────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  productId: z.string().min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().max(500).optional(),
})

export const orderController = {
  createOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.createOrder({
      ...req.body,
      buyerId: req.user!.id,
    })
    res.status(201).json({ success: true, data: result })
  }),

  getOrderById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.getOrderById(req.params.id, req.user!.id)
    res.json({ success: true, data: order })
  }),

  getMyOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const orders = await orderService.getBuyerOrders(req.user!.id)
    res.json({ success: true, data: orders })
  }),

  getSellerOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const orders = await orderService.getSellerOrders(req.user!.id)
    res.json({ success: true, data: orders })
  }),

  completeOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.completeOrder(req.params.id, req.user!.id)
    res.json({ success: true, data: order })
  }),

  // Midtrans webhook — no auth, Midtrans calls this
  midtransWebhook: asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.handleMidtransWebhook(req.body)
    res.json({ success: true, data: result })
  }),
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const router = Router()

router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder)
router.get('/my', authenticate, orderController.getMyOrders)
router.get('/selling', authenticate, authorize('SELLER', 'ADMIN'), orderController.getSellerOrders)
router.get('/:id', authenticate, orderController.getOrderById)
router.patch('/:id/complete', authenticate, authorize('SELLER', 'ADMIN'), orderController.completeOrder)

export default router