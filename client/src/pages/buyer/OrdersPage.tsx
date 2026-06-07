import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { useMyOrders } from '../../hooks'
import { OrderStatus } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',  icon: <Clock className="w-3 h-3" /> },
  PAID:            { label: 'Paid',            color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',        icon: <Package className="w-3 h-3" /> },
  IN_PROGRESS:     { label: 'In Progress',     color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',  icon: <Clock className="w-3 h-3" /> },
  COMPLETED:       { label: 'Completed',       color: 'text-brand-400 bg-brand-400/10 border-brand-400/20',     icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED:       { label: 'Cancelled',       color: 'text-red-400 bg-red-400/10 border-red-400/20',           icon: <XCircle className="w-3 h-3" /> },
  DISPUTED:        { label: 'Disputed',        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',  icon: <AlertCircle className="w-3 h-3" /> },
}

type Filter = OrderStatus | 'ALL'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',             label: 'All' },
  { key: 'PENDING_PAYMENT', label: 'Pending' },
  { key: 'PAID',            label: 'Paid' },
  { key: 'IN_PROGRESS',     label: 'In Progress' },
  { key: 'COMPLETED',       label: 'Completed' },
  { key: 'CANCELLED',       label: 'Cancelled' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export const OrdersPage = () => {
  const { data: orders, isLoading } = useMyOrders()
  const [filter, setFilter] = useState<Filter>('ALL')

  const filtered = orders?.filter((o) => filter === 'ALL' || o.status === filter) ?? []

  const countFor = (key: Filter) =>
    key === 'ALL' ? (orders?.length ?? 0) : (orders?.filter((o) => o.status === key).length ?? 0)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold">My Orders</h1>
          {!isLoading && orders && (
            <p className="text-gray-500 text-sm">{orders.length} total</p>
          )}
        </div>

        {/* Filter tabs */}
        {!isLoading && orders && orders.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTERS.map(({ key, label }) => {
              const count = countFor(key)
              if (key !== 'ALL' && count === 0) return null
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filter === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === key ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Order list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((order) => {
              const status = STATUS_CONFIG[order.status]
              const needsAction = order.status === 'PENDING_PAYMENT'

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className={`flex items-center gap-4 bg-gray-900 border rounded-xl p-4 transition-all hover:-translate-y-0.5 ${
                    needsAction
                      ? 'border-yellow-500/30 hover:border-yellow-500/50'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Product thumbnail */}
                  <div className="w-14 h-14 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden">
                    {order.product.imageUrls?.[0]
                      ? <img src={order.product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                      : '🎮'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm line-clamp-1">{order.product.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {order.product.game} · {formatDate(order.createdAt)}
                    </p>
                    {needsAction && (
                      <p className="text-yellow-400 text-xs mt-1 font-medium">⚡ Action required — complete payment</p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-white font-bold text-sm">{formatPrice(Number(order.amount))}</p>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        ) : orders && orders.length > 0 ? (
          // Has orders but none match the filter
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No {filter.replace('_', ' ').toLowerCase()} orders</p>
            <button
              onClick={() => setFilter('ALL')}
              className="text-brand-500 hover:text-brand-400 text-sm mt-2"
            >
              Show all orders
            </button>
          </div>
        ) : (
          // No orders at all
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-lg font-medium">No orders yet</p>
            <p className="text-gray-600 text-sm mt-1">Browse the marketplace to find something you like</p>
            <Link
              to="/products"
              className="inline-block mt-4 bg-brand-600 hover:bg-brand-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}