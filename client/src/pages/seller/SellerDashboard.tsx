import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusSquare, Package, TrendingUp, DollarSign,
  Clock, CheckCircle, XCircle, AlertCircle,
  Layers, ShoppingBag, ChevronRight, EyeOff,
} from 'lucide-react'
import { useMyListings, useSellerOrders, useCompleteOrder, useDeactivateProduct } from '../../hooks'
import { useAuthStore } from '../../store/auth.store'
import { Order, OrderStatus, Product, ProductStatus } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Clock className="w-3 h-3" /> },
  PAID:            { label: 'Paid – Deliver',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     icon: <Package className="w-3 h-3" /> },
  IN_PROGRESS:     { label: 'In Progress',     color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <Clock className="w-3 h-3" /> },
  COMPLETED:       { label: 'Completed',       color: 'text-brand-400 bg-brand-400/10 border-brand-400/20',  icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED:       { label: 'Cancelled',       color: 'text-red-400 bg-red-400/10 border-red-400/20',        icon: <XCircle className="w-3 h-3" /> },
  DISPUTED:        { label: 'Disputed',        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: <AlertCircle className="w-3 h-3" /> },
}

const PRODUCT_STATUS: Record<ProductStatus, { label: string; color: string }> = {
  ACTIVE:   { label: 'Active',   color: 'text-brand-400 bg-brand-400/10' },
  RESERVED: { label: 'Reserved', color: 'text-yellow-400 bg-yellow-400/10' },
  SOLD:     { label: 'Sold',     color: 'text-gray-400 bg-gray-700' },
  INACTIVE: { label: 'Inactive', color: 'text-red-400 bg-red-400/10' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  label, value, icon, color, sub,
}: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <div className={`${color} mb-3`}>{icon}</div>
    <p className="text-white text-2xl font-bold">{value}</p>
    <p className="text-gray-400 text-sm">{label}</p>
    {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
  </div>
)

const OrderRow = ({ order, onComplete }: { order: Order; onComplete: (id: string) => void }) => {
  const status = ORDER_STATUS[order.status]
  const isPaid = order.status === 'PAID'

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
      isPaid ? 'border-blue-500/30 hover:border-blue-500/50' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Product thumbnail */}
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center text-xl overflow-hidden">
            {order.product.imageUrls?.[0]
              ? <img src={order.product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
              : '🎮'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium line-clamp-1">{order.product.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              @{order.buyer.username} · {formatDate(order.createdAt)}
            </p>
            {order.notes && (
              <p className="text-gray-600 text-xs mt-1 italic line-clamp-1">"{order.notes}"</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="text-white font-bold text-sm">{formatPrice(Number(order.amount))}</p>
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          {isPaid && (
            <button
              onClick={() => onComplete(order.id)}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded-lg transition-colors font-medium"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ListingCard = ({
  product, onDeactivate,
}: { product: Product; onDeactivate: (id: string) => void }) => {
  const status = PRODUCT_STATUS[product.status]
  const canDeactivate = product.status === 'ACTIVE'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
      {/* Thumbnail */}
      <div className="h-28 bg-gray-800 flex items-center justify-center text-3xl overflow-hidden relative">
        {product.imageUrls?.[0]
          ? <img src={product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
          : <span>🎮</span>
        }
        {/* Status badge overlay */}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="p-3">
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug mb-1">{product.title}</p>
        <p className="text-gray-500 text-xs mb-2">{product.game} · {product.category.replace('_', ' ')}</p>
        <div className="flex items-center justify-between">
          <p className="text-brand-500 font-bold text-sm">{formatPrice(Number(product.price))}</p>
          {canDeactivate && (
            <button
              onClick={() => onDeactivate(product.id)}
              className="flex items-center gap-1 text-gray-600 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100"
              title="Deactivate listing"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'listings' | 'orders'

export const SellerDashboard = () => {
  const { user } = useAuthStore()
  const { data: listings, isLoading: listingsLoading } = useMyListings()
  const { data: orders, isLoading: ordersLoading } = useSellerOrders()
  const completeOrder = useCompleteOrder()
  const deactivateProduct = useDeactivateProduct()

  const [tab, setTab] = useState<Tab>('overview')
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null)

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalRevenue   = orders?.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.amount), 0) ?? 0
  const pendingCount   = orders?.filter((o) => o.status === 'PAID').length ?? 0
  const activeCount    = listings?.filter((p) => p.status === 'ACTIVE').length ?? 0
  const completedCount = orders?.filter((o) => o.status === 'COMPLETED').length ?? 0

  const filteredOrders = orders?.filter((o) => orderFilter === 'ALL' || o.status === orderFilter) ?? []

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleComplete = async (orderId: string) => {
    await completeOrder.mutateAsync(orderId)
  }

  const handleDeactivate = async (productId: string) => {
    await deactivateProduct.mutateAsync(productId)
    setConfirmDeactivate(null)
  }

  const isLoading = listingsLoading || ordersLoading

  // ── Tabs ──────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview',  label: 'Overview',  icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'listings',  label: 'Listings',  icon: <Layers className="w-4 h-4" />,     badge: activeCount },
    { key: 'orders',    label: 'Orders',    icon: <ShoppingBag className="w-4 h-4" />, badge: pendingCount || undefined },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Seller Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.displayName || user?.username}</p>
          </div>
          <Link
            to="/seller/listings/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PlusSquare className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ key, label, icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {icon}
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Overview tab ──────────────────────────────────────────── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Total Revenue"      value={formatPrice(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="text-brand-400" sub={`${completedCount} completed orders`} />
                  <StatCard label="Awaiting Delivery"  value={pendingCount}              icon={<Package className="w-5 h-5" />}    color="text-blue-400" />
                  <StatCard label="Active Listings"    value={activeCount}               icon={<Layers className="w-5 h-5" />}     color="text-purple-400" />
                  <StatCard label="Total Orders"       value={orders?.length ?? 0}       icon={<ShoppingBag className="w-5 h-5" />} color="text-yellow-400" />
                </div>

                {/* Action queue */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold">Needs Your Action</h2>
                    {pendingCount > 0 && (
                      <button onClick={() => setTab('orders')} className="text-brand-500 hover:text-brand-400 text-xs flex items-center gap-1">
                        View all <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {pendingCount === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl py-8 text-center">
                      <CheckCircle className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">All caught up! No deliveries pending.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders?.filter((o) => o.status === 'PAID').map((order) => (
                        <OrderRow key={order.id} order={order} onComplete={handleComplete} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent orders */}
                {(orders?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-white font-semibold">Recent Orders</h2>
                      <button onClick={() => setTab('orders')} className="text-brand-500 hover:text-brand-400 text-xs flex items-center gap-1">
                        View all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {orders?.slice(0, 3).map((order) => (
                        <OrderRow key={order.id} order={order} onComplete={handleComplete} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Listings tab ──────────────────────────────────────────── */}
            {tab === 'listings' && (
              <div>
                {!listings || listings.length === 0 ? (
                  <div className="text-center py-16 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
                    <Layers className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No listings yet</p>
                    <Link to="/seller/listings/new" className="text-brand-500 hover:text-brand-400 text-sm mt-2 inline-flex items-center gap-1">
                      Create your first listing <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Filter by status */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(['ALL', 'ACTIVE', 'RESERVED', 'SOLD', 'INACTIVE'] as const).map((s) => {
                        const count = s === 'ALL' ? listings.length : listings.filter((p) => p.status === s).length
                        return (
                          <button key={s} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                            {s === 'ALL' ? 'All' : PRODUCT_STATUS[s as ProductStatus].label} ({count})
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {listings.map((product) => (
                        <ListingCard
                          key={product.id}
                          product={product}
                          onDeactivate={(id) => setConfirmDeactivate(id)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Orders tab ────────────────────────────────────────────── */}
            {tab === 'orders' && (
              <div>
                {/* Filter bar */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['ALL', 'PAID', 'COMPLETED', 'PENDING_PAYMENT', 'CANCELLED'] as const).map((s) => {
                    const count = s === 'ALL' ? (orders?.length ?? 0) : (orders?.filter((o) => o.status === s).length ?? 0)
                    return (
                      <button
                        key={s}
                        onClick={() => setOrderFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          orderFilter === s ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {s === 'ALL' ? 'All' : ORDER_STATUS[s as OrderStatus]?.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
                    <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <OrderRow key={order.id} order={order} onComplete={handleComplete} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Deactivate confirmation modal ─────────────────────────────────── */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <EyeOff className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-semibold">Deactivate Listing?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              This listing will be hidden from buyers immediately. You can't re-activate it — you'd need to create a new listing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(confirmDeactivate)}
                disabled={deactivateProduct.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {deactivateProduct.isPending ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}