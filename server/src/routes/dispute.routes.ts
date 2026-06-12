import { Router, Response } from 'express'
import { z } from 'zod'
import { disputeService, DISPUTE_REASONS } from '../services/dispute.service'
import { asyncHandler } from '../utils/appError'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { AuthenticatedRequest } from '../types'

const router = Router()

const openDisputeSchema = z.object({
  reason:  z.enum(DISPUTE_REASONS),
  details: z.string().min(20, 'Please provide at least 20 characters of detail').max(1000).optional(),
})

/**
 * POST /api/orders/:id/dispute
 * Buyer opens a dispute on a PAID order.
 */
router.post(
  '/:id/dispute',
  authenticate,
  validate(openDisputeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await disputeService.openDispute(
      req.params.id,
      req.user!.id,
      req.body.reason,
      req.body.details
    )
    res.status(201).json({ success: true, data: dispute })
  })
)

/**
 * GET /api/orders/:id/dispute
 * Get the dispute record for an order (buyer or seller).
 */
router.get(
  '/:id/dispute',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await disputeService.getDisputeByOrder(req.params.id, req.user!.id)
    res.json({ success: true, data: dispute })
  })
)

/**
 * GET /api/disputes
 * Admin only — list all open disputes.
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const disputes = await disputeService.getAllOpenDisputes()
    res.json({ success: true, data: disputes })
  })
)

export default router