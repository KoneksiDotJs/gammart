import { apiClient } from './api.client'
import { ApiResponse, CreateOrderResponse, Order, PaymentMethod } from '../types'

export const orderApi = {
  createOrder: async (data: {
    productId: string
    paymentMethod: PaymentMethod
    notes?: string
  }): Promise<CreateOrderResponse> => {
    const res = await apiClient.post<ApiResponse<CreateOrderResponse>>('/orders', data)
    return res.data.data!
  },

  getOrderById: async (id: string): Promise<Order> => {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
    return res.data.data!
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<ApiResponse<Order[]>>('/orders/my')
    return res.data.data!
  },

  getSellerOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<ApiResponse<Order[]>>('/orders/selling')
    return res.data.data!
  },

  completeOrder: async (id: string): Promise<Order> => {
    const res = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/complete`)
    return res.data.data!
  },
}