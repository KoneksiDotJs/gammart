import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/appError'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * Central error handling middleware.
 * All errors thrown in the app flow through here.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    })
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field'
      return res.status(409).json({
        success: false,
        code: 'CONFLICT',
        message: `A record with this ${field} already exists`,
      })
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Record not found',
      })
    }
  }

  // Unknown errors — don't leak details in production
  console.error('[Unhandled Error]', err)

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  })
}