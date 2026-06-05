import { productRepository, FindProductsQuery, CreateProductInput } from '../repositories/product.repository'
import { AppError } from '../utils/appError'
import { ProductStatus } from '@prisma/client'

export const productService = {
  /**
   * Get paginated list of active products with optional filters.
   */
  getProducts: async (query: FindProductsQuery) => {
    const limit = Math.min(query.limit || 20, 100) // cap at 100
    const page = Math.max(query.page || 1, 1)

    const { products, total } = await productRepository.findMany({ ...query, page, limit })

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Get a single product by ID. Throws 404 if not found.
   */
  getProductById: async (id: string) => {
    const product = await productRepository.findById(id)

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND')
    }

    return product
  },

  /**
   * Create a new product listing. Only sellers can do this.
   */
  createProduct: async (sellerId: string, data: Omit<CreateProductInput, 'sellerId'>) => {
    return productRepository.create({ ...data, sellerId })
  },

  /**
   * Get all products listed by a specific seller.
   */
  getSellerProducts: async (sellerId: string) => {
    return productRepository.findBySeller(sellerId)
  },

  /**
   * Soft-delete or deactivate a product listing.
   */
  deactivateProduct: async (productId: string, requesterId: string) => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND')
    }

    if (product.sellerId !== requesterId) {
      throw new AppError('You do not own this product', 403, 'FORBIDDEN')
    }

    return productRepository.updateStatus(productId, ProductStatus.INACTIVE)
  },
}