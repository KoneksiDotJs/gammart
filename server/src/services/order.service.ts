import { orderRepository } from '../repositories/order.repository'
import { productRepository } from '../repositories/product.repository'
import { authRepository } from '../repositories/auth.repository'
import { midtransService } from './midtrans.service'
import { emailService } from './email.service'
import { AppError } from '../utils/appError'
import { env } from '../config/env'
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

    // Notify seller — fire-and-forget, never blocks the response
    const seller = await authRepository.findById(product.sellerId)
    const buyer  = await authRepository.findById(input.buyerId)
    if (seller?.email) {
      emailService.notifySellerNewOrder(seller.email, {
        sellerName:    seller.displayName || seller.username || 'Seller',
        buyerName:     buyer?.displayName  || buyer?.username  || 'A buyer',
        productTitle:  product.title,
        productGame:   product.game,
        orderId:       order.id,
        amount:        amount,
        paymentMethod: input.paymentMethod,
        notes:         input.notes,
        orderUrl:      `${env.appUrl}/orders/${order.id}`,
      })
    }

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
   *
   * Security flow:
   * 1. Verify SHA512 signature to confirm the request is genuinely from Midtrans
   * 2. Re-fetch transaction status server-side (never trust the body alone)
   * 3. Update order + payment records based on confirmed status
   */
  handleMidtransWebhook: async (notification: Record<string, string>) => {
    // Step 1 — verify signature
    const isValid = midtransService.verifySignature(notification as any)
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE')
    }

    const orderId: string = notification.order_id

    // Step 2 — re-fetch authoritative status from Midtrans
    const statusResponse = await midtransService.getTransactionStatus(orderId)

    const transactionStatus: string = statusResponse.transaction_status
    const fraudStatus: string       = statusResponse.fraud_status ?? ''
    const transactionId: string     = statusResponse.transaction_id

    const isSuccess =
      transactionStatus === 'capture'
        ? fraudStatus === 'accept'
        : transactionStatus === 'settlement'

    const isFailed =
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny'   ||
      transactionStatus === 'expire'

    if (isSuccess) {
      await orderRepository.updatePaymentByOrderId(orderId, {
        status: PaymentStatus.SUCCESS,
        gatewayTxId: transactionId,
        paidAt: new Date(),
      })
      await orderRepository.updateStatus(orderId, OrderStatus.PAID)

      // Notify seller to deliver — fetch full order for context
      const paidOrder = await orderRepository.findById(orderId)
      if (paidOrder) {
        const seller = await authRepository.findById(paidOrder.product.sellerId)
        if (seller?.email) {
          emailService.notifySellerPaymentConfirmed(seller.email, {
            sellerName:   seller.displayName  || seller.username  || 'Seller',
            buyerName:    paidOrder.buyer.displayName || paidOrder.buyer.username || 'Buyer',
            productTitle: paidOrder.product.title,
            orderId:      paidOrder.id,
            amount:       Number(paidOrder.amount),
            notes:        paidOrder.notes ?? undefined,
            orderUrl:     `${env.appUrl}/orders/${paidOrder.id}`,
          })
        }
      }

    } else if (isFailed) {
      await orderRepository.updatePaymentByOrderId(orderId, {
        status: PaymentStatus.FAILED,
      })
      await orderRepository.updateStatus(orderId, OrderStatus.CANCELLED)

      // Release the product back to active so others can buy it
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
    const completed = await orderRepository.updateStatus(orderId, OrderStatus.COMPLETED)

    // Notify buyer their product has been delivered
    const buyer  = await authRepository.findById(order.buyerId)
    const seller = await authRepository.findById(order.product.sellerId)
    if (buyer?.email) {
      emailService.notifyBuyerOrderDelivered(buyer.email, {
        buyerName:    buyer.displayName  || buyer.username  || 'Buyer',
        sellerName:   seller?.displayName || seller?.username || 'Seller',
        productTitle: order.product.title,
        productGame:  order.product.game,
        orderId:      order.id,
        amount:       Number(order.amount),
        orderUrl:     `${env.appUrl}/orders/${order.id}`,
      })
    }

    return completed
  },
}