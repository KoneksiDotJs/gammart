import { Request } from 'express'
import { Role } from '@prisma/client'

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
    role: Role
  }
}

// Generic paginated response shape
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Standard API response shape
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}