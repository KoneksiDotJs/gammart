import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, LogOut, PlusSquare, Package, TrendingUp, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <ShoppingBag className="w-6 h-6 text-brand-500" />
            GameMarket
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <Link to="/products" className="text-gray-300 hover:text-white text-sm transition-colors">
              Browse
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-sm transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                {user?.role === 'BUYER' && (
                  <Link
                    to="/seller/onboarding"
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    Become a Seller
                  </Link>
                )}

                {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                  <>
                    <Link
                      to="/seller/dashboard"
                      className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/seller/listings/new"
                      className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      <PlusSquare className="w-4 h-4" />
                      Sell
                    </Link>
                  </>
                )}

                <Link
                  to="/orders"
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Orders
                </Link>

                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.avatarUrl
                        ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : (user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase())
                      }
                    </div>
                    <span>{user?.displayName || user?.username}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}