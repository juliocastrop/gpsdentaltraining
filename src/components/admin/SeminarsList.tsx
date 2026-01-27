import { useState } from 'react';
import AdminShell from './AdminShell';
import DataTable from './DataTable';
import StatCard from './StatCard';

interface Seminar {
  id: string;
  title: string;
  year: number;
  price: number;
  totalSessions: number;
  completedSessions: number;
  registrations: number;
  activeRegistrations: number;
  ceCreditsTotal: number;
  status: 'active' | 'completed' | 'upcoming';
}

interface SeminarsListProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  seminars: Seminar[];
  stats: {
    totalRegistrations: number;
    activeRegistrations: number;
    sessionsThisMonth: number;
    creditsAwarded: number;
  };
  loading?: boolean;
}

function getStatusBadge(status: Seminar['status']) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Upcoming
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Completed
        </span>
      );
  }
}

export default function SeminarsList({
  currentPath,
  user,
  seminars,
  stats,
  loading = false,
}: SeminarsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const filteredSeminars = seminars.filter((seminar) => {
    const matchesFilter = filter === 'all' || seminar.status === filter || (filter === 'active' && seminar.status === 'upcoming');
    const matchesSearch = seminar.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const columns = [
    {
      key: 'title',
      header: 'Seminar',
      render: (seminar: Seminar) => (
        <div>
          <p className="font-medium text-[#0C2044]">{seminar.title}</p>
          <p className="text-sm text-gray-500">{seminar.year}</p>
        </div>
      ),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      render: (seminar: Seminar) => (
        <div>
          <p className="text-sm text-[#0C2044]">
            {seminar.completedSessions} / {seminar.totalSessions}
          </p>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
            <div
              className="h-full bg-[#0B52AC] rounded-full"
              style={{ width: `${(seminar.completedSessions / seminar.totalSessions) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'registrations',
      header: 'Registrations',
      render: (seminar: Seminar) => (
        <div className="text-sm">
          <p className="text-[#0C2044] font-medium">{seminar.activeRegistrations} active</p>
          <p className="text-gray-500">{seminar.registrations} total</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (seminar: Seminar) => (
        <span className="font-medium text-[#0C2044]">${seminar.price}</span>
      ),
    },
    {
      key: 'ce_credits',
      header: 'CE Credits',
      render: (seminar: Seminar) => (
        <span className="inline-flex items-center px-2 py-1 bg-[#DDC89D]/20 text-[#0C2044] text-sm font-medium rounded-full">
          {seminar.ceCreditsTotal} CE total
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (seminar: Seminar) => getStatusBadge(seminar.status),
    },
    {
      key: 'actions',
      header: '',
      render: (seminar: Seminar) => (
        <div className="flex items-center gap-2">
          <a
            href={`/admin/seminars/${seminar.id}/sessions`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Sessions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </a>
          <a
            href={`/admin/seminars/${seminar.id}/registrations`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Registrations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </a>
          <a
            href={`/admin/seminars/${seminar.id}/attendance`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Attendance"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="Monthly Seminars"
      subtitle="Manage seminar programs and registrations"
      currentPath={currentPath}
      user={user}
      actions={
        <a
          href="https://strapi-admin.gpsdentaltraining.com/admin"
          target="_blank"
          className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm"
        >
          Open Strapi CMS
        </a>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Active Students"
          value={stats.activeRegistrations}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Sessions This Month"
          value={stats.sessionsThisMonth}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Credits Awarded"
          value={stats.creditsAwarded}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          iconBgColor="bg-yellow-100"
        />
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
                placeholder="Search seminars..."
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
                filter === 'all'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Seminars Table */}
      <DataTable
        columns={columns}
        data={filteredSeminars}
        keyExtractor={(seminar) => seminar.id}
        onRowClick={(seminar) => window.location.href = `/admin/seminars/${seminar.id}`}
        emptyMessage="No seminars found"
        loading={loading}
      />
    </AdminShell>
  );
}
