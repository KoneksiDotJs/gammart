import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Users, ShoppingBag, AlertTriangle, FileText, CheckCircle, XCircle, Shield, Search, ChevronRight, Package, DollarSign,
} from 'lucide-react'
import {
    useAdminStats, useAdminOrders, useAdminUsers,
    useAdminApplications, useAdminDisputes,
    useApproveApplication, useRejectApplication,
    useResolveDispute, useSetUserVerified,
} from '../../hooks'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n)
const fmtIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const ORDER_STATUS_COLOR: Record<string, string> = {
    PENDING_PAYMENT: 'text-yellow-400 bg-yellow-400/10',
    PAID: 'text-blue-400   bg-blue-400/10',
    COMPLETED: 'text-brand-400  bg-brand-400/10',
    CANCELLED: 'text-red-400    bg-red-400/10',
    DISPUTED: 'text-orange-400 bg-orange-400/10',
    IN_PROGRESS: 'text-purple-400 bg-purple-400/10',
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({
    label, value, icon, color, alert,
}: { label: string; value: string | number; icon: React.ReactNode; color: string; alert?: boolean }) => (
    <div className={`bg-gray-900 border rounded-xl p-5 ${alert ? 'border-orange-500/40' : 'border-gray-800'}`}>
        <div className={`${color} mb-3`}>{icon}</div>
        <p className="text-white text-2xl font-bold">{value}</p>
        <p className="text-gray-400 text-sm mt-0.5">{label}</p>
        {alert && <p className="text-orange-400 text-xs mt-1">Needs attention</p>}
    </div>
)

// ─── Review note modal ────────────────────────────────────────────────────────

const ReviewNoteModal = ({
    title, action, onConfirm, onCancel, isPending,
}: {
    title: string; action: string; isPending: boolean
    onConfirm: (note: string) => void; onCancel: () => void
}) => {
    const [note, setNote] = useState('')
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-white font-semibold mb-3">{title}</h3>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Optional note for the applicant..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none resize-none mb-4"
                />
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(note)} disabled={isPending}
                        className={`flex-1 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors ${action === 'approve' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'
                            }`}>
                        {isPending ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'applications' | 'disputes' | 'users' | 'orders'

// ─── Main ─────────────────────────────────────────────────────────────────────

export const AdminPanel = () => {
    const [tab, setTab] = useState<Tab>('overview')
    const [userSearch, setUserSearch] = useState('')
    const [modal, setModal] = useState<{
        type: 'approve' | 'reject' | 'resolve'
        id: string
    } | null>(null)
    const [resolveText, setResolveText] = useState('')

    const { data: stats } = useAdminStats()
    const { data: orders } = useAdminOrders()
    const { data: applications } = useAdminApplications('PENDING')
    const { data: disputes } = useAdminDisputes()
    const { data: userData } = useAdminUsers({ search: userSearch || undefined })

    const approveApp = useApproveApplication()
    const rejectApp = useRejectApplication()
    const resolveDisp = useResolveDispute()
    const setVerified = useSetUserVerified()

    const TABS: { key: Tab; label: string; badge?: number }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'applications', label: 'Applications', badge: applications?.length },
        { key: 'disputes', label: 'Disputes', badge: disputes?.filter(d => !d.resolvedAt).length },
        { key: 'users', label: 'Users' },
        { key: 'orders', label: 'Orders' },
    ]

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Platform management and oversight</p>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit flex-wrap">
                    {TABS.map(({ key, label, badge }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            {label}
                            {badge !== undefined && badge > 0 && (
                                <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Overview ─────────────────────────────────────────────────────── */}
                {tab === 'overview' && stats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard label="Total Users" value={fmt(stats.totalUsers)} icon={<Users className="w-5 h-5" />} color="text-blue-400" />
                            <StatCard label="Active Sellers" value={fmt(stats.totalSellers)} icon={<Shield className="w-5 h-5" />} color="text-brand-400" />
                            <StatCard label="Active Listings" value={fmt(stats.totalProducts)} icon={<Package className="w-5 h-5" />} color="text-purple-400" />
                            <StatCard label="Total Revenue" value={fmtIDR(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="text-yellow-400" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard label="Total Orders" value={fmt(stats.totalOrders)} icon={<ShoppingBag className="w-5 h-5" />} color="text-gray-400" />
                            <StatCard label="Completed Orders" value={fmt(stats.completedOrders)} icon={<CheckCircle className="w-5 h-5" />} color="text-brand-400" />
                            <StatCard label="Pending Applications" value={stats.pendingApplications} icon={<FileText className="w-5 h-5" />} color="text-orange-400" alert={stats.pendingApplications > 0} />
                            <StatCard label="Open Disputes" value={stats.openDisputes} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-400" alert={stats.openDisputes > 0} />
                        </div>

                        {/* Quick actions */}
                        {(stats.pendingApplications > 0 || stats.openDisputes > 0) && (
                            <div className="flex gap-3 flex-wrap">
                                {stats.pendingApplications > 0 && (
                                    <button onClick={() => setTab('applications')}
                                        className="flex items-center gap-2 bg-orange-600/20 border border-orange-600/40 hover:border-orange-600/70 text-orange-400 text-sm px-4 py-2.5 rounded-lg transition-colors">
                                        <FileText className="w-4 h-4" />
                                        Review {stats.pendingApplications} application{stats.pendingApplications !== 1 ? 's' : ''}
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {stats.openDisputes > 0 && (
                                    <button onClick={() => setTab('disputes')}
                                        className="flex items-center gap-2 bg-red-600/20 border border-red-600/40 hover:border-red-600/70 text-red-400 text-sm px-4 py-2.5 rounded-lg transition-colors">
                                        <AlertTriangle className="w-4 h-4" />
                                        Resolve {stats.openDisputes} dispute{stats.openDisputes !== 1 ? 's' : ''}
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Applications ──────────────────────────────────────────────────── */}
                {tab === 'applications' && (
                    <div className="space-y-3">
                        {!applications || applications.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
                                <CheckCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-400">No pending applications</p>
                            </div>
                        ) : applications.map((app) => (
                            <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-semibold">{app.storeName}</p>
                                            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">PENDING</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            @{(app as any).user?.username || 'unknown'} · {fmtDate(app.createdAt)}
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2 max-w-xl leading-relaxed">{app.reason}</p>
                                        {app.experience && (
                                            <p className="text-gray-600 text-xs mt-1 italic">Experience: {app.experience}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setModal({ type: 'reject', id: app.id })}
                                            className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => setModal({ type: 'approve', id: app.id })}
                                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Disputes ──────────────────────────────────────────────────────── */}
                {tab === 'disputes' && (
                    <div className="space-y-3">
                        {!disputes || disputes.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
                                <CheckCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-400">No open disputes</p>
                            </div>
                        ) : disputes.map((d) => (
                            <div key={d.id} className={`bg-gray-900 border rounded-xl p-5 ${d.resolvedAt ? 'border-gray-800 opacity-60' : 'border-orange-500/30'}`}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-white font-semibold text-sm">{d.reason}</p>
                                            {d.resolvedAt
                                                ? <span className="text-xs text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full">Resolved</span>
                                                : <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Open</span>
                                            }
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            Order: <Link to={`/orders/${d.orderId}`} className="text-brand-500 hover:text-brand-400">
                                                {d.orderId.slice(0, 8)}…
                                            </Link>
                                            {' · '}
                                            Raised by @{d.raisedBy.username}
                                            {' · '}
                                            {fmtDate(d.createdAt)}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            Product: {d.order.product.title} ({d.order.product.game})
                                        </p>
                                        {d.details && (
                                            <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-xl">{d.details}</p>
                                        )}
                                        {d.resolvedAt && d.resolution && (
                                            <p className="text-brand-400 text-xs mt-2">Resolution: {d.resolution}</p>
                                        )}
                                    </div>
                                    {!d.resolvedAt && (
                                        <div>
                                            <button
                                                onClick={() => { setModal({ type: 'resolve', id: d.id }); setResolveText('') }}
                                                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Users ─────────────────────────────────────────────────────────── */}
                {tab === 'users' && (
                    <div>
                        <div className="flex gap-3 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search username, email..."
                                    className="w-full bg-gray-900 border border-gray-700 focus:border-brand-500 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-800">
                                    <tr className="text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="text-left px-5 py-3">User</th>
                                        <th className="text-left px-5 py-3 hidden sm:table-cell">Role</th>
                                        <th className="text-left px-5 py-3 hidden md:table-cell">Orders</th>
                                        <th className="text-left px-5 py-3 hidden md:table-cell">Joined</th>
                                        <th className="text-left px-5 py-3">Verified</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {userData?.users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <p className="text-white font-medium">{u.displayName || u.username}</p>
                                                <p className="text-gray-500 text-xs">@{u.username} · {u.email}</p>
                                            </td>
                                            <td className="px-5 py-3 hidden sm:table-cell">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'ADMIN' ? 'text-purple-400 bg-purple-400/10' :
                                                        u.role === 'SELLER' ? 'text-brand-400 bg-brand-400/10' :
                                                            'text-gray-400 bg-gray-700'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-3 hidden md:table-cell text-gray-400">{u._count.buyerOrders}</td>
                                            <td className="px-5 py-3 hidden md:table-cell text-gray-500 text-xs">{fmtDate(u.createdAt)}</td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => setVerified.mutate({ userId: u.id, isVerified: !u.isVerified })}
                                                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${u.isVerified
                                                            ? 'text-brand-400 bg-brand-400/10 hover:bg-brand-400/20'
                                                            : 'text-gray-500 bg-gray-800 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <Shield className="w-3 h-3" />
                                                    {u.isVerified ? 'Verified' : 'Unverified'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {userData?.total === 0 && (
                                <p className="text-gray-500 text-center py-8 text-sm">No users found</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Orders ────────────────────────────────────────────────────────── */}
                {tab === 'orders' && (
                    <div className="space-y-2">
                        {orders?.map((order) => (
                            <Link key={order.id} to={`/orders/${order.id}`}
                                className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium line-clamp-1">{order.product.title}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">
                                        {order.product.game} · Buyer: @{order.buyer.username} · Seller: @{order.product.seller.username}
                                        {' · '}{fmtDate(order.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <p className="text-white font-bold text-sm">{fmtIDR(Number(order.amount))}</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[order.status] ?? 'text-gray-400 bg-gray-700'}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ────────────────────────────────────────────────────────── */}
            {modal?.type === 'approve' && (
                <ReviewNoteModal
                    title="Approve Application"
                    action="approve"
                    isPending={approveApp.isPending}
                    onCancel={() => setModal(null)}
                    onConfirm={(note) => approveApp.mutate({ id: modal.id, reviewNote: note || undefined },
                        { onSuccess: () => setModal(null) })}
                />
            )}
            {modal?.type === 'reject' && (
                <ReviewNoteModal
                    title="Reject Application"
                    action="reject"
                    isPending={rejectApp.isPending}
                    onCancel={() => setModal(null)}
                    onConfirm={(note) => rejectApp.mutate({ id: modal.id, reviewNote: note || undefined },
                        { onSuccess: () => setModal(null) })}
                />
            )}
            {modal?.type === 'resolve' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-white font-semibold mb-3">Resolve Dispute</h3>
                        <textarea
                            value={resolveText}
                            onChange={(e) => setResolveText(e.target.value)}
                            rows={4}
                            placeholder="Describe the resolution (min 10 characters)..."
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => resolveDisp.mutate({ id: modal.id, resolution: resolveText },
                                    { onSuccess: () => setModal(null) })}
                                disabled={resolveDisp.isPending || resolveText.length < 10}
                                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                {resolveDisp.isPending ? 'Resolving...' : 'Resolve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}