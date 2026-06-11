import { Router, Response, Request } from 'express'
import { reviewService } from '../services/review.service'
import { productRepository } from '../repositories/product.repository'
import { authRepository } from '../repositories/auth.repository'
import { asyncHandler } from '../utils/appError'
import { AppError } from '../utils/appError'
import { AuthenticatedRequest } from '../types'

const router = Router()

/**
 * GET /api/sellers/:username/profile
 * Public — returns seller info, stats, and active listings.
 */
router.get(
  '/:username/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const seller = await authRepository.findByUsername(req.params.username.toLowerCase())

    if (!seller) {
      throw new AppError('Seller not found', 404, 'NOT_FOUND')
    }

    const [reviewData, listings] = await Promise.all([
      reviewService.getSellerReviews(seller.id),
      productRepository.findBySeller(seller.id),
    ])

    const activeListings = listings.filter((p) => p.status === 'ACTIVE')

    res.json({
      success: true,
      data: {
        seller,
        stats: {
          totalListings: activeListings.length,
          completedOrders: reviewData.stats.total,
          rating: reviewData.stats,
        },
        listings: activeListings,
      },
    })
  })
)

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