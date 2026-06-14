import { useState } from 'react'
import { AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react'
import { useOrderDispute, useOpenDispute } from '../../hooks'
import { DISPUTE_REASONS, DisputeReason } from '../../services/dispute.service'

// ─── Existing dispute display ─────────────────────────────────────────────────

const DisputeDisplay = ({
  dispute,
}: {
  dispute: NonNullable<ReturnType<typeof useOrderDispute>['data']>
}) => {
  const isResolved = !!dispute.resolvedAt

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${
      isResolved
        ? 'bg-brand-500/5 border-brand-500/20'
        : 'bg-orange-500/5 border-orange-500/20'
    }`}>
      <div className="flex items-center gap-2">
        {isResolved
          ? <CheckCircle className="w-5 h-5 text-brand-400" />
          : <Clock className="w-5 h-5 text-orange-400" />
        }
        <p className={`font-semibold text-sm ${isResolved ? 'text-brand-400' : 'text-orange-400'}`}>
          {isResolved ? 'Dispute Resolved' : 'Dispute Under Review'}
        </p>
        <span className="text-gray-600 text-xs ml-auto">
          Opened {formatDate(dispute.createdAt)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-500 w-16 flex-shrink-0">Reason</span>
          <span className="text-white">{dispute.reason}</span>
        </div>
        {dispute.details && (
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">Details</span>
            <span className="text-gray-300 leading-relaxed">{dispute.details}</span>
          </div>
        )}
      </div>

      {isResolved ? (
        <div className="bg-brand-500/10 rounded-lg px-4 py-3">
          <p className="text-brand-400 text-xs font-medium mb-1">Resolution</p>
          <p className="text-gray-300 text-sm">{dispute.resolution}</p>
          <p className="text-gray-600 text-xs mt-1">{formatDate(dispute.resolvedAt!)}</p>
        </div>
      ) : (
        <div className="bg-orange-500/10 rounded-lg px-4 py-3">
          <p className="text-orange-400 text-xs font-medium mb-1">What happens next?</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Our team has been notified and will review this dispute within 1–2 business days.
            Please do not close this page or take any action until you hear from us at{' '}
            <a href="mailto:support@gammart.id" className="text-brand-400 underline">
              support@gammart.id
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Dispute form ─────────────────────────────────────────────────────────────

const DisputeForm = ({
  orderId,
  onCancel,
}: {
  orderId: string
  onCancel: () => void
}) => {
  const [reason,  setReason]  = useState<DisputeReason | ''>('')
  const [details, setDetails] = useState('')
  const [error,   setError]   = useState('')
  const openDispute = useOpenDispute(orderId)

  const needsDetails = reason === 'Other' || reason === 'Item not as described'
  const isValid = reason !== '' && (!needsDetails || details.length >= 20)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) { setError('Please select a reason'); return }
    setError('')

    try {
      await openDispute.mutateAsync({
        reason: reason as DisputeReason,
        details: details.trim() || undefined,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open dispute')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Reason picker */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          What's the issue?
        </label>
        <div className="space-y-2">
          {DISPUTE_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                reason === r
                  ? 'border-orange-500/60 bg-orange-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-orange-500"
              />
              <span className={`text-sm ${reason === r ? 'text-white' : 'text-gray-300'}`}>
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Details textarea */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Details
          <span className={`font-normal ml-1 ${needsDetails ? 'text-orange-400' : 'text-gray-500'}`}>
            {needsDetails ? '(required)' : '(optional)'}
          </span>
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
          placeholder="Describe the issue in detail — when it happened, what you expected, what actually occurred..."
        />
        <div className="flex justify-between mt-1">
          {needsDetails && details.length < 20 ? (
            <p className="text-orange-400 text-xs">Min 20 characters required</p>
          ) : <span />}
          <span className={`text-xs ${details.length > 900 ? 'text-yellow-500' : 'text-gray-600'}`}>
            {details.length}/1000
          </span>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={openDispute.isPending || !isValid}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
        >
          {openDispute.isPending ? 'Submitting...' : 'Submit Dispute'}
        </button>
      </div>
    </form>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface DisputeSectionProps {
  orderId: string
  isBuyer: boolean
  orderStatus: string
}

/**
 * Renders the dispute section on OrderDetailPage.
 *
 * Logic:
 * - Only shown to the buyer of a PAID or DISPUTED order
 * - If dispute already exists → shows the dispute status card
 * - If no dispute and status is PAID → shows the "Open Dispute" button
 *   which expands into the form
 */
export const DisputeSection = ({ orderId, isBuyer, orderStatus }: DisputeSectionProps) => {
  const [showForm, setShowForm] = useState(false)
  const { data: dispute, isLoading } = useOrderDispute(orderId)

  // Only relevant for buyers on PAID or already-DISPUTED orders
  if (!isBuyer || (orderStatus !== 'PAID' && orderStatus !== 'DISPUTED')) return null

  if (isLoading) {
    return <div className="bg-gray-900 border border-gray-800 rounded-xl h-16 animate-pulse mt-4" />
  }

  return (
    <div className="mt-4">
      {dispute ? (
        // Already disputed — show status
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            Dispute
          </h3>
          <DisputeDisplay dispute={dispute} />
        </div>
      ) : showForm ? (
        // Show the form
        <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            Open a Dispute
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            Only open a dispute if the seller has not responded or delivered after a
            reasonable time. This will pause the order and notify our support team.
          </p>
          <DisputeForm orderId={orderId} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        // Show the trigger button
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-transparent border border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/5 text-orange-400 text-sm font-medium py-3 rounded-xl transition-all"
        >
          <AlertTriangle className="w-4 h-4" />
          Having a problem? Open a dispute
        </button>
      )}
    </div>
  )
}