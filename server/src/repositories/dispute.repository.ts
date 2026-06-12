import { prisma } from '../config/prisma'

export interface CreateDisputeInput {
  orderId: string
  raisedById: string
  reason: string
  details?: string
}

export const disputeRepository = {
  create: (data: CreateDisputeInput) => {
    return prisma.dispute.create({ data })
  },

  findByOrderId: (orderId: string) => {
    return prisma.dispute.findUnique({
      where: { orderId },
      include: {
        raisedBy: {
          select: { id: true, username: true, displayName: true },
        },
      },
    })
  },

  findAll: () => {
    return prisma.dispute.findMany({
      where: { resolvedAt: null },
      include: {
        order: {
          include: {
            product: { select: { title: true, game: true } },
            buyer:   { select: { id: true, username: true, displayName: true } },
          },
        },
        raisedBy: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  resolve: (id: string, resolution: string) => {
    return prisma.dispute.update({
      where: { id },
      data: { resolvedAt: new Date(), resolution },
    })
  },
}