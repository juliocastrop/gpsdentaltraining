import { useState } from 'react';
import AdminShell from './AdminShell';
import StatCard from './StatCard';
import DataTable from './DataTable';

interface AbandonedCart {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  cart_total: number;
  item_count: number;
  status: 'abandoned' | 'notified' | 'recovered' | 'expired' | 'converted';
  emails_sent: number;
  created_at: string;
  abandoned_at: string;
  recovered_at: string | null;
  cart_contents: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface CartRecoveryStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  abandonedValue: number;
  recoveredValue: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

interface CartRecoveryDashboardProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  carts: AbandonedCart[];
  stats: CartRecoveryStats;
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusBadge(status: AbandonedCart['status']) {
  const styles: Record<string, string> = {
    abandoned: 'bg-red-100 text-red-700',
    notified: 'bg-yellow-100 text-yellow-700',
    recovered: 'bg-green-100 text-green-700',
    converted: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function CartRecoveryDashboard({
  currentPath,
  user,
  carts,
  stats,
  loading = false,
}: CartRecoveryDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'abandoned' | 'notified' | 'recovered'>('all');
  const [search, setSearch] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const filteredCarts = carts.filter((cart) => {
    const matchesFilter = filter === 'all' || cart.status === filter;
    const matchesSearch =
      cart.email.toLowerCase().includes(search.toLowerCase()) ||
      (cart.first_name && cart.first_name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (cart: AbandonedCart) => (
        <div>
          <p className="font-medium text-[#0C2044]">
            {cart.first_name && cart.last_name
              ? `${cart.first_name} ${cart.last_name}`
              : cart.email.split('@')[0]}
          </p>
          <p className="text-sm text-gray-500">{cart.email}</p>
        </div>
      ),
    },
    {
      key: 'cart',
      header: 'Cart',
      render: (cart: AbandonedCart) => (
        <div>
          <p className="font-medium text-[#0C2044]">{formatCurrency(cart.cart_total)}</p>
          <p className="text-sm text-gray-500">{cart.item_count} item{cart.item_count !== 1 ? 's' : ''}</p>
        </div>
      ),
    },
    {
      key: 'abandoned',
      header: 'Abandoned',
      render: (cart: AbandonedCart) => (
        <div>
          <p className="text-sm text-[#0C2044]">{getTimeAgo(cart.abandoned_at)}</p>
          <p className="text-xs text-gray-500">{formatDate(cart.abandoned_at)}</p>
        </div>
      ),
    },
    {
      key: 'emails',
      header: 'Emails',
      render: (cart: AbandonedCart) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                num <= cart.emails_sent
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (cart: AbandonedCart) => getStatusBadge(cart.status),
    },
    {
      key: 'actions',
      header: '',
      render: (cart: AbandonedCart) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCart(cart);
            }}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {cart.status === 'abandoned' && (
            <button
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Send Email"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="Cart Recovery"
      subtitle="Recover abandoned carts and boost conversions"
      currentPath={currentPath}
      user={user}
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/admin/cart-recovery/templates"
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Email Templates
          </a>
          <a
            href="/admin/cart-recovery/settings"
            className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm"
          >
            Settings
          </a>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Abandoned Carts"
          value={stats.totalAbandoned}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBgColor="bg-red-100"
        />
        <StatCard
          title="Recovered"
          value={stats.totalRecovered}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Recovery Rate"
          value={`${stats.recoveryRate.toFixed(1)}%`}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Recovered Value"
          value={formatCurrency(stats.recoveredValue)}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Email Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#0C2044] mb-4">Email Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#0C2044]">{stats.emailsSent}</p>
            <p className="text-sm text-gray-500">Emails Sent</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#0C2044]">{stats.emailsOpened}</p>
            <p className="text-sm text-gray-500">
              Opened ({stats.emailsSent > 0 ? ((stats.emailsOpened / stats.emailsSent) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#0C2044]">{stats.emailsClicked}</p>
            <p className="text-sm text-gray-500">
              Clicked ({stats.emailsSent > 0 ? ((stats.emailsClicked / stats.emailsSent) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-[#0B52AC] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('abandoned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'abandoned' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abandoned
            </button>
            <button
              onClick={() => setFilter('notified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'notified' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Notified
            </button>
            <button
              onClick={() => setFilter('recovered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'recovered' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recovered
            </button>
          </div>
        </div>
      </div>

      {/* Carts Table */}
      <DataTable
        columns={columns}
        data={filteredCarts}
        keyExtractor={(cart) => cart.id}
        onRowClick={(cart) => setSelectedCart(cart)}
        emptyMessage="No abandoned carts found"
        loading={loading}
      />

      {/* Cart Detail Modal */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#0C2044]">Cart Details</h3>
                <button
                  onClick={() => setSelectedCart(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Customer</h4>
                <p className="font-medium text-[#0C2044]">
                  {selectedCart.first_name && selectedCart.last_name
                    ? `${selectedCart.first_name} ${selectedCart.last_name}`
                    : 'Unknown'}
                </p>
                <p className="text-gray-600">{selectedCart.email}</p>
              </div>

              {/* Cart Items */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Cart Items</h4>
                <div className="space-y-2">
                  {selectedCart.cart_contents.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-[#0C2044]">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="font-semibold text-[#0C2044]">Total</span>
                  <span className="text-xl font-bold text-[#0C2044]">
                    {formatCurrency(selectedCart.cart_total)}
                  </span>
                </div>
              </div>

              {/* Status & Timeline */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Status</h4>
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(selectedCart.status)}
                  <span className="text-sm text-gray-500">
                    Abandoned {getTimeAgo(selectedCart.abandoned_at)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Emails sent: {selectedCart.emails_sent} / 3</p>
                  {selectedCart.recovered_at && (
                    <p className="text-green-600">Recovered: {formatDate(selectedCart.recovered_at)}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedCart.status === 'abandoned' && (
                  <button className="flex-1 px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors">
                    Send Recovery Email
                  </button>
                )}
                <button
                  onClick={() => setSelectedCart(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
