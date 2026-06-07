import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, X, ImageOff, ChevronRight, Tag, FileText, DollarSign, Gamepad2 } from 'lucide-react'
import { useCreateProduct } from '../../hooks'
import { ProductCategory } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ProductCategory; label: string; emoji: string; hint: string }[] = [
  { value: 'GAME_ACCOUNT', label: 'Game Account',     emoji: '🎮', hint: 'Full account with credentials' },
  { value: 'TOP_UP',       label: 'Top Up',           emoji: '💎', hint: 'In-game currency or credits' },
  { value: 'BOOSTING',     label: 'Boosting Service', emoji: '🚀', hint: 'Rank or level boost' },
  { value: 'ITEM',         label: 'In-game Item',     emoji: '⚔️',  hint: 'Skins, weapons, cosmetics' },
  { value: 'OTHER',        label: 'Other',            emoji: '📦', hint: 'Anything else' },
]

// Dynamic metadata fields per category
const METADATA_FIELDS: Record<ProductCategory, { key: string; label: string; placeholder: string }[]> = {
  GAME_ACCOUNT: [
    { key: 'rank',       label: 'Rank / Level',  placeholder: 'e.g. Mythic Glory' },
    { key: 'server',     label: 'Server',        placeholder: 'e.g. ID, Asia' },
    { key: 'skinCount',  label: 'Skin Count',    placeholder: 'e.g. 52' },
  ],
  TOP_UP: [
    { key: 'amount',       label: 'Amount',         placeholder: 'e.g. 1000 Diamonds' },
    { key: 'deliveryTime', label: 'Delivery Time',  placeholder: 'e.g. 15 minutes' },
  ],
  BOOSTING: [
    { key: 'fromRank', label: 'From Rank', placeholder: 'e.g. Grandmaster' },
    { key: 'toRank',   label: 'To Rank',   placeholder: 'e.g. Epic' },
    { key: 'eta',      label: 'ETA (Estimated Time of Arrival)',       placeholder: 'e.g. 3–5 days' },
  ],
  ITEM: [
    { key: 'itemType', label: 'Item Type', placeholder: 'e.g. Skin, Weapon' },
    { key: 'rarity',   label: 'Rarity',    placeholder: 'e.g. Legendary' },
  ],
  OTHER: [],
}

const POPULAR_GAMES = [
  'Mobile Legends', 'Free Fire', 'PUBG Mobile', 'Genshin Impact',
  'Valorant', 'League of Legends', 'Honkai: Star Rail', 'Clash of Clans',
]

