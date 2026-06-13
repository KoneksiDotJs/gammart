import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi, ProductFilters } from '../services/product.service'
import { orderApi } from '../services/order.service'
import { reviewApi } from '../services/review.service'
import { disputeApi, DisputeReason } from '../services/dispute.service'
import { authApi } from '../services/auth.service'
import { useAuthStore } from '../store/auth.store'
import { applicationApi } from '../services/application.service'
import { PaymentMethod } from '../types'

// ─── Auth Hooks ───────────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  // const { user, login } = useAuthStore()

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      // Patch the Zustand store directly so navbar updates immediately
      useAuthStore.setState((s) => ({ ...s, user: { ...s.user!, ...updatedUser } }))
    },
  })
}

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: authApi.updatePassword,
  })
}

// ─── Product Hooks ────────────────────────────────────────────────────────────

export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getProducts(filters),
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  })
}

export const useMyListings = () => {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: productApi.getMyListings,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })
}

export const useDeactivateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productApi.deactivateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })
}

// ─── Order Hooks ──────────────────────────────────────────────────────────────

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: orderApi.getMyOrders,
  })
}

export const useSellerOrders = () => {
  return useQuery({
    queryKey: ['seller-orders'],
    queryFn: orderApi.getSellerOrders,
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getOrderById(id),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { productId: string; paymentMethod: PaymentMethod; notes?: string }) =>
      orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}

export const useCompleteOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: orderApi.completeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
  })
}

// ─── Review Hooks ─────────────────────────────────────────────────────────────

export const useOrderReview = (orderId: string) => {
  return useQuery({
    queryKey: ['review', orderId],
    queryFn: () => reviewApi.getReviewByOrder(orderId),
    enabled: !!orderId,
  })
}

export const useSubmitReview = (orderId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { rating: number; comment?: string }) =>
      reviewApi.submitReview(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
    },
  })
}

export const useSellerReviews = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () => reviewApi.getSellerReviews(sellerId),
    enabled: !!sellerId,
  })
}

export const useSellerProfile = (username: string) => {
  return useQuery({
    queryKey: ['seller-profile', username],
    queryFn: () => reviewApi.getSellerProfile(username),
    enabled: !!username,
  })
}

// ─── Application Hooks ────────────────────────────────────────────────────────

export const useMyApplication = () => {
  return useQuery({
    queryKey: ['my-application'],
    queryFn: applicationApi.getMyApplication,
  })
}

export const useApply = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationApi.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-application'] })
    },
  })
}

// ─── Dispute Hooks ────────────────────────────────────────────────────────────

export const useOrderDispute = (orderId: string) => {
  return useQuery({
    queryKey: ['dispute', orderId],
    queryFn: () => disputeApi.getDisputeByOrder(orderId),
    enabled: !!orderId,
  })
}

export const useOpenDispute = (orderId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { reason: DisputeReason; details?: string }) =>
      disputeApi.openDispute(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}
