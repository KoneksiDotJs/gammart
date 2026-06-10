import { reviewService } from '../services/review.service'
import { asyncHandler } from '../utils/appError'
import { AuthenticatedRequest } from '../types'
import { Router, Response } from 'express'

const router = Router()

/**
 * GET /api/sellers/:sellerId/reviews
 * Public — anyone can read a seller's reviews.
 */
router.get(
  '/:sellerId/reviews',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await reviewService.getSellerReviews(req.params.sellerId)
    res.json({ success: true, data: result })
  })
)

export default router