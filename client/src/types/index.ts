// ─── Enums (mirror backend Prisma enums) ──────────────────────────────────────

export type Role = 'BUYER' | 'SELLER' | 'ADMIN'
export type ProductCategory = 'GAME_ACCOUNT' | 'TOP_UP' | 'BOOSTING' | 'ITEM' | 'OTHER'
export type ProductStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'INACTIVE'
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
export type PaymentMethod = 'MIDTRANS' | 'USDT'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED'

// ─── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  username: string
  role: Role
  displayName?: string
  avatarUrl?: string
  bio?: string
  isVerified: boolean
  createdAt: string
}

export interface Product {
  id: string
  sellerId: string
  seller: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  title: string
  description: string
  category: ProductCategory
  game: string
  price: number
  status: ProductStatus
  imageUrls: string[]
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  snapToken?: string
  paymentUrl?: string
  paidAt?: string
  expiredAt?: string
}

export interface Order {
  id: string
  buyerId: string
  buyer: Pick<User, 'id' | 'username' | 'displayName'>
  productId: string
  product: Product
  amount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  notes?: string
  payment?: Payment
  review?: Review
  createdAt: string
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface Review {
  id: string
  orderId: string
  buyerId: string
  buyer: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  sellerId: string
  rating: number
  comment?: string
  createdAt: string
}
export interface SellerReviewStats {
  average: number | null
  total: number
}

export interface SellerReviewsResponse<T = unknown> {
  reviews: (Review & {
    order: { product: { title: string; game: string } }
  })[]
  stats: SellerReviewStats
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AuthResponse {
  user: User
  token: string
}

export interface CreateOrderResponse {
  order: Order
  payment: {
    snapToken?: string
    redirectUrl?: string
  } | null
}