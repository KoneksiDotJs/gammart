import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from './store/auth.store'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProductListingPage } from './pages/buyer/ProductListingPage'
import { ProductDetailPage } from './pages/buyer/ProductDetailPage'
import { OrdersPage } from './pages/buyer/OrdersPage'
import { OrderDetailPage } from './pages/buyer/OrderDetailPage'
import { SellerProfilePage } from './pages/buyer/SellerProfilePage'
import { ProfileSettingsPage } from './pages/user/ProfileSettingsPage'
import { CreateListingPage } from './pages/seller/CreateListingPage'
import { SellerDashboard } from './pages/seller/SellerDashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

const AppLayout = () => {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])
  
  const { pathname } = useLocation()
  const hideFooter = ['/login', '/register'].includes(pathname)

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/sellers/:username" element={<SellerProfilePage />} />

        {/* Protected — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
        </Route>

        {/* Protected — sellers only */}
        <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
          <Route path="/seller/listings/new" element={<CreateListingPage />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  )
}

const AppRoutes = () => {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  )
}