/**
 * Seminar Registrations Component - GPS Dental Training Admin
 * View and manage seminar registrations
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Seminar {
  id: string;
  title: string;
  year: number;
}

interface Registration {
  id: string;
  user_id: string;
  seminar_id: string;
  status: string;
  sessions_completed: number;
  sessions_remaining: number;
  makeup_used: boolean;
  qr_code: string | null;
  created_at: string;
  user: User;
  seminar: Seminar;
}

interface SeminarRegistrationsProps {
  currentPath: string;
  user: { name: string; email: string };
  registrations: Registration[];
  seminars: Seminar[];
  seminarFilter: string;
  statusFilter: string;
}

export default function SeminarRegistrations({
  currentPath,
  user,
  registrations,
  seminars,
  seminarFilter,
  statusFilter,
}: SeminarRegistrationsProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleFilterChange = (type: 'seminar' | 'status', value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(type === 'seminar' ? 'seminar_id' : 'status', value);
    } else {
      url.searchParams.delete(type === 'seminar' ? 'seminar_id' : 'status');
    }
    window.location.href = url.toString();
  };

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/seminar-registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setMessage({ type: 'success', text: 'Status updated successfully' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = ['Name', 'Email', 'Seminar', 'Status', 'Sessions Completed', 'Sessions Remaining', 'Makeup Used', 'Registered At'];
      const rows = registrations.map(r => [
        `${r.user?.first_name || ''} ${r.user?.last_name || ''}`.trim(),
        r.user?.email || '',
        r.seminar?.title || '',
        r.status,
        r.sessions_completed,
        r.sessions_remaining,
        r.makeup_used ? 'Yes' : 'No',
        formatDateTime(r.created_at),
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seminar-registrations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export registrations' });
    } finally {
      setIsExporting(false);
    }
  };

  // Stats
  const activeCount = registrations.filter(r => r.status === 'active').length;
  const completedCount = registrations.filter(r => r.status === 'completed').length;
  const cancelledCount = registrations.filter(r => r.status === 'cancelled').length;

  return (
    <AdminShell currentPath={currentPath} user={user} title="Seminar Registrations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seminar Registrations</h1>
            <p className="text-gray-600">View and manage monthly seminar enrollments</p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Total Registrations</div>
            <div className="text-2xl font-bold text-gray-900">{registrations.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Seminar</label>
              <select
                value={seminarFilter}
                onChange={(e) => handleFilterChange('seminar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Seminars</option>
                {seminars.map((seminar) => (
                  <option key={seminar.id} value={seminar.id}>
                    {seminar.title} ({seminar.year})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {(seminarFilter || statusFilter) && (
              <div className="flex items-end">
                <button
                  onClick={() => window.location.href = '/admin/seminars/registrations'}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seminar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Makeup</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.length > 0 ? (
                  registrations.map((reg) => {
                    const progress = (reg.sessions_completed / 10) * 100;

                    return (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reg.user?.first_name} {reg.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{reg.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{reg.seminar?.title}</div>
                          <div className="text-sm text-gray-500">{reg.seminar?.year}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progress >= 100 ? 'bg-green-500' :
                                  progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {reg.sessions_completed}/10
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            reg.makeup_used ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {reg.makeup_used ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            reg.status === 'active' ? 'bg-green-100 text-green-800' :
                            reg.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            reg.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(reg.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={reg.status}
                            onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
