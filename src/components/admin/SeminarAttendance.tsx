/**
 * Seminar Session Attendance Component - GPS Dental Training Admin
 * Check-in participants to seminar sessions and track attendance
 */
import { useState, useEffect, useRef } from 'react';
import AdminShell from './AdminShell';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Session {
  id: string;
  session_number: number;
  session_date: string;
  topic: string | null;
}

interface Seminar {
  id: string;
  title: string;
  year: number;
}

interface Registration {
  id: string;
  user: User;
  sessions_completed: number;
}

interface AttendanceRecord {
  id: string;
  registration_id: string;
  session_id: string;
  checked_in_at: string;
  is_makeup: boolean;
  credits_awarded: number;
  notes: string | null;
  registration: {
    id: string;
    user: User;
  };
  session: Session;
}

interface SeminarAttendanceProps {
  currentPath: string;
  user: { name: string; email: string };
  attendance: AttendanceRecord[];
  seminars: Seminar[];
  sessions: Session[];
  registrations: Registration[];
  seminarFilter: string;
  sessionFilter: string;
}

export default function SeminarAttendance({
  currentPath,
  user,
  attendance: initialAttendance,
  seminars,
  sessions,
  registrations,
  seminarFilter,
  sessionFilter,
}: SeminarAttendanceProps) {
  const [attendance, setAttendance] = useState(initialAttendance);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<string>('');
  const [isMakeup, setIsMakeup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Filter registrations that haven't checked in to selected session
  const uncheckedRegistrations = registrations.filter(reg => {
    if (!sessionFilter) return true;
    return !attendance.some(att =>
      att.registration_id === reg.id && att.session_id === sessionFilter
    );
  });

  // Search filter
  const filteredRegistrations = uncheckedRegistrations.filter(reg => {
    if (!searchQuery) return true;
    const fullName = `${reg.user?.first_name || ''} ${reg.user?.last_name || ''}`.toLowerCase();
    const email = (reg.user?.email || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleFilterChange = (type: 'seminar' | 'session', value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(type === 'seminar' ? 'seminar_id' : 'session_id', value);
      // Reset session filter when seminar changes
      if (type === 'seminar') {
        url.searchParams.delete('session_id');
      }
    } else {
      url.searchParams.delete(type === 'seminar' ? 'seminar_id' : 'session_id');
      if (type === 'seminar') {
        url.searchParams.delete('session_id');
      }
    }
    window.location.href = url.toString();
  };

  const handleCheckIn = async () => {
    if (!selectedRegistration || !sessionFilter) {
      setMessage({ type: 'error', text: 'Please select a session and participant' });
      return;
    }

    setIsCheckingIn(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/seminars/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedRegistration,
          session_id: sessionFilter,
          is_makeup: isMakeup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in');
      }

      setMessage({ type: 'success', text: `Check-in successful! ${data.data?.credits_awarded || 2} CE credits awarded.` });
      setShowCheckInModal(false);
      setSelectedRegistration('');
      setIsMakeup(false);

      // Refresh page to get updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to check in' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleUndoCheckIn = async (attendanceId: string) => {
    if (!confirm('Are you sure you want to remove this check-in? CE credits will be revoked.')) return;

    try {
      const response = await fetch(`/api/admin/seminars/attendance/${attendanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove check-in');
      }

      setMessage({ type: 'success', text: 'Check-in removed successfully' });
      setAttendance(prev => prev.filter(a => a.id !== attendanceId));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove check-in' });
    }
  };

  // QR Scanner functions
  const startScanner = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanMode(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Could not access camera. Please use manual check-in.' });
    }
  };

  const stopScanner = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanMode(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Stats
  const selectedSession = sessions.find(s => s.id === sessionFilter);
  const checkedInCount = attendance.filter(a => a.session_id === sessionFilter).length;
  const totalRegistrants = registrations.length;
  const attendanceRate = totalRegistrants > 0 ? Math.round((checkedInCount / totalRegistrants) * 100) : 0;

  return (
    <AdminShell currentPath={currentPath} user={user} title="Seminar Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Attendance</h1>
            <p className="text-gray-600">Check-in participants and track seminar attendance</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/seminars/registrations"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              View Registrations
            </a>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Seminar</label>
              <select
                value={seminarFilter}
                onChange={(e) => handleFilterChange('seminar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a seminar...</option>
                {seminars.map((seminar) => (
                  <option key={seminar.id} value={seminar.id}>
                    {seminar.title} ({seminar.year})
                  </option>
                ))}
              </select>
            </div>
            {seminarFilter && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Session</label>
                <select
                  value={sessionFilter}
                  onChange={(e) => handleFilterChange('session', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a session...</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      Session {session.session_number} - {formatDate(session.session_date)}
                      {session.topic ? ` - ${session.topic}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Session Stats */}
        {sessionFilter && selectedSession && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Session</div>
              <div className="text-xl font-bold text-gray-900">#{selectedSession.session_number}</div>
              <div className="text-sm text-gray-500">{formatDate(selectedSession.session_date)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Checked In</div>
              <div className="text-2xl font-bold text-green-600">{checkedInCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Not Checked In</div>
              <div className="text-2xl font-bold text-orange-600">{totalRegistrants - checkedInCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Attendance Rate</div>
              <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
            </div>
          </div>
        )}

        {/* Check-in Actions */}
        {sessionFilter && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Manual Check-in
              </button>
              <button
                onClick={scanMode ? stopScanner : startScanner}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  scanMode
                    ? 'text-white bg-red-600 hover:bg-red-700'
                    : 'text-white bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                {scanMode ? 'Stop Scanner' : 'Scan QR Code'}
              </button>
            </div>

            {/* QR Scanner View */}
            {scanMode && (
              <div className="mt-4">
                <div className="relative w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full"
                  />
                  <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none" />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Position the QR code within the frame to scan
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attendance List */}
        {sessionFilter ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Checked In ({checkedInCount})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked In At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.filter(a => a.session_id === sessionFilter).length > 0 ? (
                    attendance
                      .filter(a => a.session_id === sessionFilter)
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium">
                              {record.registration?.user?.first_name} {record.registration?.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.registration?.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDateTime(record.checked_in_at)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              +{record.credits_awarded} CE
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {record.is_makeup ? (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                Makeup
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Regular
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleUndoCheckIn(record.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Undo
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No one has checked in to this session yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
            <p className="text-gray-500">
              Choose a seminar and session above to view attendance and check in participants
            </p>
          </div>
        )}

        {/* Not Checked In List */}
        {sessionFilter && uncheckedRegistrations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Not Checked In ({uncheckedRegistrations.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uncheckedRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {reg.user?.first_name} {reg.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reg.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(reg.sessions_completed / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {reg.sessions_completed}/10
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedRegistration(reg.id);
                            setShowCheckInModal(true);
                          }}
                          className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Check In
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Check-in Modal */}
        {showCheckInModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Manual Check-in</h2>
                <button
                  onClick={() => {
                    setShowCheckInModal(false);
                    setSelectedRegistration('');
                    setIsMakeup(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Participant
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Participant Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Participant
                  </label>
                  <select
                    value={selectedRegistration}
                    onChange={(e) => setSelectedRegistration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a participant...</option>
                    {filteredRegistrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.user?.first_name} {reg.user?.last_name} - {reg.user?.email} ({reg.sessions_completed}/10)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Makeup Session */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_makeup"
                    checked={isMakeup}
                    onChange={(e) => setIsMakeup(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_makeup" className="text-sm text-gray-700">
                    This is a makeup session
                  </label>
                </div>

                {/* Session Info */}
                {selectedSession && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Checking into:</div>
                    <div className="font-medium">
                      Session {selectedSession.session_number} - {formatDate(selectedSession.session_date)}
                    </div>
                    {selectedSession.topic && (
                      <div className="text-sm text-gray-600">{selectedSession.topic}</div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCheckInModal(false);
                      setSelectedRegistration('');
                      setIsMakeup(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={!selectedRegistration || isCheckingIn}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCheckingIn ? 'Checking In...' : 'Check In & Award 2 CE Credits'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
