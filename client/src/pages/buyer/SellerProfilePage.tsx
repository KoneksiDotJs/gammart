import { Link, useParams } from 'react-router-dom'
import {
  ShieldCheck, Star, Package, ShoppingBag,
  CalendarDays, MessageSquare, ChevronRight,
} from 'lucide-react'
import { useSellerProfile, useSellerReviews } from '../../hooks'
import { StarRating } from '../../components/ui/ReviewSection'
import { Product } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

const formatReviewDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Stat badge ───────────────────────────────────────────────────────────────

const StatBadge = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex flex-col items-center gap-1 px-5 py-3 bg-gray-800 rounded-xl">
    <div className="text-brand-400">{icon}</div>
    <p className="text-white font-bold text-lg leading-none">{value}</p>
    <p className="text-gray-500 text-xs">{label}</p>
  </div>
)

// ─── Product card (compact) ───────────────────────────────────────────────────

const ListingCard = ({ product }: { product: Product }) => (
  <Link
    to={`/products/${product.id}`}
    className="group flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-brand-500/40 rounded-xl p-3 transition-all"
  >
    <div className="w-14 h-14 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden">
      {product.imageUrls?.[0]
        ? <img src={product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
        : '🎮'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-brand-400 transition-colors">
        {product.title}
      </p>
      <p className="text-gray-500 text-xs mt-0.5">{product.game} · {product.category.replace('_', ' ')}</p>
      <p className="text-brand-500 text-sm font-bold mt-1">{formatPrice(Number(product.price))}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
  </Link>
)

// ─── Rating breakdown bar ─────────────────────────────────────────────────────

const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 text-xs w-3">{star}</span>
      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-600 text-xs w-6 text-right">{count}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const SellerProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const { data, isLoading, isError } = useSellerProfile(username!)
  const { data: reviewData } = useSellerReviews(data?.seller.id ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">Seller not found</p>
          <Link to="/products" className="text-brand-500 hover:text-brand-400 text-sm">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    )
  }

  const { seller, stats, listings } = data
  const reviews = reviewData?.reviews ?? []

  // Compute per-star breakdown from reviews
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const hasRating = stats.rating.total > 0

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Profile header ──────────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
              {seller.avatarUrl
                ? <img src={seller.avatarUrl} alt="" className="w-full h-full object-cover" />
                : (seller.displayName?.[0] || seller.username[0]).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white text-xl font-bold">
                  {seller.displayName || seller.username}
                </h1>
                {seller.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-brand-400 bg-brand-400/10 border border-brand-400/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">@{seller.username}</p>

              {seller.bio && (
                <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-lg">
                  {seller.bio}
                </p>
              )}

              {/* Rating summary inline */}
              {hasRating && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating value={Math.round(stats.rating.average ?? 0)} readonly size="sm" />
                  <span className="text-yellow-400 text-sm font-semibold">
                    {stats.rating.average?.toFixed(1)}
                  </span>
                  <span className="text-gray-600 text-sm">
                    ({stats.rating.total} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-2 text-gray-600 text-xs">
                <CalendarDays className="w-3.5 h-3.5" />
                Member since {formatDate(seller.createdAt)}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-5 flex-wrap">
            <StatBadge
              icon={<Package className="w-4 h-4" />}
              label="Active Listings"
              value={stats.totalListings}
            />
            <StatBadge
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Completed Orders"
              value={stats.completedOrders}
            />
            {hasRating && (
              <StatBadge
                icon={<Star className="w-4 h-4 fill-brand-400" />}
                label="Avg Rating"
                value={`${stats.rating.average?.toFixed(1)} / 5`}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Listings column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" />
              Active Listings
              <span className="text-gray-600 font-normal text-sm">({listings.length})</span>
            </h2>

            {listings.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl py-10 text-center">
                <p className="text-gray-600 text-sm">No active listings</p>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map((product) => (
                  <ListingCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* ── Reviews column ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              Reviews
              <span className="text-gray-600 font-normal text-sm">({stats.rating.total})</span>
            </h2>

            {hasRating ? (
              <>
                {/* Rating summary card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-white text-4xl font-bold leading-none">
                      {stats.rating.average?.toFixed(1)}
                    </p>
                    <div>
                      <StarRating value={Math.round(stats.rating.average ?? 0)} readonly size="sm" />
                      <p className="text-gray-500 text-xs mt-1">
                        Based on {stats.rating.total} review{stats.rating.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {starCounts.map(({ star, count }) => (
                      <RatingBar key={star} star={star} count={count} total={stats.rating.total} />
                    ))}
                  </div>
                </div>

                {/* Individual reviews */}
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(review.buyer.displayName?.[0] || review.buyer.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium">
                              {review.buyer.displayName || review.buyer.username}
                            </p>
                            <p className="text-gray-600 text-xs">{formatReviewDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>

                      {review.comment && (
                        <p className="text-gray-400 text-xs leading-relaxed mt-1">
                          {review.comment}
                        </p>
                      )}

                      {/* Product context */}
                      <p className="text-gray-700 text-xs mt-2 truncate">
                        re: {review.order.product.game} · {review.order.product.title}
      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl py-10 text-center">
                <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No reviews yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}