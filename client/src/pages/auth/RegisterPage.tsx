import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { ShoppingBag } from 'lucide-react'

export const RegisterPage = () => {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
  })
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await register(form)
      navigate('/')
    } catch (err: any) {
      const apiError = err.response?.data
      if (apiError?.errors) {
        setError(apiError.errors.map((e: any) => e.message).join(', '))
      } else {
        setError(apiError?.message || 'Registration failed')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShoppingBag className="w-8 h-8 text-brand-500" />
          <span className="text-white font-bold text-2xl">GameMarket</span>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h1 className="text-white text-2xl font-bold mb-1">Create account</h1>
          <p className="text-gray-400 text-sm mb-6">Join the marketplace</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Display Name</label>
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="your_username"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}