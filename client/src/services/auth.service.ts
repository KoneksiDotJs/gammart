import { apiClient } from './api.client'
import { ApiResponse, AuthResponse, User } from '../types'

export const authApi = {
  register: async (data: {
    email: string
    username: string
    password: string
    displayName?: string
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return res.data.data!
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return res.data.data!
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me')
    return res.data.data!
  },
}