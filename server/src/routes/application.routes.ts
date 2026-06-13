import { Router, Response } from 'express'
import { z } from 'zod'
import { applicationService } from '../services/application.service'
import { asyncHandler } from '../utils/appError'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { AuthenticatedRequest } from '../types'
import { ApplicationStatus } from '@prisma/client'

const router = Router()

const applySchema = z.object({
  storeName:  z.string().min(3, 'Store name must be at least 3 characters').max(60),
  reason:     z.string().min(30, 'Please provide at least 30 characters').max(1000),
  experience: z.string().max(500).optional(),
})

const reviewSchema = z.object({
  reviewNote: z.string().max(500).optional(),
})

/**
 * POST /api/applications
 * Buyer submits a seller application.
 */
router.post(
  '/',
  authenticate,
  validate(applySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await applicationService.apply(req.user!.id, req.body)
    res.status(201).json({ success: true, data: application })
  })
)

/**
 * GET /api/applications/me
 * Get the current user's application status.
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await applicationService.getMyApplication(req.user!.id)
    res.json({ success: true, data: application })
  })
)

/**
 * GET /api/applications
 * Admin: list all applications with optional ?status= filter.
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = req.query.status as ApplicationStatus | undefined
    const applications = await applicationService.listApplications(status)
    res.json({ success: true, data: applications })
  })
)

/**
 * POST /api/applications/:id/approve
 * Admin: approve an application and upgrade the user to SELLER.
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize('ADMIN'),
  validate(reviewSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await applicationService.approve(
      req.params.id,
      req.user!.id,
      req.body.reviewNote
    )
    res.json({ success: true, data: result })
  })
)

/**
 * POST /api/applications/:id/reject
 * Admin: reject an application.
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  validate(reviewSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await applicationService.reject(
      req.params.id,
      req.user!.id,
      req.body.reviewNote
    )
    res.json({ success: true, data: result })
  })
)

export default router
