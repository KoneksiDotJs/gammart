import { prisma } from '../config/prisma'
import { ApplicationStatus } from '@prisma/client'

export interface CreateApplicationInput {
  userId: string
  storeName: string
  reason: string
  experience?: string
}

export const applicationRepository = {
  create: (data: CreateApplicationInput) => {
    return prisma.sellerApplication.create({
      data,
      include: { user: { select: { id: true, username: true, email: true, displayName: true } } },
    })
  },

  findByUserId: (userId: string) => {
    return prisma.sellerApplication.findUnique({
      where: { userId },
    })
  },

  findAll: (status?: ApplicationStatus) => {
    return prisma.sellerApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { id: true, username: true, email: true, displayName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  review: (
    id: string,
    status: ApplicationStatus,
    reviewedBy: string,
    reviewNote?: string
  ) => {
    return prisma.sellerApplication.update({
      where: { id },
      data: { status, reviewedBy, reviewNote, reviewedAt: new Date() },
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    })
  },
}
