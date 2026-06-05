import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from '../utils/appError'
import { AuthenticatedRequest } from '../types'
import { Role } from '@prisma/client'

interface JwtPayload {
  id: string
  email: string
  username: string
  role: Role
}

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user to req.user on success.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.user = decoded
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'))
  }
}

/**
 * Role-based access control middleware.
 * Usage: authorize('ADMIN') or authorize('SELLER', 'ADMIN')
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
    }

    next()
  }
}