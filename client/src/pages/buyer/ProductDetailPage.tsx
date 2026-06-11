import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useProduct, useCreateOrder, useSellerReviews } from '../../hooks'
import { useAuthStore } from '../../store/auth.store'
import { PaymentMethod } from '../../types'
import { StarRating } from '../../components/ui/ReviewSection'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: product, isLoading } = useProduct(id!)
  const { data: sellerReviews } = useSellerReviews(product?.sellerId ?? '')
  const createOrder = useCreateOrder()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MIDTRANS')
  const [notes, setNotes] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setCheckoutError('')

    try {
      const result = await createOrder.mutateAsync({
        productId: id!,
        paymentMethod,
        notes: notes || undefined,
      })

      if (paymentMethod === 'MIDTRANS' && result.payment?.snapToken) {
        // Open Midtrans Snap modal
        // @ts-ignore — Midtrans Snap is loaded via CDN script tag
        window.snap.pay(result.payment.snapToken, {
          onSuccess: () => navigate(`/orders/${result.order.id}`),
          onPending: () => navigate(`/orders/${result.order.id}`),
          onError: () => setCheckoutError('Payment failed. Please try again.'),
          onClose: () => {}, // user closed modal
        })
      } else {
        navigate(`/orders/${result.order.id}`)
      }
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || 'Failed to create order')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Product info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-gray-900 rounded-xl overflow-hidden h-72 flex items-center justify-center">
              {product.imageUrls?.[0] ? (
                <img src={product.imageUrls[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">🎮</span>
              )}
            </div>

            {/* Title & meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full font-medium">
                  {product.game}
                </span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                  {product.category.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-white text-2xl font-bold mb-3">{product.title}</h1>
              <p className="text-gray-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Seller info */}
            <Link
              to={`/sellers/${product.seller.username}`}
              className="bg-gray-900 border border-gray-800 hover:border-brand-500/40 rounded-xl p-4 flex items-center gap-3 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                {product.seller.displayName?.[0]?.toUpperCase() || product.seller.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">{product.seller.displayName || product.seller.username}</p>
                <p className="text-gray-500 text-xs">@{product.seller.username}</p>
                {sellerReviews && sellerReviews.stats.total > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating value={Math.round(sellerReviews.stats.average ?? 0)} readonly size="sm" />
                    <span className="text-yellow-400 text-xs font-medium">
                      {sellerReviews.stats.average?.toFixed(1)}
                    </span>
                    <span className="text-gray-600 text-xs">
                      ({sellerReviews.stats.total} reviews)
                    </span>
                  </div>
                )}
              </div>
              <ShieldCheck className="ml-auto w-5 h-5 text-brand-500" />
            </Link>
          </div>

          {/* Right — Checkout card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-white text-3xl font-bold">{formatPrice(product.price)}</p>
              </div>

              {/* Payment method selector */}
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Payment method</p>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'MIDTRANS' ? 'border-brand-500 bg-brand-500/5' : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="MIDTRANS"
                      checked={paymentMethod === 'MIDTRANS'}
                      onChange={() => setPaymentMethod('MIDTRANS')}
                      className="accent-brand-500"
                    />
                    <div>
                      <p className="text-white text-sm font-medium">Midtrans</p>
                      <p className="text-gray-500 text-xs">Bank transfer, e-wallet, card</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'USDT' ? 'border-brand-500 bg-brand-500/5' : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="USDT"
                      checked={paymentMethod === 'USDT'}
                      onChange={() => setPaymentMethod('USDT')}
                      className="accent-brand-500"
                    />
                    <div>
                      <p className="text-white text-sm font-medium">USDT</p>
                      <p className="text-gray-500 text-xs">Tether (TRC-20 / ERC-20)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  placeholder="Any instructions for the seller..."
                />
              </div>

              {checkoutError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
                  {checkoutError}
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={createOrder.isPending || product.status !== 'ACTIVE'}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {createOrder.isPending
                  ? 'Processing...'
                  : product.status !== 'ACTIVE'
                  ? 'Not Available'
                  : 'Buy Now'}
              </button>

              <p className="text-gray-600 text-xs text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Transactions are protected by GameMarket
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}