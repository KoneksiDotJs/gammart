import { Router, Response } from 'express'
import { z } from 'zod'
import { adminService } from '../services/admin.service'
import { asyncHandler } from '../utils/appError'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { AuthenticatedRequest } from '../types'
import { Role } from '@prisma/client'

const router = Router()

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'))

/** GET /api/admin/stats */
router.get('/stats', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await adminService.getStats()
  res.json({ success: true, data: stats })
}))

/** GET /api/admin/orders */
router.get('/orders', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
  const orders = await adminService.getRecentOrders(limit)
  res.json({ success: true, data: orders })
}))

/** GET /api/admin/users */
router.get('/users', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await adminService.getUsers({
    role:   req.query.role   as Role   | undefined,
    search: req.query.search as string | undefined,
    page:   req.query.page   ? parseInt(req.query.page   as string) : undefined,
    limit:  req.query.limit  ? parseInt(req.query.limit  as string) : undefined,
  })
  res.json({ success: true, ...result })
}))

/** PATCH /api/admin/users/:id/verify */
router.patch(
  '/users/:id/verify',
  validate(z.object({ isVerified: z.boolean() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminService.setUserVerified(req.params.id, req.body.isVerified)
    res.json({ success: true, data: user })
  })
)

/** POST /api/admin/disputes/:id/resolve */
router.post(
  '/disputes/:id/resolve',
  validate(z.object({ resolution: z.string().min(10, 'Resolution must be at least 10 characters') })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await adminService.resolveDispute(req.params.id, req.body.resolution)
    res.json({ success: true, data: dispute })
  })
)

export default router