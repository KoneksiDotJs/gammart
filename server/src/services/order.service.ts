import { orderRepository } from '../repositories/order.repository'
import { productRepository } from '../repositories/product.repository'
import { authRepository } from '../repositories/auth.repository'
import { midtransService } from './midtrans.service'
import { AppError } from '../utils/appError'
import { OrderStatus, PaymentMethod, ProductStatus, PaymentStatus } from '@prisma/client'

export interface CreateOrderInput {
  buyerId: string
  productId: string
  paymentMethod: PaymentMethod
  notes?: string
}

export const orderService = {
  /**
   * Create an order and initialize a payment session.
   *
   * Flow:
   * 1. Validate product is available
   * 2. Create the order record
   * 3. Reserve the product (so no one else can buy it)
   * 4. Initialize payment with the chosen gateway
   * 5. Return order + payment token/URL to frontend
   */
  createOrder: async (input: CreateOrderInput) => {
    const product = await productRepository.findById(input.productId)

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND')
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new AppError('This product is no longer available', 409, 'PRODUCT_UNAVAILABLE')
    }

    if (product.sellerId === input.buyerId) {
      throw new AppError('You cannot purchase your own product', 400, 'SELF_PURCHASE')
    }

    const amount = Number(product.price)

    // Create order
    const order = await orderRepository.create({
      buyerId: input.buyerId,
      productId: input.productId,
      amount,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    })

    // Reserve the product so it's not sold twice
    await productRepository.updateStatus(input.productId, ProductStatus.RESERVED)

    // Initialize payment based on method
    if (input.paymentMethod === PaymentMethod.MIDTRANS) {
      const buyer = await authRepository.findById(input.buyerId)

      const snapResult = await midtransService.createSnapTransaction({
        orderId: order.id,
        amount,
        customerName: buyer?.displayName || buyer?.username || 'Customer',
        customerEmail: buyer?.email || '',
        itemName: product.title,
      })

      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

      await orderRepository.createPayment({
        orderId: order.id,
        method: PaymentMethod.MIDTRANS,
        snapToken: snapResult.token,
        paymentUrl: snapResult.redirectUrl,
        expiredAt,
      })

      return {
        order,
        payment: {
          snapToken: snapResult.token,
          redirectUrl: snapResult.redirectUrl,
        },
      }
    }

    // USDT — just create a pending payment record for now
    // Full USDT integration (NOWPayments) is a post-MVP task
    await orderRepository.createPayment({
      orderId: order.id,
      method: PaymentMethod.USDT,
    })

    return { order, payment: null }
  },

  /**
   * Handle Midtrans payment webhook.
   * Called when Midtrans POSTs a notification to our /payments/webhook endpoint.
   */
  handleMidtransWebhook: async (notification: Record<string, string>) => {
    const statusResponse = await midtransService.verifyNotification(notification)

    const orderId: string = statusResponse.order_id
    const transactionStatus: string = statusResponse.transaction_status
    const fraudStatus: string = statusResponse.fraud_status

    const isSuccess =
      transactionStatus === 'capture'
        ? fraudStatus === 'accept'
        : transactionStatus === 'settlement'

    const isFailed =
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'

    if (isSuccess) {
      await orderRepository.updatePaymentByOrderId(orderId, {
        status: PaymentStatus.SUCCESS,
        gatewayTxId: statusResponse.transaction_id,
        paidAt: new Date(),
      })

      await orderRepository.updateStatus(orderId, OrderStatus.PAID)
    } else if (isFailed) {
      await orderRepository.updatePaymentByOrderId(orderId, {
        status: PaymentStatus.FAILED,
      })

      await orderRepository.updateStatus(orderId, OrderStatus.CANCELLED)

      // Release the product back to active
      const order = await orderRepository.findById(orderId)
      if (order) {
        await productRepository.updateStatus(order.productId, ProductStatus.ACTIVE)
      }
    }

    return { orderId, status: transactionStatus }
  },

  getOrderById: async (orderId: string, requesterId: string) => {
    const order = await orderRepository.findById(orderId)

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND')
    }

    // Only buyer, seller, or admin can view the order
    const isBuyer = order.buyerId === requesterId
    const isSeller = order.product.sellerId === requesterId

    if (!isBuyer && !isSeller) {
      throw new AppError('Access denied', 403, 'FORBIDDEN')
    }

    return order
  },

  getBuyerOrders: (buyerId: string) => {
    return orderRepository.findByBuyer(buyerId)
  },

  getSellerOrders: (sellerId: string) => {
    return orderRepository.findBySeller(sellerId)
  },

  /**
   * Seller marks the order as completed after delivering the product.
   */
  completeOrder: async (orderId: string, sellerId: string) => {
    const order = await orderRepository.findById(orderId)

    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')
    if (order.product.sellerId !== sellerId) throw new AppError('Access denied', 403, 'FORBIDDEN')
    if (order.status !== OrderStatus.PAID) {
      throw new AppError('Order must be paid before completing', 400, 'INVALID_STATUS')
    }

    await productRepository.updateStatus(order.productId, ProductStatus.SOLD)
    return orderRepository.updateStatus(orderId, OrderStatus.COMPLETED)
  },
}