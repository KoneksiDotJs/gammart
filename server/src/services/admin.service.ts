import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { Role, OrderStatus } from '@prisma/client'

export const adminService = {
  /**
   * Platform-wide stats for the dashboard overview.
   * All queries run in parallel for speed.
   */
  getStats: async () => {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      completedOrders,
      pendingApplications,
      openDisputes,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.SELLER } }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.sellerApplication.count({ where: { status: 'PENDING' } }),
      prisma.dispute.count({ where: { resolvedAt: null } }),
      prisma.order.aggregate({
        _sum: { amount: true },
        where: { status: OrderStatus.COMPLETED },
      }),
    ])

    return {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      completedOrders,
      pendingApplications,
      openDisputes,
      totalRevenue: Number(revenueResult._sum.amount ?? 0),
    }
  },

  /**
   * Recent orders across the whole platform.
   */
  getRecentOrders: async (limit = 20) => {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer:   { select: { id: true, username: true, displayName: true } },
        product: {
          select: {
            title: true, game: true, category: true,
            seller: { select: { id: true, username: true } },
          },
        },
        payment: { select: { status: true, method: true } },
      },
    })
  },

  /**
   * All users with optional role filter and search.
   */
  getUsers: async (params: {
    role?: Role
    search?: string
    page?: number
    limit?: number
  }) => {
    const page  = Math.max(params.page  ?? 1,  1)
    const limit = Math.min(params.limit ?? 20, 100)
    const skip  = (page - 1) * limit

    const where = {
      ...(params.role && { role: params.role }),
      ...(params.search && {
        OR: [
          { username:    { contains: params.search, mode: 'insensitive' as const } },
          { email:       { contains: params.search, mode: 'insensitive' as const } },
          { displayName: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, username: true,
          displayName: true, role: true,
          isVerified: true, createdAt: true,
          _count: { select: { buyerOrders: true, products: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  /**
   * Toggle a user's verified status.
   */
  setUserVerified: async (userId: string, isVerified: boolean) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    return prisma.user.update({
      where: { id: userId },
      data: { isVerified },
      select: { id: true, username: true, isVerified: true },
    })
  },

  /**
   * Resolve a dispute with an admin resolution note.
   */
  resolveDispute: async (disputeId: string, resolution: string) => {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } })
    if (!dispute) throw new AppError('Dispute not found', 404, 'NOT_FOUND')
    if (dispute.resolvedAt) throw new AppError('Dispute already resolved', 409, 'ALREADY_RESOLVED')

    return prisma.dispute.update({
      where: { id: disputeId },
      data: { resolvedAt: new Date(), resolution },
    })
  },
}