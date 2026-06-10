import { reviewRepository } from '../repositories/review.repository'
import { orderRepository } from '../repositories/order.repository'
import { AppError } from '../utils/appError'

export interface CreateReviewInput {
  orderId: string
  buyerId: string
  rating: number
  comment?: string
}

export const reviewService = {
  /**
   * Submit a review for a completed order.
   *
   * Rules:
   * - Only the buyer of the order can review
   * - Order must be COMPLETED
   * - One review per order (DB constraint also enforces this)
   */
  createReview: async (input: CreateReviewInput) => {
    const order = await orderRepository.findById(input.orderId)

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== input.buyerId) {
      throw new AppError('Only the buyer can review this order', 403, 'FORBIDDEN')
    }

    if (order.status !== 'COMPLETED') {
      throw new AppError('You can only review a completed order', 400, 'ORDER_NOT_COMPLETED')
    }

    const existing = await reviewRepository.findByOrderId(input.orderId)
    if (existing) {
      throw new AppError('You have already reviewed this order', 409, 'ALREADY_REVIEWED')
    }

    return reviewRepository.create({
      orderId: input.orderId,
      buyerId: input.buyerId,
      sellerId: order.product.sellerId,
      rating: input.rating,
      comment: input.comment,
    })
  },

  /**
   * Get the review for a specific order (null if not yet reviewed).
   */
  getReviewByOrderId: (orderId: string) => {
    return reviewRepository.findByOrderId(orderId)
  },

  /**
   * Get all reviews for a seller along with their aggregate stats.
   */
  getSellerReviews: async (sellerId: string) => {
    const [reviews, stats] = await Promise.all([
      reviewRepository.findBySeller(sellerId),
      reviewRepository.getSellerStats(sellerId),
    ])
    return { reviews, stats }
  },
}