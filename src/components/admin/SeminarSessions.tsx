/**
 * Seminar Sessions Component - GPS Dental Training Admin
 * View and manage seminar session schedules
 */
import { useState } from 'react';
import AdminShell from './AdminShell';
import DataTable from './DataTable';

interface Seminar {
  id: string;
  title: string;
  year: number;
}

interface SeminarSession {
  id: string;
  seminar_id: string;
  session_number: number;
  session_date: string;
  session_time_start: string | null;
  session_time_end: string | null;
  topic: string | null;
  description: string | null;
  seminar?: Seminar;
}

interface SeminarSessionsProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  sessions: SeminarSession[];
  seminars: Seminar[];
  seminarFilter: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function SeminarSessions({
  currentPath,
  user,
  sessions,
  seminars,
  seminarFilter,
}: SeminarSessionsProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [selectedSeminar, setSelectedSeminar] = useState(seminarFilter);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.session_date);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && sessionDate >= today) ||
      (filter === 'past' && sessionDate < today);

    const matchesSeminar = !selectedSeminar || session.seminar_id === selectedSeminar;

    return matchesFilter && matchesSeminar;
  });

  const handleSeminarChange = (seminarId: string) => {
    setSelectedSeminar(seminarId);
    // Update URL
    const url = new URL(window.location.href);
    if (seminarId) {
      url.searchParams.set('seminar_id', seminarId);
    } else {
      url.searchParams.delete('seminar_id');
    }
    window.history.pushState({}, '', url.toString());
  };

  const getSessionStatus = (sessionDate: string) => {
    const date = new Date(sessionDate);
    if (date < today) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Completed
        </span>
      );
    }
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    if (date <= nextWeek) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          This Week
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Upcoming
      </span>
    );
  };

  const columns = [
    {
      key: 'session',
      header: 'Session',
      render: (session: SeminarSession) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B52AC]/10 rounded-lg flex items-center justify-center font-bold text-[#0B52AC]">
            {session.session_number}
          </div>
          <div>
            <p className="font-medium text-[#0C2044]">Session {session.session_number}</p>
            {session.seminar && (
              <p className="text-xs text-gray-500">{session.seminar.title}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (session: SeminarSession) => (
        <div>
          <p className="text-sm text-[#0C2044]">{formatDate(session.session_date)}</p>
          {session.session_time_start && (
            <p className="text-xs text-gray-500">
              {formatTime(session.session_time_start)}
              {session.session_time_end && ` - ${formatTime(session.session_time_end)}`}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (session: SeminarSession) => (
        <div className="max-w-md">
          <p className="text-sm text-[#0C2044] truncate">{session.topic || 'No topic set'}</p>
          {session.description && (
            <p className="text-xs text-gray-500 truncate">{session.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (session: SeminarSession) => getSessionStatus(session.session_date),
    },
    {
      key: 'actions',
      header: '',
      render: (session: SeminarSession) => (
        <div className="flex items-center gap-2">
          <a
            href={`/admin/seminars/attendance?seminar_id=${session.seminar_id}&session_id=${session.id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="View Attendance"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>
          <a
            href={`/admin/seminars/${session.seminar_id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="View Seminar"
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

  // Calculate stats
  const upcomingSessions = sessions.filter(s => new Date(s.session_date) >= today).length;
  const completedSessions = sessions.filter(s => new Date(s.session_date) < today).length;
  const nextSession = sessions
    .filter(s => new Date(s.session_date) >= today)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];

  return (
    <AdminShell
      title="Seminar Sessions"
      subtitle="View and manage session schedules"
      currentPath={currentPath}
      user={user}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-2xl font-bold text-[#0C2044]">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-bold text-green-600">{upcomingSessions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-gray-600">{completedSessions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Next Session</p>
          <p className="text-lg font-bold text-[#0B52AC]">
            {nextSession ? formatDate(nextSession.session_date) : 'None'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="seminar-select" className="sr-only">Select Seminar</label>
            <select
              id="seminar-select"
              value={selectedSeminar}
              onChange={(e) => handleSeminarChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
            >
              <option value="">All Seminars</option>
              {seminars.map((seminar) => (
                <option key={seminar.id} value={seminar.id}>
                  {seminar.title} ({seminar.year})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
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
              type="button"
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
              type="button"
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

      {/* Sessions Table */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        keyExtractor={(session) => session.id}
        emptyMessage="No sessions found"
      />
    </AdminShell>
  );
}
