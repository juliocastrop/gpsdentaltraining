import { useState } from 'react';
import AdminShell from './AdminShell';
import DataTable from './DataTable';

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  capacity: number;
  ce_credits: number;
  ticketsSold: number;
  checkedIn: number;
  status: 'upcoming' | 'ongoing' | 'past';
}

interface EventsListProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  events: Event[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: Event['status']) {
  switch (status) {
    case 'upcoming':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Upcoming
        </span>
      );
    case 'ongoing':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Ongoing
        </span>
      );
    case 'past':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Past
        </span>
      );
  }
}

export default function EventsList({ currentPath, user, events, loading = false }: EventsListProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [search, setSearch] = useState('');

  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === 'all' || event.status === filter || (filter === 'upcoming' && event.status === 'ongoing');
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const columns = [
    {
      key: 'title',
      header: 'Event',
      render: (event: Event) => (
        <div>
          <p className="font-medium text-[#0C2044]">{event.title}</p>
          <p className="text-sm text-gray-500">{event.venue || 'No venue'}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (event: Event) => (
        <div>
          <p className="text-sm text-[#0C2044]">{formatDate(event.start_date)}</p>
          {event.end_date && event.end_date !== event.start_date && (
            <p className="text-xs text-gray-500">to {formatDate(event.end_date)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tickets',
      header: 'Tickets',
      render: (event: Event) => (
        <div className="text-sm">
          <p className="text-[#0C2044]">
            {event.ticketsSold} / {event.capacity || '∞'}
          </p>
          {event.capacity > 0 && (
            <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
              <div
                className={`h-full rounded-full ${
                  event.ticketsSold >= event.capacity
                    ? 'bg-red-500'
                    : event.ticketsSold >= event.capacity * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((event.ticketsSold / event.capacity) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (event: Event) => (
        <div className="text-sm">
          <p className="text-[#0C2044]">{event.checkedIn} checked in</p>
          {event.ticketsSold > 0 && (
            <p className="text-xs text-gray-500">
              {Math.round((event.checkedIn / event.ticketsSold) * 100)}% rate
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'ce_credits',
      header: 'CE Credits',
      render: (event: Event) => (
        <span className="inline-flex items-center px-2 py-1 bg-[#DDC89D]/20 text-[#0C2044] text-sm font-medium rounded-full">
          {event.ce_credits} CE
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (event: Event) => getStatusBadge(event.status),
    },
    {
      key: 'actions',
      header: '',
      render: (event: Event) => (
        <div className="flex items-center gap-2">
          <a
            href={`/admin/attendance?event=${event.id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Check-in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>
          <a
            href={`/admin/certificates?event=${event.id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Certificates"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </a>
          <a
            href={`/admin/events/${event.id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="Events"
      subtitle="Manage courses and events"
      currentPath={currentPath}
      user={user}
      actions={
        <a
          href="/admin/events/new"
          className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </a>
      }
    >
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
                placeholder="Search events..."
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
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-[#0B52AC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        keyExtractor={(event) => event.id}
        onRowClick={(event) => window.location.href = `/admin/events/${event.id}`}
        emptyMessage="No events found"
        loading={loading}
      />
    </AdminShell>
  );
}
