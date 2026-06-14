import { Link } from 'react-router-dom'
import { ShoppingBag, Shield, MessageCircle, Mail } from 'lucide-react'

const LINKS = {
  Marketplace: [
    { label: 'Browse All',      to: '/products' },
    { label: 'Game Accounts',   to: '/products?category=GAME_ACCOUNT' },
    { label: 'Top Up',          to: '/products?category=TOP_UP' },
    { label: 'Boosting',        to: '/products?category=BOOSTING' },
    { label: 'In-game Items',   to: '/products?category=ITEM' },
  ],
  Selling: [
    { label: 'Start Selling',   to: '/seller/onboarding' },
    { label: 'Seller Dashboard',to: '/seller/dashboard' },
    { label: 'Create Listing',  to: '/seller/listings/new' },
  ],
  Account: [
    { label: 'My Orders',       to: '/orders' },
    { label: 'Profile Settings',to: '/profile' },
    { label: 'Login',           to: '/login' },
    { label: 'Register',        to: '/register' },
  ],
  Support: [
    { label: 'Contact Us',      href: 'mailto:support@gammart.id' },
    { label: 'Report Issue',    href: 'mailto:support@gammart.id' },
  ],
}

const TRUST_BADGES = [
  { icon: <Shield className="w-4 h-4" />,         label: 'Buyer Protection' },
  { icon: <MessageCircle className="w-4 h-4" />,  label: 'Dispute Resolution' },
  { icon: <Mail className="w-4 h-4" />,           label: 'Email Support' },
]

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-16">

      {/* Trust bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {TRUST_BADGES.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-brand-500">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-brand-500" />
              <span className="text-white font-bold">Gammart</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Indonesia's trusted marketplace for game accounts, top-ups, and boosting services.
            </p>
            <a
              href="mailto:support@gammart.id"
              className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-400 text-sm mt-4 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              support@gammart.id
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-white text-sm font-semibold mb-3">{section}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link
                        to={link.to}
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-gray-600 text-xs">
            © {year} Gammart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-xs">Privacy Policy</span>
            <span className="text-gray-700 text-xs">Terms of Service</span>
            <span className="text-gray-700 text-xs">Cookie Policy</span>
          </div>
        </div>
      </div>

    </footer>
  )
}