import { Router, Response } from 'express'
import { z } from 'zod'
import { reviewService } from '../services/review.service'
import { asyncHandler } from '../utils/appError'
import { AuthenticatedRequest } from '../types'
import { authenticate } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string().min(1).max(500).optional(),
})

// ─── Controller ───────────────────────────────────────────────────────────────

const reviewController = {
  /**
   * POST /api/orders/:orderId/review
   * Submit a review for a completed order.
   */
  createReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const review = await reviewService.createReview({
      orderId: req.params.orderId,
      buyerId: req.user!.id,
      rating: req.body.rating,
      comment: req.body.comment,
    })

    res.status(201).json({ success: true, data: review })
  }),

  /**
   * GET /api/orders/:orderId/review
   * Get the review for a specific order (if it exists).
   */
  getReviewByOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const review = await reviewService.getReviewByOrderId(req.params.orderId)
    res.json({ success: true, data: review })
  }),

  /**
   * GET /api/sellers/:sellerId/reviews
   * Get all reviews for a seller with aggregate stats.
   */
  getSellerReviews: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await reviewService.getSellerReviews(req.params.sellerId)
    res.json({ success: true, data: result })
  }),
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = Router({ mergeParams: true })

// Mounted at /api/orders/:orderId/review
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview)
router.get('/', authenticate, reviewController.getReviewByOrder)

export { reviewController }
export default router