import { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { asyncHandler } from '../utils/appError'
import { AuthenticatedRequest } from '../types'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    })
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    })
  }),

  getMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getMe(req.user!.id)

    res.json({
      success: true,
      data: user,
    })
  }),
}