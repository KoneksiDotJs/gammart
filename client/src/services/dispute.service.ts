import { apiClient } from './api.client'
import { ApiResponse } from '../types'

export interface Dispute {
  id: string
  orderId: string
  raisedById: string
  reason: string
  details?: string
  resolvedAt?: string
  resolution?: string
  createdAt: string
  raisedBy: {
    id: string
    username: string
    displayName?: string
  }
}

export const DISPUTE_REASONS = [
  'Seller not responding',
  'Item not as described',
  'Account credentials invalid',
  'Top-up not received',
  'Boosting not completed',
  'Other',
] as const

export type DisputeReason = typeof DISPUTE_REASONS[number]

export const disputeApi = {
  openDispute: async (
    orderId: string,
    data: { reason: DisputeReason; details?: string }
  ): Promise<Dispute> => {
    const res = await apiClient.post<ApiResponse<Dispute>>(
      `/orders/${orderId}/dispute`,
      data
    )
    return res.data.data!
  },

  getDisputeByOrder: async (orderId: string): Promise<Dispute | null> => {
    try {
      const res = await apiClient.get<ApiResponse<Dispute | null>>(
        `/orders/${orderId}/dispute`
      )
      return res.data.data ?? null
    } catch {
      return null
    }
  },
}