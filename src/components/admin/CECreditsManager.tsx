import { useState } from 'react';
import AdminShell from './AdminShell';
import DataTable from './DataTable';
import StatCard from './StatCard';

interface CreditEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  event_id: string | null;
  event_title: string | null;
  credits: number;
  source: string;
  transaction_type: 'earned' | 'adjustment' | 'revoked';
  notes: string | null;
  awarded_at: string;
}

interface UserCredits {
  user_id: string;
  user_name: string;
  user_email: string;
  total_credits: number;
  events_attended: number;
  last_credit_date: string;
}

interface CECreditsManagerProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  creditEntries: CreditEntry[];
  userCredits: UserCredits[];
  stats: {
    totalCreditsAwarded: number;
    totalUsers: number;
    averageCreditsPerUser: number;
    creditsThisMonth: number;
  };
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTransactionBadge(type: CreditEntry['transaction_type']) {
  switch (type) {
    case 'earned':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Earned
        </span>
      );
    case 'adjustment':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Adjustment
        </span>
      );
    case 'revoked':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Revoked
        </span>
      );
  }
}

export default function CECreditsManager({
  currentPath,
  user,
  creditEntries,
  userCredits,
  stats,
  loading = false,
}: CECreditsManagerProps) {
  const [view, setView] = useState<'transactions' | 'users'>('users');
  const [search, setSearch] = useState('');

  const filteredUsers = userCredits.filter(
    (u) =>
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEntries = creditEntries.filter(
    (e) =>
      e.user_name.toLowerCase().includes(search.toLowerCase()) ||
      e.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (e.event_title && e.event_title.toLowerCase().includes(search.toLowerCase()))
  );

  const userColumns = [
    {
      key: 'user',
      header: 'User',
      render: (user: UserCredits) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B52AC]/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-[#0B52AC]">
              {user.user_name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-[#0C2044]">{user.user_name}</p>
            <p className="text-sm text-gray-500">{user.user_email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'total_credits',
      header: 'Total Credits',
      render: (user: UserCredits) => (
        <span className="inline-flex items-center px-3 py-1 bg-[#DDC89D]/20 text-[#0C2044] font-semibold rounded-full">
          {user.total_credits} CE
        </span>
      ),
    },
    {
      key: 'events_attended',
      header: 'Events',
      render: (user: UserCredits) => (
        <span className="text-sm text-gray-600">{user.events_attended} events</span>
      ),
    },
    {
      key: 'last_credit_date',
      header: 'Last Credit',
      render: (user: UserCredits) => (
        <span className="text-sm text-gray-600">{formatDate(user.last_credit_date)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (user: UserCredits) => (
        <div className="flex items-center gap-2">
          <a
            href={`/admin/credits/user/${user.user_id}`}
            className="px-3 py-1 text-sm font-medium text-[#0B52AC] hover:bg-[#0B52AC]/10 rounded-lg transition-colors"
          >
            View History
          </a>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const transactionColumns = [
    {
      key: 'user',
      header: 'User',
      render: (entry: CreditEntry) => (
        <div>
          <p className="font-medium text-[#0C2044]">{entry.user_name}</p>
          <p className="text-sm text-gray-500">{entry.user_email}</p>
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Credits',
      render: (entry: CreditEntry) => (
        <span
          className={`font-semibold ${
            entry.transaction_type === 'revoked' ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {entry.transaction_type === 'revoked' ? '-' : '+'}
          {entry.credits}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (entry: CreditEntry) => (
        <div>
          <p className="text-sm text-[#0C2044]">{entry.event_title || entry.source}</p>
          {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (entry: CreditEntry) => getTransactionBadge(entry.transaction_type),
    },
    {
      key: 'date',
      header: 'Date',
      render: (entry: CreditEntry) => (
        <span className="text-sm text-gray-600">{formatDate(entry.awarded_at)}</span>
      ),
    },
  ];

  return (
    <AdminShell
      title="CE Credits"
      subtitle="Manage continuing education credits"
      currentPath={currentPath}
      user={user}
      actions={
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm">
            Add Credits
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Credits"
          value={stats.totalCreditsAwarded}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Users with Credits"
          value={stats.totalUsers}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Avg per User"
          value={stats.averageCreditsPerUser.toFixed(1)}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="This Month"
          value={stats.creditsThisMonth}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Filters & View Toggle */}
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
                placeholder="Search by user or event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'users'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              By User
            </button>
            <button
              onClick={() => setView('transactions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'transactions'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {view === 'users' ? (
        <DataTable
          columns={userColumns}
          data={filteredUsers}
          keyExtractor={(user) => user.user_id}
          emptyMessage="No users with credits found"
          loading={loading}
        />
      ) : (
        <DataTable
          columns={transactionColumns}
          data={filteredEntries}
          keyExtractor={(entry) => entry.id}
          emptyMessage="No credit transactions found"
          loading={loading}
        />
      )}
    </AdminShell>
  );
}
