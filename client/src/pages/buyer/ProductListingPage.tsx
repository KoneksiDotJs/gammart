import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { useProducts } from '../../hooks'
import { ProductCategory } from '../../types'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'GAME_ACCOUNT', label: 'Game Accounts' },
  { value: 'TOP_UP', label: 'Top Up' },
  { value: 'BOOSTING', label: 'Boosting' },
  { value: 'ITEM', label: 'Items' },
  { value: 'OTHER', label: 'Other' },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

export const ProductListingPage = () => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useProducts({
    search: search || undefined,
    category: category || undefined,
    page,
  })

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Browse Marketplace</h1>
          <p className="text-gray-400">Game accounts, top-ups, boosting services, and more</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search products, games..."
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === cat.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.data.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group bg-gray-900 border border-gray-800 hover:border-brand-500/50 rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
                >
                  {/* Image placeholder */}
                  <div className="h-36 bg-gray-800 flex items-center justify-center">
                    {product.imageUrls?.[0] ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-4xl">🎮</span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-brand-500 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full">
                        {product.game}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-brand-400 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500 font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      <Link
                        to={`/sellers/${product.seller.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                      >
                        @{product.seller.username}
                      </Link>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  {page} / {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {data?.data.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}