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

interface DeleteModalProps {
  seminar: Seminar | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

interface CreateSeminarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (seminarId: string) => void;
}

function CreateSeminarModal({ isOpen, onClose, onSuccess }: CreateSeminarModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear(),
    price: 750,
    total_sessions: 10,
    credits_per_session: 2,
    status: 'draft' as 'draft' | 'active' | 'completed',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/seminars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_credits: formData.total_sessions * formData.credits_per_session,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create seminar');
      }

      onSuccess(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0C2044]">Create New Seminar</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
              placeholder="e.g., GPS Monthly Seminars 2025"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                min={2020}
                max={2100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Sessions
              </label>
              <input
                type="number"
                value={formData.total_sessions}
                onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                min={1}
                max={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CE Credits per Session
              </label>
              <input
                type="number"
                value={formData.credits_per_session}
                onChange={(e) => setFormData({ ...formData, credits_per_session: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                min={0}
                max={20}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Total CE Credits:</strong> {formData.total_sessions * formData.credits_per_session} credits
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="flex-1 px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Seminar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ seminar, isOpen, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  if (!isOpen || !seminar) return null;

  const hasActiveData = seminar.activeRegistrations > 0 || seminar.completedSessions > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Seminar</h3>
            <p className="text-sm text-gray-500">{seminar.title} ({seminar.year})</p>
          </div>
        </div>

        {hasActiveData && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium text-sm mb-2">Warning: This seminar has active data!</p>
            <ul className="text-red-700 text-sm space-y-1">
              {seminar.activeRegistrations > 0 && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {seminar.activeRegistrations} active registrations
                </li>
              )}
              {seminar.completedSessions > 0 && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {seminar.completedSessions} completed sessions
                </li>
              )}
              {seminar.ceCreditsTotal > 0 && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {seminar.ceCreditsTotal} CE credits awarded
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm">
            {hasActiveData
              ? 'Deleting this seminar will also delete all associated sessions, registrations, attendance records, and CE credits. This action cannot be undone.'
              : 'Are you sure you want to delete this seminar? This action cannot be undone.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Seminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; seminar: Seminar | null }>({
    isOpen: false,
    seminar: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Find the active seminar (controls the /monthly-seminars landing page)
  const activeSeminar = seminars.find(s => s.status === 'active');

  const handleDeleteClick = (seminar: Seminar, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, seminar });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.seminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/seminars/${deleteModal.seminar.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete seminar');
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete seminar');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, seminar: null });
    }
  };

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
          <div className="flex items-center gap-2">
            <p className="font-medium text-[#0C2044]">{seminar.title}</p>
            {seminar.status === 'active' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0B52AC]/10 text-[#0B52AC] text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Landing Page
              </span>
            )}
          </div>
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
            href={`/admin/seminars/${seminar.id}`}
            className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Seminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </a>
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
          <button
            type="button"
            onClick={(e) => handleDeleteClick(seminar, e)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Seminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
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
        <div className="flex items-center gap-3">
          <a
            href="/admin/seminars/makeup-requests"
            className="px-4 py-2 border border-[#0B52AC] text-[#0B52AC] font-medium rounded-lg hover:bg-[#0B52AC]/10 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Makeup Requests
          </a>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Seminar
          </button>
        </div>
      }
    >
      {/* Landing Page Banner */}
      <div className="bg-gradient-to-r from-[#0B52AC] to-[#0C2044] rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Monthly Seminars Landing Page</h3>
              <p className="text-white/80 text-sm">
                {activeSeminar ? (
                  <>
                    Currently showing: <span className="font-semibold text-white">{activeSeminar.title}</span>
                  </>
                ) : (
                  'No active seminar. The landing page will show a "Coming Soon" message.'
                )}
              </p>
              <a
                href="/monthly-seminars"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs mt-1 transition-colors"
              >
                View public page
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          {activeSeminar ? (
            <a
              href={`/admin/seminars/${activeSeminar.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0B52AC] font-bold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Landing Page
            </a>
          ) : (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0B52AC] font-bold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Active Seminar
            </button>
          )}
        </div>
      </div>

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        seminar={deleteModal.seminar}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, seminar: null })}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Create Seminar Modal */}
      <CreateSeminarModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(seminarId) => {
          setCreateModalOpen(false);
          window.location.href = `/admin/seminars/${seminarId}`;
        }}
      />
    </AdminShell>
  );
}
