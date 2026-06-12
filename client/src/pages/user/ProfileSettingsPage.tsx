import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Lock, ShieldCheck, ExternalLink,
  Save, Eye, EyeOff, CheckCircle,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useUpdateProfile, useUpdatePassword } from '../../hooks'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

const SuccessToast = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 bg-brand-600/20 border border-brand-600/30 text-brand-400 text-sm px-4 py-3 rounded-lg">
    <CheckCircle className="w-4 h-4 flex-shrink-0" />
    {message}
  </div>
)

// ─── Profile form ─────────────────────────────────────────────────────────────

const ProfileForm = () => {
  const { user } = useAuthStore()
  const updateProfile = useUpdateProfile()

  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio:         user?.bio         || '',
    avatarUrl:   user?.avatarUrl   || '',
  })
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setForm({
      displayName: user?.displayName || '',
      bio:         user?.bio         || '',
      avatarUrl:   user?.avatarUrl   || '',
    })
    setImgError(false)
  }, [user?.id])

  const isDirty =
    form.displayName !== (user?.displayName || '') ||
    form.bio         !== (user?.bio         || '') ||
    form.avatarUrl   !== (user?.avatarUrl   || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    try {
      await updateProfile.mutateAsync({
        displayName: form.displayName || undefined,
        bio:         form.bio         || undefined,
        avatarUrl:   form.avatarUrl   || undefined,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      const apiError = err.response?.data
      setError(apiError?.errors?.map((e: any) => e.message).join(' · ') ?? apiError?.message ?? 'Failed to update profile')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && <SuccessToast message="Profile updated successfully" />}
      {error   && <p className="text-red-400 text-sm">{error}</p>}

      {/* Avatar */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
            {form.avatarUrl && !imgError ? (
              <img
                src={form.avatarUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              (user?.displayName?.[0] || user?.username?.[0] || '?').toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => { setForm((p) => ({ ...p, avatarUrl: e.target.value })); setImgError(false) }}
              placeholder="https://i.imgur.com/your-image.jpg"
              className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1">
              Paste a direct image URL.{' '}
              <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400 inline-flex items-center gap-0.5">
                imgur.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              or{' '}
              <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400 inline-flex items-center gap-0.5">
                imgbb.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              host images for free.
            </p>
          </div>
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">Display Name</label>
        <input
          type="text"
          value={form.displayName}
          onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
          maxLength={50}
          placeholder="Your public name"
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Bio <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          rows={3}
          maxLength={300}
          placeholder="Tell buyers about yourself — trusted seller since 2023, specialises in MLBB accounts..."
          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${form.bio.length > 270 ? 'text-yellow-500' : 'text-gray-600'}`}>
            {form.bio.length}/300
          </span>
        </div>
      </div>

      {/* Read-only fields */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Username', value: `@${user?.username}` },
          { label: 'Email',    value: user?.email || '' },
        ].map(({ label, value }) => (
          <div key={label}>
            <label className="block text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">
              {label} <span className="normal-case text-gray-600">(unchangeable)</span>
            </label>
            <div className="bg-gray-800/50 border border-gray-700/50 text-gray-500 rounded-lg px-4 py-2.5 text-sm truncate">
              {value}
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={updateProfile.isPending || !isDirty}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// ─── Password form ────────────────────────────────────────────────────────────

const PasswordForm = () => {
  const updatePassword = useUpdatePassword()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')

  const passwordsMatch = form.newPassword === form.confirmPassword
  const newIsValid     = form.newPassword.length >= 8
                      && /[A-Z]/.test(form.newPassword)
                      && /[0-9]/.test(form.newPassword)
  const canSubmit      = !!form.currentPassword && newIsValid && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) { setError('New passwords do not match'); return }
    setError('')
    setSuccess(false)
    try {
      await updatePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password')
    }
  }

  const checks = [
    { label: '8+ characters', pass: form.newPassword.length >= 8 },
    { label: 'Uppercase',     pass: /[A-Z]/.test(form.newPassword) },
    { label: 'Number',        pass: /[0-9]/.test(form.newPassword) },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <SuccessToast message="Password updated successfully" />}
      {error   && <p className="text-red-400 text-sm">{error}</p>}

      {/* Current password */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 pr-10 py-2.5 text-sm outline-none transition-colors"
            placeholder="Enter current password"
          />
          <button type="button" onClick={() => setShowCurrent((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg px-4 pr-10 py-2.5 text-sm outline-none transition-colors"
            placeholder="Enter new password"
          />
          <button type="button" onClick={() => setShowNew((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.newPassword && (
          <div className="flex gap-4 mt-2">
            {checks.map(({ label, pass }) => (
              <span key={label} className={`text-xs flex items-center gap-1 ${pass ? 'text-brand-400' : 'text-gray-600'}`}>
                {pass ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          className={`w-full bg-gray-800 border focus:border-brand-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${
            form.confirmPassword && !passwordsMatch ? 'border-red-500/60' : 'border-gray-700'
          }`}
          placeholder="Repeat new password"
        />
        {form.confirmPassword && !passwordsMatch && (
          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={updatePassword.isPending || !canSubmit}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        <Lock className="w-4 h-4" />
        {updatePassword.isPending ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'profile' | 'password'

export const ProfileSettingsPage = () => {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('profile')

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',  label: 'Profile',  icon: <User className="w-4 h-4" /> },
    { key: 'password', label: 'Password', icon: <Lock className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Account Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
          </div>
          {user?.role === 'SELLER' && (
            <Link
              to={`/sellers/${user.username}`}
              className="flex items-center gap-1.5 text-brand-500 hover:text-brand-400 text-sm transition-colors"
            >
              View public profile <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Account summary card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : (user?.displayName?.[0] || user?.username?.[0] || '?').toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold">{user?.displayName || user?.username}</p>
              {user?.isVerified && (
                <span className="flex items-center gap-1 text-xs text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full border border-brand-400/20">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full ml-auto">
                {user?.role}
              </span>
            </div>
            <p className="text-gray-500 text-sm">@{user?.username}</p>
            <p className="text-gray-600 text-xs truncate">{user?.email}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Form panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {tab === 'profile'  && <ProfileForm />}
          {tab === 'password' && <PasswordForm />}
        </div>

      </div>
    </div>
  )
}