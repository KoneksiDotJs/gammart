import { apiClient } from './api.client'
import { ApiResponse } from '../types'
import { SellerApplication } from './application.service'

export interface AdminStats {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  totalOrders: number
  completedOrders: number
  pendingApplications: number
  openDisputes: number
  totalRevenue: number
}

export interface AdminUser {
  id: string
  email: string
  username: string
  displayName?: string
  role: string
  isVerified: boolean
  createdAt: string
  _count: { buyerOrders: number; products: number }
}

export interface AdminOrder {
  id: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  buyer: { id: string; username: string; displayName?: string }
  product: {
    title: string; game: string; category: string
    seller: { id: string; username: string }
  }
  payment?: { status: string; method: string }
}

export interface AdminDispute {
  id: string
  orderId: string
  reason: string
  details?: string
  resolvedAt?: string
  resolution?: string
  createdAt: string
  raisedBy: { id: string; username: string; displayName?: string }
  order: {
    product: { title: string; game: string }
    buyer: { id: string; username: string; displayName?: string }
  }
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats')
    return res.data.data!
  },

  getRecentOrders: async (): Promise<AdminOrder[]> => {
    const res = await apiClient.get<ApiResponse<AdminOrder[]>>('/admin/orders')
    return res.data.data!
  },

  getUsers: async (params?: {
    role?: string; search?: string; page?: number
  }): Promise<{ users: AdminUser[]; total: number; totalPages: number; page: number }> => {
    const res = await apiClient.get('/admin/users', { params })
    return res.data
  },

  setUserVerified: async (userId: string, isVerified: boolean) => {
    const res = await apiClient.patch(`/admin/users/${userId}/verify`, { isVerified })
    return res.data.data
  },

  getApplications: async (status?: string): Promise<SellerApplication[]> => {
    const res = await apiClient.get<ApiResponse<SellerApplication[]>>('/applications', {
      params: status ? { status } : undefined,
    })
    return res.data.data!
  },

  approveApplication: async (id: string, reviewNote?: string) => {
    const res = await apiClient.post(`/applications/${id}/approve`, { reviewNote })
    return res.data.data
  },

  rejectApplication: async (id: string, reviewNote?: string) => {
    const res = await apiClient.post(`/applications/${id}/reject`, { reviewNote })
    return res.data.data
  },

  getDisputes: async (): Promise<AdminDispute[]> => {
    const res = await apiClient.get<ApiResponse<AdminDispute[]>>('/disputes')
    return res.data.data!
  },

  resolveDispute: async (disputeId: string, resolution: string) => {
    const res = await apiClient.post(`/admin/disputes/${disputeId}/resolve`, { resolution })
    return res.data.data
  },
}