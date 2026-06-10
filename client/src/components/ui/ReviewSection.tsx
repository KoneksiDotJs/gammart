import { useState } from 'react'
import { Star } from 'lucide-react'
import { useOrderReview, useSubmitReview } from '../../hooks'
import { Review } from '../../types'

// ─── Star rating input ────────────────────────────────────────────────────────

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}) => {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= active
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Submitted review display ─────────────────────────────────────────────────

const ReviewDisplay = ({ review }: { review: Review }) => {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const RATING_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent',
  }

  return (
    <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(review.buyer.displayName?.[0] || review.buyer.username[0]).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {review.buyer.displayName || review.buyer.username}
            </p>
            <p className="text-gray-500 text-xs">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size="sm" />
          <span className="text-yellow-400 text-xs font-semibold">
            {RATING_LABELS[review.rating]}
          </span>
        </div>
      </div>

      {review.comment && (
        <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/60 rounded-lg px-4 py-3 italic">
          "{review.comment}"
        </p>
      )}

      <p className="text-brand-500 text-xs mt-3 flex items-center gap-1.5">
        <Star className="w-3 h-3 fill-brand-500" />
        Review submitted
      </p>
    </div>
  )
}

// ─── Review form ──────────────────────────────────────────────────────────────

const ReviewForm = ({ orderId }: { orderId: string }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const submitReview = useSubmitReview(orderId)

  const RATING_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: 'Poor',      color: 'text-red-400' },
    2: { label: 'Fair',      color: 'text-orange-400' },
    3: { label: 'Good',      color: 'text-yellow-400' },
    4: { label: 'Great',     color: 'text-lime-400' },
    5: { label: 'Excellent', color: 'text-brand-400' },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating'); return }
    setError('')

    try {
      await submitReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star picker */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          How was your experience?
        </label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className={`text-sm font-semibold ${RATING_LABELS[rating].color}`}>
              {RATING_LABELS[rating].label}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Comment <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
          placeholder="Tell other buyers about this seller — fast delivery, good communication, accurate description..."
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${comment.length > 450 ? 'text-yellow-500' : 'text-gray-600'}`}>
            {comment.length}/500
          </span>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitReview.isPending || rating === 0}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {submitReview.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Star className="w-4 h-4" />
            Submit Review
          </>
        )}
      </button>
    </form>
  )
}

// ─── Main export — smart wrapper ──────────────────────────────────────────────

interface ReviewSectionProps {
  orderId: string
  isBuyer: boolean
  orderStatus: string
}

/**
 * Renders the review section at the bottom of the OrderDetailPage.
 *
 * Logic:
 * - Only shown to the buyer of a COMPLETED order
 * - If a review already exists → shows the submitted review card
 * - If no review yet → shows the star form
 */
export const ReviewSection = ({ orderId, isBuyer, orderStatus }: ReviewSectionProps) => {
  const { data: existingReview, isLoading } = useOrderReview(orderId)

  // Only buyers on completed orders can review
  if (!isBuyer || orderStatus !== 'COMPLETED') return null

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        {existingReview ? 'Your Review' : 'Leave a Review'}
      </h3>

      {existingReview ? (
        <ReviewDisplay review={existingReview} />
      ) : (
        <ReviewForm orderId={orderId} />
      )}
    </div>
  )
}

// Export StarRating for reuse on the seller profile page
export { StarRating }