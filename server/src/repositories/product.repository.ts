import { prisma } from '../config/prisma'
import { Prisma, ProductCategory, ProductStatus } from '@prisma/client'

export interface CreateProductInput {
  sellerId: string
  title: string
  description: string
  category: ProductCategory
  game: string
  price: number
  imageUrls?: string[]
  metadata?: Prisma.InputJsonValue
}

export type SortBy = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

export interface FindProductsQuery {
  category?: ProductCategory
  game?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: SortBy
  page?: number
  limit?: number
}

const SORT_MAP: Record<SortBy, object> = {
  newest:     { createdAt: 'desc' },
  oldest:     { createdAt: 'asc' },
  price_asc:  { price: 'asc' },
  price_desc: { price: 'desc' },
}

export const productRepository = {
  findMany: async ({
    category, game, search,
    minPrice, maxPrice,
    sortBy = 'newest',
    page = 1, limit = 20,
  }: FindProductsQuery) => {
    const skip = (page - 1) * limit

    const where = {
      status: ProductStatus.ACTIVE,
      ...(category && { category }),
      ...(game && { game: { contains: game, mode: 'insensitive' as const } }),
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { game:        { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: SORT_MAP[sortBy],
        include: {
          seller: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  },

  findById: (id: string) => {
    return prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
      },
    })
  },

  create: (data: CreateProductInput) => {
    return prisma.product.create({ data })
  },

  updateStatus: (id: string, status: ProductStatus) => {
    return prisma.product.update({ where: { id }, data: { status } })
  },

  findBySeller: (sellerId: string) => {
    return prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    })
  },
}