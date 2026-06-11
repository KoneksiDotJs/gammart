import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react'
import { useProducts } from '../../hooks'
import { ProductCategory } from '../../types'
import { SortBy } from '../../services/product.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)

const CATEGORIES: { value: ProductCategory | ''; label: string; emoji: string }[] = [
  { value: '',             label: 'All',          emoji: '🎮' },
  { value: 'GAME_ACCOUNT', label: 'Accounts',     emoji: '👤' },
  { value: 'TOP_UP',       label: 'Top Up',       emoji: '💎' },
  { value: 'BOOSTING',     label: 'Boosting',     emoji: '🚀' },
  { value: 'ITEM',         label: 'Items',        emoji: '⚔️' },
  { value: 'OTHER',        label: 'Other',        emoji: '📦' },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
]

// Preset price ranges in IDR
const PRICE_PRESETS = [
  { label: 'Any',                min: undefined, max: undefined },
  { label: '< Rp 50k',          min: undefined, max: 50000 },
  { label: 'Rp 50k – 200k',     min: 50000,     max: 200000 },
  { label: 'Rp 200k – 500k',    min: 200000,    max: 500000 },
  { label: 'Rp 500k – 1jt',     min: 500000,    max: 1000000 },
  { label: '> Rp 1jt',          min: 1000000,   max: undefined },
]

// ─── Debounce hook ────────────────────────────────────────────────────────────

const useDebounce = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────

const SortDropdown = ({
  value, onChange,
}: { value: SortBy; onChange: (v: SortBy) => void }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = SORT_OPTIONS.find((o) => o.value === value)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
        {current.label}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const ProductListingPage = () => {
  const [searchInput, setSearchInput] = useState('')
  const [category,    setCategory]    = useState<ProductCategory | ''>('')
  const [sortBy,      setSortBy]      = useState<SortBy>('newest')
  const [pricePreset, setPricePreset] = useState(0)   // index into PRICE_PRESETS
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [showFilters,   setShowFilters]   = useState(false)
  const [page, setPage] = useState(1)

  const search = useDebounce(searchInput, 400)

  // Resolve price from preset or manual input
  const selectedPreset = PRICE_PRESETS[pricePreset]
  const minPrice = pricePreset === 0
    ? (minPriceInput ? parseInt(minPriceInput.replace(/\D/g, '')) : undefined)
    : selectedPreset.min
  const maxPrice = pricePreset === 0
    ? (maxPriceInput ? parseInt(maxPriceInput.replace(/\D/g, '')) : undefined)
    : selectedPreset.max

  const { data, isLoading, isFetching } = useProducts({
    search:   search   || undefined,
    category: category || undefined,
    sortBy,
    minPrice,
    maxPrice,
    page,
  })

  // Reset to page 1 whenever filters change
  const resetPage = () => setPage(1)

  const activeFilterCount = [
    category !== '',
    pricePreset !== 0 || !!minPriceInput || !!maxPriceInput,
    sortBy !== 'newest',
  ].filter(Boolean).length

  const clearAll = () => {
    setCategory('')
    setSortBy('newest')
    setPricePreset(0)
    setMinPriceInput('')
    setMaxPriceInput('')
    setSearchInput('')
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Browse Marketplace</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data ? `${data.pagination.total.toLocaleString()} listings` : 'Loading...'}
            {isFetching && !isLoading && (
              <span className="ml-2 text-gray-600">· updating...</span>
            )}
          </p>
        </div>

        {/* Search bar + controls row */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); resetPage() }}
              placeholder="Search games, accounts, services..."
              className="w-full bg-gray-900 border border-gray-700 focus:border-brand-500 text-white rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); resetPage() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <SortDropdown value={sortBy} onChange={(v) => { setSortBy(v); resetPage() }} />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); resetPage() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                category === cat.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-medium text-sm">Price Range</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Price presets */}
            <div className="flex gap-2 flex-wrap mb-4">
              {PRICE_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPricePreset(i)
                    setMinPriceInput('')
                    setMaxPriceInput('')
                    resetPage()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pricePreset === i && !minPriceInput && !maxPriceInput
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Manual price range */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minPriceInput
                    ? new Intl.NumberFormat('id-ID').format(parseInt(minPriceInput.replace(/\D/g, '') || '0'))
                    : ''}
                  onChange={(e) => {
                    setMinPriceInput(e.target.value.replace(/\D/g, ''))
                    setPricePreset(0)
                    resetPage()
                  }}
                  placeholder="Min price"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                />
              </div>
              <span className="text-gray-600 text-sm">–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxPriceInput
                    ? new Intl.NumberFormat('id-ID').format(parseInt(maxPriceInput.replace(/\D/g, '') || '0'))
                    : ''}
                  onChange={(e) => {
                    setMaxPriceInput(e.target.value.replace(/\D/g, ''))
                    setPricePreset(0)
                    resetPage()
                  }}
                  placeholder="Max price"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-gray-600 text-xs">Active:</span>
            {category && (
              <span className="flex items-center gap-1 bg-brand-600/20 text-brand-400 border border-brand-600/30 text-xs px-2 py-1 rounded-full">
                {CATEGORIES.find((c) => c.value === category)?.label}
                <button onClick={() => { setCategory(''); resetPage() }}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {(pricePreset !== 0 || minPriceInput || maxPriceInput) && (
              <span className="flex items-center gap-1 bg-brand-600/20 text-brand-400 border border-brand-600/30 text-xs px-2 py-1 rounded-full">
                {pricePreset !== 0
                  ? PRICE_PRESETS[pricePreset].label
                  : `Rp ${minPriceInput || '0'} – ${maxPriceInput || '∞'}`}
                <button onClick={() => { setPricePreset(0); setMinPriceInput(''); setMaxPriceInput(''); resetPage() }}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="flex items-center gap-1 bg-brand-600/20 text-brand-400 border border-brand-600/30 text-xs px-2 py-1 rounded-full">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <button onClick={() => { setSortBy('newest'); resetPage() }}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-600 text-sm mt-1 mb-4">Try adjusting your search or filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="text-brand-500 hover:text-brand-400 text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {data?.data.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group bg-gray-900 border border-gray-800 hover:border-brand-500/50 rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
                >
                  <div className="h-36 bg-gray-800 flex items-center justify-center overflow-hidden">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 text-4xl">🎮</span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-brand-500 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {product.game}
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full hidden sm:block">
                        {CATEGORIES.find((c) => c.value === product.category)?.emoji}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-brand-400 transition-colors leading-snug">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500 font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      <Link
                        to={`/sellers/${product.seller.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-600 hover:text-gray-400 text-xs transition-colors truncate max-w-[80px]"
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
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:border-gray-700 transition-colors"
                >
                  ← Previous
                </button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(data.pagination.totalPages, 5) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                          p === page
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  {data.pagination.totalPages > 5 && (
                    <span className="w-9 h-9 flex items-center justify-center text-gray-600 text-sm">…</span>
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, data.pagination.totalPages))}
                  disabled={page >= data.pagination.totalPages}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:border-gray-700 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}