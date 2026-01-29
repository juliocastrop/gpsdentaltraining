/**
 * Seminar Makeup Requests Component - GPS Dental Training Admin
 * Manage and review makeup session requests
 */
import { useState, useEffect } from 'react';
import AdminShell from './AdminShell';

interface MakeupRequest {
  id: string;
  reason: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled' | 'expired';
  denial_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  registration: {
    id: string;
    sessions_completed: number;
    sessions_remaining: number;
    makeup_used: boolean;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  seminar: {
    id: string;
    title: string;
    year: number;
  };
  missed_session: {
    id: string;
    session_number: number;
    session_date: string;
    topic: string | null;
  } | null;
  requested_session: {
    id: string;
    session_number: number;
    session_date: string;
    topic: string | null;
  } | null;
  reviewed_by: {
    id: string;
    name: string;
  } | null;
}

interface StatusCounts {
  pending: number;
  approved: number;
  denied: number;
  completed: number;
  cancelled: number;
  expired: number;
}

interface SeminarMakeupRequestsProps {
  currentPath: string;
  user: { name: string; email: string };
  seminarId?: string;
}

export default function SeminarMakeupRequests({
  currentPath,
  user,
  seminarId,
}: SeminarMakeupRequestsProps) {
  const [requests, setRequests] = useState<MakeupRequest[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    pending: 0,
    approved: 0,
    denied: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<MakeupRequest | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (seminarId) params.set('seminarId', seminarId);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/seminars/makeup-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
        setCounts(data.counts || counts);
      }
    } catch (error) {
      console.error('Error fetching makeup requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [seminarId, statusFilter]);

  const handleAction = async (action: 'approve' | 'deny' | 'complete' | 'cancel') => {
    if (!selectedRequest) return;

    if (action === 'deny' && !denialReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for denial' });
      return;
    }

    setIsActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/seminars/makeup-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: actionNotes.trim() || undefined,
          denial_reason: action === 'deny' ? denialReason.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Request ${action}d successfully` });
        setSelectedRequest(null);
        setActionNotes('');
        setDenialReason('');
        fetchRequests();
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${action} request` });
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setMessage({ type: 'error', text: `An error occurred while ${action}ing the request` });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' },
    approved: { bg: 'bg-green-50', text: 'text-green-800', badge: 'bg-green-100 text-green-800' },
    denied: { bg: 'bg-red-50', text: 'text-red-800', badge: 'bg-red-100 text-red-800' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-800' },
    expired: { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
  };

  return (
    <AdminShell currentPath={currentPath} user={user}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Makeup Requests</h1>
            <p className="text-gray-500 mt-1">Review and manage seminar makeup session requests</p>
          </div>
          <a
            href="/admin/seminars"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Seminars
          </a>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'approved', label: 'Approved', count: counts.approved },
          { key: 'denied', label: 'Denied', count: counts.denied },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'all', label: 'All', count: Object.values(counts).reduce((a, b) => a + b, 0) },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === tab.key
                ? 'bg-[#0C2044] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                statusFilter === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No requests found</h3>
          <p className="text-gray-500">
            {statusFilter === 'pending' ? 'No pending makeup requests to review.' : `No ${statusFilter} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const colors = statusColors[request.status] || statusColors.pending;

            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors`}
              >
                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0C2044] text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {request.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{request.user.name}</h3>
                        <p className="text-gray-500 text-sm">{request.user.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${colors.badge}`}>
                      {request.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Seminar</span>
                      <p className="font-medium text-gray-900">{request.seminar.title} ({request.seminar.year})</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Missed Session</span>
                      {request.missed_session ? (
                        <p className="font-medium text-gray-900">
                          #{request.missed_session.session_number} - {formatDate(request.missed_session.session_date)}
                        </p>
                      ) : (
                        <p className="text-gray-400">-</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Requested Makeup</span>
                      {request.requested_session ? (
                        <p className="font-medium text-gray-900">
                          #{request.requested_session.session_number} - {formatDate(request.requested_session.session_date)}
                        </p>
                      ) : (
                        <p className="text-gray-400">Any available</p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">User's Reason</span>
                      <p className="text-gray-700 mt-1">{request.reason}</p>
                    </div>
                  )}

                  {/* Denial Reason */}
                  {request.denial_reason && (
                    <div className="bg-red-50 rounded-lg p-3 mb-4 border border-red-100">
                      <span className="text-xs text-red-600 uppercase tracking-wide">Denial Reason</span>
                      <p className="text-red-700 mt-1">{request.denial_reason}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Submitted: {formatDateTime(request.created_at)}</span>
                      {request.reviewed_at && request.reviewed_by && (
                        <span>
                          Reviewed by {request.reviewed_by.name} on {formatDateTime(request.reviewed_at)}
                        </span>
                      )}
                    </div>

                    {/* Actions for pending requests */}
                    {request.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionNotes('');
                            setDenialReason('');
                          }}
                          className="px-4 py-2 bg-[#0B52AC] text-white rounded-lg text-sm font-medium hover:bg-[#0C2044] transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    )}

                    {/* Mark completed for approved requests */}
                    {request.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          handleAction('complete');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && selectedRequest.status === 'pending' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Review Request</h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionNotes('');
                    setDenialReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Request Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">User:</span>
                  <span className="font-medium">{selectedRequest.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seminar:</span>
                  <span className="font-medium">{selectedRequest.seminar.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Missed Session:</span>
                  <span className="font-medium">
                    #{selectedRequest.missed_session?.session_number} -{' '}
                    {selectedRequest.missed_session ? formatDate(selectedRequest.missed_session.session_date) : '-'}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">Reason:</span>
                    <p className="text-gray-700">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent resize-none"
                  placeholder="Internal notes about this request..."
                />
              </div>

              {/* Denial Reason (shown only when denying) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Denial Reason (required if denying)
                </label>
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent resize-none"
                  placeholder="Explain why this request is being denied..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={isActionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleAction('deny')}
                  disabled={isActionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  Deny
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
