import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, TrendingUp, Shield, Clock,
  CheckCircle, XCircle, ChevronRight, Layers,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useMyApplication, useApply } from '../../hooks'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERKS = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'List Unlimited Products',
    desc: 'Create listings for game accounts, top-ups, boosting services, and items.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Seller Dashboard',
    desc: 'Track your orders, revenue, and listings from a dedicated dashboard.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Protected Transactions',
    desc: 'All orders go through our escrow — you get paid once delivery is confirmed.',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Build Your Reputation',
    desc: 'Collect reviews from buyers to build trust and increase your sales.',
  },
]

const STEPS = [
  { n: 1, label: 'Submit application',  desc: 'Fill in your store name and tell us about yourself.' },
  { n: 2, label: 'Review (1–2 days)',   desc: 'Our team reviews your application.' },
  { n: 3, label: 'Start selling',       desc: 'Once approved, your account is upgraded immediately.' },
]

// ─── Status card — shown when application already exists ──────────────────────

const ApplicationStatus = ({
  application,
}: {
  application: NonNullable<ReturnType<typeof useMyApplication>['data']>
}) => {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  const STATUS = {
    PENDING: {
      icon: <Clock className="w-6 h-6 text-yellow-400" />,
      title: 'Application Under Review',
      desc: 'Your application has been received and is being reviewed by our team. This typically takes 1–2 business days.',
      color: 'border-yellow-500/30 bg-yellow-500/5',
      badge: 'text-yellow-400 bg-yellow-400/10',
    },
    APPROVED: {
      icon: <CheckCircle className="w-6 h-6 text-brand-400" />,
      title: 'Application Approved!',
      desc: 'Congratulations — your account has been upgraded to Seller. You can now create listings.',
      color: 'border-brand-500/30 bg-brand-500/5',
      badge: 'text-brand-400 bg-brand-400/10',
    },
    REJECTED: {
      icon: <XCircle className="w-6 h-6 text-red-400" />,
      title: 'Application Not Approved',
      desc: 'Unfortunately your application was not approved this time. You can submit a new application below.',
      color: 'border-red-500/30 bg-red-500/5',
      badge: 'text-red-400 bg-red-400/10',
    },
  }

  const cfg = STATUS[application.status]

  return (
    <div className={`rounded-2xl border p-6 ${cfg.color}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5">{cfg.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-white font-semibold">{cfg.title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {application.status}
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">{cfg.desc}</p>

          {/* Application details */}
          <div className="bg-gray-900/60 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-gray-500 w-28 flex-shrink-0">Store name</span>
              <span className="text-white font-medium">{application.storeName}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-500 w-28 flex-shrink-0">Submitted</span>
              <span className="text-gray-300">{formatDate(application.createdAt)}</span>
            </div>
            {application.reviewedAt && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-28 flex-shrink-0">Reviewed</span>
                <span className="text-gray-300">{formatDate(application.reviewedAt)}</span>
              </div>
            )}
            {application.reviewNote && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-28 flex-shrink-0">Admin note</span>
                <span className="text-gray-300 italic">"{application.reviewNote}"</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {application.status === 'APPROVED' && (
            <div className="flex gap-3 mt-4">
              <Link
                to="/seller/listings/new"
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" /> Create first listing
              </Link>
              <Link
                to="/seller/dashboard"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Application form ─────────────────────────────────────────────────────────

const ApplicationForm = () => {
  const apply = useApply()
  const [form, setForm] = useState({
    storeName:  '',
    reason:     '',
    experience: '',
  })
  const [error, setError] = useState('')

  const isValid = form.storeName.length >= 3 && form.reason.length >= 30

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await apply.mutateAsync({
        storeName:  form.storeName,
        reason:     form.reason,
        experience: form.experience || undefined,
      })
    } catch (err: any) {
      const apiError = err.response?.data
      setError(apiError?.errors?.map((e: any) => e.message).join(' · ') ?? apiError?.message ?? 'Failed to submit')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-white font-semibold mb-1">Your Application</h3>
        <p className="text-gray-500 text-sm">This takes about 2 minutes to complete.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Store name */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Store / Brand Name
        </label>
        <input
          type="text"
          value={form.storeName}
          onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
          maxLength={60}
          placeholder="e.g. ProGamer Store"
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          required
        />
        <p className="text-gray-600 text-xs mt-1">This will be visible on your seller profile.</p>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Why do you want to sell on GameMarket?
        </label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          rows={4}
          maxLength={1000}
          placeholder="Tell us what you plan to sell, why buyers should trust you, and how you'll ensure good service..."
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
          required
        />
        <div className="flex justify-between mt-1">
          {form.reason.length < 30 && form.reason.length > 0 ? (
            <p className="text-orange-400 text-xs">{30 - form.reason.length} more characters needed</p>
          ) : <span />}
          <span className={`text-xs ml-auto ${form.reason.length > 900 ? 'text-yellow-500' : 'text-gray-600'}`}>
            {form.reason.length}/1000
          </span>
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Previous selling experience{' '}
          <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.experience}
          onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
          rows={3}
          maxLength={500}
          placeholder="e.g. I've sold 200+ accounts on Itemku with 5-star ratings, or first-time seller looking to start..."
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={apply.isPending || !isValid}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {apply.isPending ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const SellerOnboardingPage = () => {
  const { user } = useAuthStore()
  const { data: application, isLoading } = useMyApplication()

  // Already a seller — redirect them
  if (user?.role === 'SELLER') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-brand-400 mx-auto mb-3" />
          <p className="text-white text-xl font-bold mb-1">You're already a seller!</p>
          <p className="text-gray-400 text-sm mb-5">Head to your dashboard to manage listings and orders.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/seller/dashboard"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Go to Dashboard
            </Link>
            <Link to="/seller/listings/new"
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Create Listing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-600/30 text-brand-400 text-sm px-4 py-1.5 rounded-full mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> Start earning on GameMarket
          </div>
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-3">
            Become a Seller
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of trusted sellers offering game accounts, top-ups, and services to buyers across Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left — perks + steps */}
          <div className="space-y-6">

            {/* Perks */}
            <div>
              <h2 className="text-white font-semibold mb-4">Why sell on GameMarket?</h2>
              <div className="space-y-3">
                {PERKS.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-brand-400 mt-0.5 flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-white text-sm font-medium">{title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div>
              <h2 className="text-white font-semibold mb-4">How it works</h2>
              <div className="space-y-3">
                {STEPS.map(({ n, label, desc }, i) => (
                  <div key={n} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {n}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="w-px h-6 bg-gray-800 mt-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form or status */}
          <div>
            {isLoading ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl h-64 animate-pulse" />
            ) : application ? (
              <ApplicationStatus application={application} />
            ) : (
              <ApplicationForm />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
