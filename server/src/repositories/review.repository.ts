import { prisma } from '../config/prisma'

export interface CreateReviewInput {
  orderId: string
  buyerId: string
  sellerId: string
  rating: number
  comment?: string
}

export const reviewRepository = {
  /**
   * Create a new review. One review per order (enforced by DB unique constraint).
   */
  create: (data: CreateReviewInput) => {
    return prisma.review.create({
      data,
      include: {
        buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })
  },

  /**
   * Find the review for a specific order (if it exists).
   * Used to check if the buyer already left a review.
   */
  findByOrderId: (orderId: string) => {
    return prisma.review.findUnique({
      where: { orderId },
      include: {
        buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })
  },

  /**
   * Get all reviews for a seller, newest first.
   * Used on the seller profile page.
   */
  findBySeller: (sellerId: string) => {
    return prisma.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        order: { select: { product: { select: { title: true, game: true } } } },
      },
    })
  },

  /**
   * Compute average rating and total count for a seller.
   */
  getSellerStats: async (sellerId: string) => {
    const result = await prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: { id: true },
    })
    return {
      average: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
      total: result._count.id,
    }
  },
}