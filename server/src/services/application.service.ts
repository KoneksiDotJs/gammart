import { applicationRepository } from '../repositories/application.repository'
import { authRepository } from '../repositories/auth.repository'
import { AppError } from '../utils/appError'
import { ApplicationStatus, Role } from '@prisma/client'
import { prisma } from '../config/prisma'

export const applicationService = {
  /**
   * Submit a seller application.
   * A user can only have one application — if already SELLER, reject.
   * If PENDING or APPROVED, reject with a clear message.
   */
  apply: async (
    userId: string,
    data: { storeName: string; reason: string; experience?: string }
  ) => {
    const user = await authRepository.findById(userId)

    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    if (user.role === Role.SELLER) {
      throw new AppError('You are already a seller', 409, 'ALREADY_SELLER')
    }

    if (user.role === Role.ADMIN) {
      throw new AppError('Admins do not need a seller application', 400, 'INVALID_ROLE')
    }

    const existing = await applicationRepository.findByUserId(userId)

    if (existing) {
      if (existing.status === ApplicationStatus.PENDING) {
        throw new AppError(
          'You already have a pending application',
          409,
          'APPLICATION_PENDING'
        )
      }
      if (existing.status === ApplicationStatus.APPROVED) {
        throw new AppError(
          'Your application was already approved',
          409,
          'ALREADY_APPROVED'
        )
      }
      // REJECTED — allow re-application by deleting old one
      await prisma.sellerApplication.delete({ where: { userId } })
    }

    return applicationRepository.create({ userId, ...data })
  },

  /**
   * Get the current user's application status.
   */
  getMyApplication: async (userId: string) => {
    return applicationRepository.findByUserId(userId)
  },

  /**
   * Admin: list all applications, optionally filtered by status.
   */
  listApplications: async (status?: ApplicationStatus) => {
    return applicationRepository.findAll(status)
  },

  /**
   * Admin: approve an application.
   * Upgrades the user's role to SELLER atomically.
   */
  approve: async (applicationId: string, adminId: string, reviewNote?: string) => {
    const application = await prisma.sellerApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    })

    if (!application) throw new AppError('Application not found', 404, 'NOT_FOUND')

    if (application.status !== ApplicationStatus.PENDING) {
      throw new AppError('Application has already been reviewed', 409, 'ALREADY_REVIEWED')
    }

    // Upgrade role and mark application approved in a transaction
    const [updated] = await prisma.$transaction([
      prisma.sellerApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedBy: adminId,
          reviewNote,
          reviewedAt: new Date(),
        },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      prisma.user.update({
        where: { id: application.userId },
        data: { role: Role.SELLER },
      }),
    ])

    return updated
  },

  /**
   * Admin: reject an application.
   */
  reject: async (applicationId: string, adminId: string, reviewNote?: string) => {
    const application = await prisma.sellerApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) throw new AppError('Application not found', 404, 'NOT_FOUND')

    if (application.status !== ApplicationStatus.PENDING) {
      throw new AppError('Application has already been reviewed', 409, 'ALREADY_REVIEWED')
    }

    return applicationRepository.review(
      applicationId,
      ApplicationStatus.REJECTED,
      adminId,
      reviewNote
    )
  },
}
