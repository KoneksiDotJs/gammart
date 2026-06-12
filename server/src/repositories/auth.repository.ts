import { prisma } from '../config/prisma'
import { Role } from '@prisma/client'

export interface CreateUserInput {
  email: string
  username: string
  passwordHash: string
  displayName?: string
  role?: Role
}

export const authRepository = {
  /**
   * Find a user by email. Used during login.
   */
  findByEmail: (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        displayName: true,
        isVerified: true,
      },
    })
  },

  /**
   * Find a user by username for public seller profile.
   */
  findByUsername: (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })
  },

  findById: (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        createdAt: true,
      },
    })
  },

  updateProfile: (
    id: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string }
  ) => {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        createdAt: true,
      },
    })
  },

  updatePassword: (id: string, passwordHash: string) => {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    })
  },

  /**
   * Create a new user record.
   */
  create: (data: CreateUserInput) => {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        displayName: true,
        createdAt: true,
      },
    })
  },
}