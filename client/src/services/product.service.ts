import { apiClient } from './api.client'
import { ApiResponse, PaginatedResponse, Product, ProductCategory } from '../types'

export interface ProductFilters {
  category?: ProductCategory
  game?: string
  search?: string
  page?: number
  limit?: number
}

export const productApi = {
  getProducts: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const res = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    })
    return res.data
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`)
    return res.data.data!
  },

  createProduct: async (data: {
    title: string
    description: string
    category: ProductCategory
    game: string
    price: number
    imageUrls?: string[]
    metadata?: Record<string, unknown>
  }): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', data)
    return res.data.data!
  },

  getMyListings: async (): Promise<Product[]> => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products/my/listings')
    return res.data.data!
  },

  deactivateProduct: async (id: string): Promise<void> => {
    await apiClient.patch(`/products/${id}/deactivate`)
  },
}