const formatIDR = (value: string) => {
  const num = parseInt(value.replace(/\D/g, ''), 10)
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateListingPage = () => {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'GAME_ACCOUNT' as ProductCategory,
    game: '',
    price: '',
    imageUrls: [] as string[],
    metadata: {} as Record<string, string>,
  })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const [error, setError] = useState('')
  const [gameInputFocused, setGameInputFocused] = useState(false)

  // ── Helpers ─────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMetadataChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }))
  }

  const handleCategoryChange = (category: ProductCategory) => {
    // Reset metadata when category changes
    setForm((prev) => ({ ...prev, category, metadata: {} }))
  }

  const addImageUrl = () => {
    const url = imageUrlInput.trim()
    if (!url) return
    if (form.imageUrls.length >= 5) return
    if (form.imageUrls.includes(url)) return
    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }))
    setImageUrlInput('')
  }

  const removeImageUrl = (index: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }))
    setImageError((prev) => { const n = { ...prev }; delete n[index]; return n })
  }

  const rawPrice = parseInt(form.price.replace(/\D/g, ''), 10)
  const isStep1Valid = form.title.length >= 5 && form.game && form.category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Filter out empty metadata values
    const cleanMetadata = Object.fromEntries(
      Object.entries(form.metadata).filter(([, v]) => v.trim() !== '')
    )

    try {
      await createProduct.mutateAsync({
        title: form.title,
        description: form.description,
        category: form.category,
        game: form.game,
        price: rawPrice,
        imageUrls: form.imageUrls,
        metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
      })
      navigate('/seller/dashboard')
    } catch (err: any) {
      const apiError = err.response?.data
      if (apiError?.errors) {
        setError(apiError.errors.map((e: any) => e.message).join(' · '))
      } else {
        setError(apiError?.message || 'Failed to create listing')
      }
    }
  }

  const metadataFields = METADATA_FIELDS[form.category]
  const selectedCategory = CATEGORIES.find((c) => c.value === form.category)!

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold mb-1">Create New Listing</h1>
          <p className="text-gray-400 text-sm">Fill in your product details to start selling</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { n: 1, label: 'Product Info' },
            { n: 2, label: 'Details & Pricing' },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === n ? 'bg-brand-600 text-white' :
                  step > n  ? 'bg-brand-600/30 text-brand-400' :
                               'bg-gray-800 text-gray-500'
                }`}>
                  {n}
                </div>
                <span className={`text-sm font-medium ${step === n ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-700" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main Form ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>

              {/* Step 1: Basic info */}
              {step === 1 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">

                  {/* Category picker */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      <Tag className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                      Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => handleCategoryChange(cat.value)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                            form.category === cat.value
                              ? 'border-brand-500 bg-brand-500/10'
                              : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                          }`}
                        >
                          <span className="text-lg leading-none mt-0.5">{cat.emoji}</span>
                          <div>
                            <p className={`text-xs font-semibold ${form.category === cat.value ? 'text-brand-400' : 'text-white'}`}>
                              {cat.label}
                            </p>
                            <p className="text-gray-500 text-xs leading-tight mt-0.5">{cat.hint}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game */}
                  <div className="relative">
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                      Game
                    </label>
                    <input
                      name="game"
                      value={form.game}
                      onChange={handleChange}
                      onFocus={() => setGameInputFocused(true)}
                      onBlur={() => setTimeout(() => setGameInputFocused(false), 150)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. Mobile Legends"
                      required
                    />
                    {/* Popular games dropdown */}
                    {gameInputFocused && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                        {POPULAR_GAMES.filter(
                          (g) => g.toLowerCase().includes(form.game.toLowerCase()) && g !== form.game
                        ).slice(0, 5).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onMouseDown={() => setForm((prev) => ({ ...prev, game: g }))}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      <FileText className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                      Listing Title
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. Mobile Legends Account – Mythic Glory | 50+ Skins"
                      maxLength={100}
                      required
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-gray-600 text-xs">Be specific — good titles get more views</p>
                      <p className={`text-xs ${form.title.length > 90 ? 'text-yellow-500' : 'text-gray-600'}`}>
                        {form.title.length}/100
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                    >
                      Next: Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Details + pricing */}
              {step === 2 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                      Price (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                      <input
                        name="price"
                        type="text"
                        inputMode="numeric"
                        value={form.price ? formatIDR(form.price) : ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value.replace(/\D/g, '') }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="150.000"
                        required
                      />
                    </div>
                    {rawPrice > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        ≈ USD {(rawPrice / 15500).toFixed(2)} · USDT {(rawPrice / 15500).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={6}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
                      placeholder={
                        form.category === 'GAME_ACCOUNT'
                          ? 'Describe the account — rank, server, heroes/characters, included skins, account safety, delivery method...'
                          : form.category === 'TOP_UP'
                          ? 'Describe what the buyer needs to send you, how fast you deliver, and any limitations...'
                          : form.category === 'BOOSTING'
                          ? 'Describe the service — from/to rank, heroes used, estimated time, safety guarantees...'
                          : 'Describe your product in detail...'
                      }
                      minLength={20}
                      maxLength={2000}
                      required
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-gray-600 text-xs">Min 20 characters</p>
                      <p className={`text-xs ${form.description.length > 1800 ? 'text-yellow-500' : 'text-gray-600'}`}>
                        {form.description.length}/2000
                      </p>
                    </div>
                  </div>

                  {/* Dynamic metadata fields */}
                  {metadataFields.length > 0 && (
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Product Details <span className="text-gray-500 font-normal">(optional but recommended)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {metadataFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-gray-400 text-xs mb-1">{field.label}</label>
                            <input
                              value={form.metadata[field.key] || ''}
                              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image URLs */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Product Images <span className="text-gray-500 font-normal">(up to 5)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="Paste image URL (imgur, imgbb, etc.)"
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        disabled={form.imageUrls.length >= 5 || !imageUrlInput.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" /> Add
                      </button>
                    </div>

                    {form.imageUrls.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {form.imageUrls.map((url, i) => (
                          <div key={i} className="relative group aspect-square">
                            {imageError[i] ? (
                              <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                                <ImageOff className="w-5 h-5 text-gray-600" />
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`Preview ${i + 1}`}
                                className="w-full h-full object-cover rounded-lg border border-gray-700"
                                onError={() => setImageError((prev) => ({ ...prev, [i]: true }))}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeImageUrl(i)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={createProduct.isPending || !form.description || !form.price}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {createProduct.isPending ? 'Publishing...' : 'Publish Listing'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Preview Card ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Preview</p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Image */}
                <div className="h-32 bg-gray-800 flex items-center justify-center">
                  {form.imageUrls[0] && !imageError[0] ? (
                    <img
                      src={form.imageUrls[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImageError((prev) => ({ ...prev, 0: true }))}
                    />
                  ) : (
                    <span className="text-5xl">{selectedCategory.emoji}</span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full font-medium">
                      {form.game || 'Game name'}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                      {selectedCategory.label}
                    </span>
                  </div>

                  <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">
                    {form.title || <span className="text-gray-600">Your listing title</span>}
                  </h3>

                  {form.description && (
                    <p className="text-gray-500 text-xs line-clamp-2">{form.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-brand-500 font-bold text-sm">
                      {rawPrice > 0
                        ? `Rp ${new Intl.NumberFormat('id-ID').format(rawPrice)}`
                        : <span className="text-gray-600">Set price</span>
                      }
                    </span>
                  </div>

                  {/* Metadata preview */}
                  {Object.entries(form.metadata).filter(([, v]) => v).length > 0 && (
                    <div className="pt-2 border-t border-gray-800 space-y-1">
                      {Object.entries(form.metadata).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-gray-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-xs text-center mt-3">
                This is how buyers will see your listing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}