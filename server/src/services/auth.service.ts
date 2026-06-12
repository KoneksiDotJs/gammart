import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authRepository } from '../repositories/auth.repository'
import { AppError } from '../utils/appError'
import { env } from '../config/env'

export interface RegisterInput {
  email: string
  username: string
  password: string
  displayName?: string
}

export interface LoginInput {
  email: string
  password: string
}

const generateToken = (payload: {
  id: string
  email: string
  username: string
  role: string
}) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export const authService = {
  /**
   * Register a new user.
   * Hashes password before storing.
   */
  register: async (input: RegisterInput) => {
    const passwordHash = await bcrypt.hash(input.password, 12)

    const user = await authRepository.create({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      passwordHash,
      displayName: input.displayName || input.username,
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    return { user, token }
  },

  /**
   * Authenticate a user with email and password.
   * Returns JWT on success.
   */
  login: async (input: LoginInput) => {
    const user = await authRepository.findByEmail(input.email.toLowerCase())

    if (!user) {
      // Use a generic message to avoid user enumeration
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword, token }
  },

  /**
   * Get current authenticated user's profile.
   */
  getMe: async (userId: string) => {
    const user = await authRepository.findById(userId)
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    return user
  },

  /**
   * Update display name, bio, and avatar URL.
   * Email and username are not changeable for security reasons.
   */
  updateProfile: async (
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string }
  ) => {
    const user = await authRepository.findById(userId)
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    return authRepository.updateProfile(userId, data)
  },

  /**
   * Change password — requires the current password for verification.
   */
  updatePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const user = await authRepository.findByEmail(
      (await authRepository.findById(userId))!.email
    )
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS')
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await authRepository.updatePassword(userId, newHash)

    return { success: true }
  },
}