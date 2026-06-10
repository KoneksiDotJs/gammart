import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, Package, ShieldCheck, Copy,
  ArrowLeft, User, Tag, AlertTriangle, ExternalLink,
  Gamepad2, RefreshCw,
} from 'lucide-react'
import { useOrder, useCompleteOrder } from '../../hooks'
import { useAuthStore } from '../../store/auth.store'
import { OrderStatus } from '../../types'
import { ReviewSection } from '../../components/ui/ReviewSection'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    description: 'Waiting for payment to be confirmed.',
  },
  PAID: {
    label: 'Paid',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    description: 'Payment confirmed. Waiting for the seller to deliver.',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    description: 'The seller is processing your order.',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
    border: 'border-brand-400/30',
    description: 'Order delivered and completed successfully.',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    description: 'This order was cancelled.',
  },
  DISPUTED: {
    label: 'Disputed',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    description: 'There is an open dispute on this order. Please contact support.',
  },
}

// ─── Progress tracker ─────────────────────────────────────────────────────────

const STEPS: { key: OrderStatus[]; label: string; icon: React.ReactNode }[] = [
  { key: ['PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'COMPLETED'], label: 'Order Placed',        icon: <Package className="w-4 h-4" /> },
  { key: ['PAID', 'IN_PROGRESS', 'COMPLETED'],                     label: 'Payment Confirmed',   icon: <CheckCircle className="w-4 h-4" /> },
  { key: ['IN_PROGRESS', 'COMPLETED'],                             label: 'In Delivery',         icon: <Clock className="w-4 h-4" /> },
  { key: ['COMPLETED'],                                            label: 'Completed',           icon: <ShieldCheck className="w-4 h-4" /> },
]

const ProgressTracker = ({ status }: { status: OrderStatus }) => {
  if (status === 'CANCELLED' || status === 'DISPUTED') return null

  const currentStep = STEPS.findLastIndex((s) => s.key.includes(status))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
      <div className="relative flex items-start justify-between">
        {/* Background track */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800 mx-12" />
        {/* Filled track */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-brand-600 mx-12 transition-all duration-500"
          style={{ right: `${((STEPS.length - 1 - currentStep) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const done = i <= currentStep
          const active = i === currentStep
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                done
                  ? active
                    ? 'bg-brand-600 text-white ring-4 ring-brand-600/20'
                    : 'bg-brand-600/70 text-white'
                  : 'bg-gray-800 text-gray-600'
              }`}>
                {step.icon}
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${done ? 'text-white' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Expiry countdown ─────────────────────────────────────────────────────────

const ExpiryCountdown = ({ expiredAt }: { expiredAt: string }) => {
  const [remaining, setRemaining] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiredAt).getTime() - Date.now()
      if (diff <= 0) { setExpired(true); setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiredAt])

  return (
    <span className={expired ? 'text-red-400' : 'text-yellow-400'}>
      {expired ? 'Payment expired' : `Expires in ${remaining}`}
    </span>
  )
}

// ─── Copy button with toast ───────────────────────────────────────────────────

const CopyButton = ({ text, label = 'Copy' }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors text-xs"
      title={label}
    >
      <Copy className="w-3 h-3" />
      {copied ? <span className="text-brand-400">Copied!</span> : label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: order, isLoading, refetch } = useOrder(id!)
  const completeOrder = useCompleteOrder()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-3">Order not found</p>
          <Link to="/orders" className="text-brand-500 hover:text-brand-400 text-sm">← Back to orders</Link>
        </div>
      </div>
    )
  }

  const isBuyer  = user?.id === order.buyerId
  const isSeller = user?.id === order.product.sellerId
  const statusCfg = STATUS_CONFIG[order.status]

  const isPendingPayment = order.status === 'PENDING_PAYMENT'
  const isPaid           = order.status === 'PAID'
  const isCompleted      = order.status === 'COMPLETED'
  const isCancelled      = order.status === 'CANCELLED'

  const handleOpenSnap = () => {
    if (!order.payment?.snapToken) return
    // @ts-ignore — Midtrans Snap loaded via CDN
    window.snap.pay(order.payment.snapToken, {
      onSuccess: () => refetch(),
      onPending: () => refetch(),
      onError:   () => refetch(),
    })
  }

  const handleComplete = async () => {
    await completeOrder.mutateAsync(order.id)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Order Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600 text-xs font-mono truncate max-w-[220px]">{order.id}</span>
              <CopyButton text={order.id} label="Copy ID" />
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
            {order.status === 'COMPLETED'      && <CheckCircle className="w-4 h-4" />}
            {order.status === 'PENDING_PAYMENT' && <Clock className="w-4 h-4" />}
            {order.status === 'PAID'            && <Package className="w-4 h-4" />}
            {order.status === 'CANCELLED'       && <AlertTriangle className="w-4 h-4" />}
            {order.status === 'DISPUTED'        && <AlertTriangle className="w-4 h-4" />}
            {statusCfg.label}
          </div>
        </div>

        {/* Status description banner */}
        <div className={`rounded-xl border px-4 py-3 mb-6 text-sm ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
          {statusCfg.description}
          {order.status === 'DISPUTED' && (
            <a href="mailto:support@gamemarket.id" className="underline ml-1 inline-flex items-center gap-1">
              Contact support <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Progress tracker */}
        <ProgressTracker status={order.status} />

        {/* ── Payment action block (buyer only, pending) ─────────────────── */}
        {isBuyer && isPendingPayment && order.payment && (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-semibold">Complete Your Payment</p>
                {order.payment.expiredAt && (
                  <p className="text-xs mt-0.5">
                    <ExpiryCountdown expiredAt={order.payment.expiredAt} />
                  </p>
                )}
              </div>
              <p className="text-white text-xl font-bold">{formatPrice(Number(order.amount))}</p>
            </div>

            {order.paymentMethod === 'MIDTRANS' && order.payment.snapToken ? (
              <button
                onClick={handleOpenSnap}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Pay with Midtrans
              </button>
            ) : order.paymentMethod === 'USDT' ? (
              <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                <p className="font-medium text-white">Send USDT to complete payment</p>
                <p className="text-gray-500 text-xs">USDT payment details will be shown here once the integration is complete.</p>
              </div>
            ) : null}

            {order.payment.paymentUrl && (
              <a
                href={order.payment.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-3 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Open payment page instead <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* ── Seller action block (seller only, paid) ────────────────────── */}
        {isSeller && isPaid && (
          <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5 mb-6">
            <p className="text-white font-semibold mb-1">Ready to deliver?</p>
            <p className="text-gray-400 text-sm mb-4">
              Once you've delivered the product to the buyer, mark this order as complete.
            </p>
            <button
              onClick={handleComplete}
              disabled={completeOrder.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {completeOrder.isPending ? 'Marking...' : 'Mark as Delivered'}
            </button>
          </div>
        )}

        {/* ── Completed celebration ──────────────────────────────────────── */}
        {isCompleted && (
          <div className="bg-brand-600/10 border border-brand-600/30 rounded-xl p-5 mb-6 text-center">
            <CheckCircle className="w-10 h-10 text-brand-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Order Complete!</p>
            <p className="text-gray-400 text-sm mt-1">
              {isBuyer ? "You've received your product. Enjoy!" : "You've successfully delivered this order."}
            </p>
          </div>
        )}

        {/* ── Main info grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* Product card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="h-32 bg-gray-800 flex items-center justify-center text-3xl overflow-hidden">
              {order.product.imageUrls?.[0]
                ? <img src={order.product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                : '🎮'}
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" /> Product
              </p>
              <p className="text-white font-semibold text-sm mb-1 line-clamp-2">{order.product.title}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">{order.product.game}</span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {order.product.category.replace('_', ' ')}
                </span>
              </div>
              {order.notes && (
                <p className="text-gray-500 text-xs mt-3 bg-gray-800 rounded-lg px-3 py-2 italic">
                  "{order.notes}"
                </p>
              )}
              <Link
                to={`/products/${order.productId}`}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-400 text-xs mt-3 transition-colors"
              >
                View listing <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Payment card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Payment</p>
              <p className="text-white text-2xl font-bold">{formatPrice(Number(order.amount))}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                  {order.paymentMethod}
                </span>
                {order.payment?.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.payment.status === 'SUCCESS' ? 'text-brand-400 bg-brand-400/10' :
                    order.payment.status === 'PENDING' ? 'text-yellow-400 bg-yellow-400/10' :
                    order.payment.status === 'FAILED'  ? 'text-red-400 bg-red-400/10' :
                    'text-gray-400 bg-gray-700'
                  }`}>
                    {order.payment.status}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Order placed</span>
                <span className="text-gray-300">{formatDateTime(order.createdAt)}</span>
              </div>
              {order.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid at</span>
                  <span className="text-gray-300">{formatDateTime(order.payment.paidAt)}</span>
                </div>
              )}
              {order.payment?.expiredAt && isPendingPayment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-yellow-400">{formatDateTime(order.payment.expiredAt)}</span>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs mt-auto transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh status
            </button>
          </div>
        </div>

        {/* ── Product metadata ───────────────────────────────────────────── */}
        {order.product.metadata && Object.keys(order.product.metadata).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Product Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(order.product.metadata).map(([k, v]) => (
                <div key={k} className="bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-white text-sm font-medium mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Counterparty info ──────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {isBuyer ? 'Seller' : 'Buyer'}
          </p>
          {isBuyer ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(order.product.seller.displayName?.[0] || order.product.seller.username[0]).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {order.product.seller.displayName || order.product.seller.username}
                </p>
                <p className="text-gray-500 text-xs">@{order.product.seller.username}</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-brand-500 ml-auto" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(order.buyer.displayName?.[0] || order.buyer.username[0]).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {order.buyer.displayName || order.buyer.username}
                </p>
                <p className="text-gray-500 text-xs">@{order.buyer.username}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cancelled warning */}
        {isCancelled && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm font-medium">This order was cancelled</p>
            <p className="text-gray-500 text-xs mt-1">
              If you were charged, the refund will be processed by your payment provider.
            </p>
            <Link to="/products" className="inline-block mt-3 text-brand-500 hover:text-brand-400 text-sm">
              Browse products →
            </Link>
          </div>
        )}

        {/* Review section — only shown to buyer on completed orders */}
        <ReviewSection
          orderId={order.id}
          isBuyer={isBuyer}
          orderStatus={order.status}
        />

      </div>
    </div>
  )
}