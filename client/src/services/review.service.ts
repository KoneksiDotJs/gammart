import { apiClient } from './api.client'
import { ApiResponse, Review, SellerReviewsResponse } from '../types'

export const reviewApi = {
  submitReview: async (
    orderId: string,
    data: { rating: number; comment?: string }
  ): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>(
      `/orders/${orderId}/review`,
      data
    )
    return res.data.data!
  },

  getReviewByOrder: async (orderId: string): Promise<Review | null> => {
    const res = await apiClient.get<ApiResponse<Review | null>>(
      `/orders/${orderId}/review`
    )
    return res.data.data ?? null
  },

  getSellerReviews: async (sellerId: string): Promise<SellerReviewsResponse> => {
    const res = await apiClient.get<ApiResponse<SellerReviewsResponse>>(
      `/sellers/${sellerId}/reviews`
    )
    return res.data.data!
  },
}