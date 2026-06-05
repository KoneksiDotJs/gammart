import { prisma } from '../config/prisma'
import { OrderStatus, PaymentMethod } from '@prisma/client'

export interface CreateOrderInput {
  buyerId: string
  productId: string
  amount: number
  paymentMethod: PaymentMethod
  notes?: string
}

export const orderRepository = {
  create: (data: CreateOrderInput) => {
    return prisma.order.create({
      data,
      include: { product: true, payment: true },
    })
  },

  findById: (id: string) => {
    return prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            seller: { select: { id: true, username: true, displayName: true } },
          },
        },
        payment: true,
        buyer: { select: { id: true, username: true, displayName: true } },
      },
    })
  },

  findByBuyer: (buyerId: string) => {
    return prisma.order.findMany({
      where: { buyerId },
      include: { product: true, payment: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findBySeller: (sellerId: string) => {
    return prisma.order.findMany({
      where: { product: { sellerId } },
      include: {
        product: true,
        payment: true,
        buyer: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  updateStatus: (id: string, status: OrderStatus) => {
    return prisma.order.update({ where: { id }, data: { status } })
  },

  createPayment: (data: {
    orderId: string
    method: PaymentMethod
    gatewayTxId?: string
    snapToken?: string
    paymentUrl?: string
    expiredAt?: Date
  }) => {
    return prisma.payment.create({ data })
  },

  updatePaymentByOrderId: (
    orderId: string,
    data: { status?: any; gatewayTxId?: string; paidAt?: Date }
  ) => {
    return prisma.payment.update({ where: { orderId }, data })
  },

  findPaymentByOrderId: (orderId: string) => {
    return prisma.payment.findUnique({ where: { orderId } })
  },
}