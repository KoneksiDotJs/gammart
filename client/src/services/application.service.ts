import { apiClient } from './api.client'
import { ApiResponse } from '../types'

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SellerApplication {
  id: string
  userId: string
  storeName: string
  reason: string
  experience?: string
  status: ApplicationStatus
  reviewNote?: string
  reviewedAt?: string
  createdAt: string
}

export const applicationApi = {
  apply: async (data: {
    storeName: string
    reason: string
    experience?: string
  }): Promise<SellerApplication> => {
    const res = await apiClient.post<ApiResponse<SellerApplication>>('/applications', data)
    return res.data.data!
  },

  getMyApplication: async (): Promise<SellerApplication | null> => {
    const res = await apiClient.get<ApiResponse<SellerApplication | null>>('/applications/me')
    return res.data.data ?? null
  },
}