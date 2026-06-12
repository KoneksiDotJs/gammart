import { disputeRepository } from '../repositories/dispute.repository'
import { orderRepository } from '../repositories/order.repository'
import { AppError } from '../utils/appError'
import { OrderStatus } from '@prisma/client'

export const DISPUTE_REASONS = [
  'Seller not responding',
  'Item not as described',
  'Account credentials invalid',
  'Top-up not received',
  'Boosting not completed',
  'Other',
] as const

export type DisputeReason = typeof DISPUTE_REASONS[number]

export const disputeService = {
  /**
   * Open a dispute on a PAID order.
   * Only the buyer can raise a dispute, and only when status is PAID.
   * Transitions the order to DISPUTED immediately.
   */
  openDispute: async (
    orderId: string,
    buyerId: string,
    reason: string,
    details?: string
  ) => {
    const order = await orderRepository.findById(orderId)

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== buyerId) {
      throw new AppError('Only the buyer can raise a dispute', 403, 'FORBIDDEN')
    }

    if (order.status !== OrderStatus.PAID) {
      throw new AppError(
        'Disputes can only be opened on paid orders awaiting delivery',
        400,
        'INVALID_STATUS'
      )
    }

    // Check not already disputed
    const existing = await disputeRepository.findByOrderId(orderId)
    if (existing) {
      throw new AppError('A dispute already exists for this order', 409, 'CONFLICT')
    }

    if (!DISPUTE_REASONS.includes(reason as DisputeReason)) {
      throw new AppError('Invalid dispute reason', 422, 'VALIDATION_ERROR')
    }

    // Create dispute record and update order status atomically
    const [dispute] = await Promise.all([
      disputeRepository.create({ orderId, raisedById: buyerId, reason, details }),
      orderRepository.updateStatus(orderId, OrderStatus.DISPUTED),
    ])

    return dispute
  },

  /**
   * Get the dispute for a specific order.
   * Used on the order detail page to show dispute info.
   */
  getDisputeByOrder: async (orderId: string, requesterId: string) => {
    const order = await orderRepository.findById(orderId)

    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')

    const isBuyer  = order.buyerId === requesterId
    const isSeller = order.product.sellerId === requesterId

    if (!isBuyer && !isSeller) {
      throw new AppError('Access denied', 403, 'FORBIDDEN')
    }

    return disputeRepository.findByOrderId(orderId)
  },

  /**
   * Get all open disputes — admin only.
   */
  getAllOpenDisputes: () => {
    return disputeRepository.findAll()
  },
}