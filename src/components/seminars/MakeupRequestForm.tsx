/**
 * Makeup Request Form Component
 * Allows users to submit makeup session requests
 */
import { useState, useEffect } from 'react';

interface Session {
  id: string;
  session_number: number;
  session_date: string;
  topic: string | null;
}

interface MakeupRequest {
  id: string;
  status: string;
  reason: string | null;
  denial_reason: string | null;
  created_at: string;
  missed_session: Session | null;
  requested_session: Session | null;
}

interface MakeupRequestFormProps {
  registrationId: string;
  seminarId: string;
  sessions: Session[];
  attendedSessionIds: string[];
  makeupUsed: boolean;
  userId?: string;
  onSuccess?: () => void;
}

export default function MakeupRequestForm({
  registrationId,
  seminarId,
  sessions,
  attendedSessionIds,
  makeupUsed,
  userId,
  onSuccess,
}: MakeupRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [existingRequest, setExistingRequest] = useState<MakeupRequest | null>(null);
  const [missedSessionId, setMissedSessionId] = useState('');
  const [requestedSessionId, setRequestedSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get sessions the user missed (past sessions not attended)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missedSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.session_date);
    return sessionDate < today && !attendedSessionIds.includes(s.id);
  });

  // Get future sessions for makeup
  const futureSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.session_date);
    return sessionDate >= today;
  });

  // Check for existing requests on mount
  useEffect(() => {
    const checkExistingRequests = async () => {
      try {
        const response = await fetch(
          `/api/seminars/makeup-request?registration_id=${registrationId}`
        );
        const data = await response.json();

        if (data.success && data.data?.length > 0) {
          // Find active request
          const activeRequest = data.data.find(
            (r: MakeupRequest) => r.status === 'pending' || r.status === 'approved'
          );
          if (activeRequest) {
            setExistingRequest(activeRequest);
          }
        }
      } catch (error) {
        console.error('Error checking existing requests:', error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingRequests();
  }, [registrationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!missedSessionId) {
      setMessage({ type: 'error', text: 'Please select the session you missed' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/seminars/makeup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          missed_session_id: missedSessionId,
          requested_session_id: requestedSessionId || undefined,
          reason: reason.trim() || undefined,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Your makeup request has been submitted! We will review it and notify you soon.',
        });
        setExistingRequest({
          id: data.data.request_id,
          status: 'pending',
          reason: reason || null,
          denial_reason: null,
          created_at: new Date().toISOString(),
          missed_session: missedSessions.find((s) => s.id === missedSessionId) || null,
          requested_session: futureSessions.find((s) => s.id === requestedSessionId) || null,
        });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit request' });
      }
    } catch (error) {
      console.error('Error submitting makeup request:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (isCheckingExisting) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Checking makeup eligibility...</span>
        </div>
      </div>
    );
  }

  // Already used makeup
  if (makeupUsed) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-orange-800 mb-1">Makeup Session Already Used</h3>
            <p className="text-orange-700 text-sm">
              You have already used your one allowed makeup session for this registration.
              If you need additional assistance, please contact us.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No missed sessions
  if (missedSessions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-green-800 mb-1">Perfect Attendance!</h3>
            <p className="text-green-700 text-sm">
              You haven't missed any sessions. Keep up the great work!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Existing pending/approved request
  if (existingRequest) {
    const statusColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' },
      approved: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-800' },
      denied: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800' },
    };
    const colors = statusColors[existingRequest.status] || statusColors.pending;

    return (
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className={`font-bold ${colors.text}`}>Makeup Request Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge} uppercase`}>
            {existingRequest.status}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          {existingRequest.missed_session && (
            <div>
              <span className="text-gray-500">Missed Session:</span>
              <p className={`font-medium ${colors.text}`}>
                Session {existingRequest.missed_session.session_number} - {formatDate(existingRequest.missed_session.session_date)}
                {existingRequest.missed_session.topic && ` - ${existingRequest.missed_session.topic}`}
              </p>
            </div>
          )}

          {existingRequest.requested_session && (
            <div>
              <span className="text-gray-500">Requested Makeup Date:</span>
              <p className={`font-medium ${colors.text}`}>
                Session {existingRequest.requested_session.session_number} - {formatDate(existingRequest.requested_session.session_date)}
              </p>
            </div>
          )}

          {existingRequest.reason && (
            <div>
              <span className="text-gray-500">Your Reason:</span>
              <p className={colors.text}>{existingRequest.reason}</p>
            </div>
          )}

          {existingRequest.denial_reason && (
            <div className="bg-red-100 rounded-lg p-3 mt-3">
              <span className="text-red-600 font-medium">Denial Reason:</span>
              <p className="text-red-700">{existingRequest.denial_reason}</p>
            </div>
          )}

          <p className="text-gray-500 text-xs pt-2">
            Submitted: {formatDate(existingRequest.created_at)}
          </p>
        </div>

        {existingRequest.status === 'approved' && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-green-700 text-sm">
              <strong>Your request has been approved!</strong> Please attend the makeup session to earn your CE credits.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show request form
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0C2044] to-[#173D84] px-6 py-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-[#DDC89D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Request Makeup Session
        </h3>
        <p className="text-white/70 text-sm mt-1">
          You have 1 makeup session available for this registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Missed Session Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which session did you miss? <span className="text-red-500">*</span>
          </label>
          <select
            value={missedSessionId}
            onChange={(e) => setMissedSessionId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
            required
          >
            <option value="">Select a session...</option>
            {missedSessions.map((session) => (
              <option key={session.id} value={session.id}>
                Session {session.session_number} - {formatDate(session.session_date)}
                {session.topic ? ` - ${session.topic}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Requested Session Select (Optional) */}
        {futureSessions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred makeup date (optional)
            </label>
            <select
              value={requestedSessionId}
              onChange={(e) => setRequestedSessionId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
            >
              <option value="">Any available session</option>
              {futureSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Session {session.session_number} - {formatDate(session.session_date)}
                  {session.topic ? ` - ${session.topic}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If you don't select a date, we'll contact you to schedule.
            </p>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for missing (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent resize-none"
            placeholder="Let us know why you missed this session..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !missedSessionId}
          className="w-full bg-[#0B52AC] hover:bg-[#0C2044] disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit Makeup Request
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your request will be reviewed by our team. You'll receive a notification once it's processed.
        </p>
      </form>
    </div>
  );
}
