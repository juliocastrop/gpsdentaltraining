/**
 * Course Certificates Management Component - GPS Dental Training Admin
 * Generate, preview, and send certificates for course attendees
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  ce_credits: number;
  venue: string | null;
}

interface Certificate {
  id: string;
  certificate_code: string;
  pdf_url: string | null;
  generated_at: string;
  sent_at: string | null;
}

interface Attendee {
  attendance_id: string;
  ticket_id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  user_id: string | null;
  checked_in_at: string;
  check_in_method: string;
  certificate: Certificate | null;
}

interface CourseCertificatesProps {
  currentPath: string;
  user: { name: string; email: string };
  attendees: Attendee[];
  events: Event[];
  eventFilter: string;
  selectedEvent: Event | null;
  stats: {
    total: number;
    withCertificate: number;
    sent: number;
  };
}

export default function CourseCertificates({
  currentPath,
  user,
  attendees,
  events,
  eventFilter,
  selectedEvent,
  stats,
}: CourseCertificatesProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showTestEmailModal, setShowTestEmailModal] = useState<string | null>(null);

  const handleEventChange = (eventId: string) => {
    const url = new URL(window.location.href);
    if (eventId) {
      url.searchParams.set('event_id', eventId);
    } else {
      url.searchParams.delete('event_id');
    }
    window.location.href = url.toString();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(attendees.map(a => a.ticket_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleGenerate = async (ticketId: string, attendeeName: string) => {
    setIsGenerating(ticketId);
    setMessage(null);

    try {
      // First generate certificate record
      const response = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          eventId: eventFilter,
          attendeeName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate');
      }

      // Then generate PDF
      const pdfResponse = await fetch('/api/admin/certificates/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: data.data.id,
          type: 'course',
        }),
      });

      const pdfData = await pdfResponse.json();

      if (!pdfResponse.ok) {
        throw new Error(pdfData.error || 'Failed to generate PDF');
      }

      setMessage({ type: 'success', text: 'Certificate generated successfully!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate certificate' });
    } finally {
      setIsGenerating(null);
    }
  };

  const handlePreview = async (certificateId: string) => {
    setIsPreviewing(certificateId);

    try {
      // Open preview in new tab
      const response = await fetch(`/api/admin/certificates/preview?id=${certificateId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview certificate');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to preview certificate' });
    } finally {
      setIsPreviewing(null);
    }
  };

  const handleSend = async (certificateId: string) => {
    setIsSending(certificateId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send certificate');
      }

      setMessage({ type: 'success', text: 'Certificate sent successfully!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send certificate' });
    } finally {
      setIsSending(null);
    }
  };

  const handleTestEmail = async (certificateId: string) => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setIsSending(certificateId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/certificates/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId, testEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setMessage({ type: 'success', text: `Test email sent to ${testEmail}!` });
      setShowTestEmailModal(null);
      setTestEmail('');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send test email' });
    } finally {
      setIsSending(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.length === 0) return;

    setIsBulkAction(true);
    setMessage(null);

    const attendeesToGenerate = attendees.filter(
      a => selectedIds.includes(a.ticket_id) && !a.certificate
    );

    let successCount = 0;
    let errorCount = 0;

    for (const attendee of attendeesToGenerate) {
      try {
        const response = await fetch('/api/admin/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: attendee.ticket_id,
            eventId: eventFilter,
            attendeeName: attendee.attendee_name,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Generate PDF
          await fetch('/api/admin/certificates/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certificateId: data.data.id,
              type: 'course',
            }),
          });
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setMessage({
      type: errorCount === 0 ? 'success' : 'error',
      text: `Generated ${successCount} certificates${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    setTimeout(() => window.location.reload(), 2000);
    setIsBulkAction(false);
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) return;

    setIsBulkAction(true);
    setMessage(null);

    const attendeesToSend = attendees.filter(
      a => selectedIds.includes(a.ticket_id) && a.certificate && !a.certificate.sent_at
    );

    let successCount = 0;
    let errorCount = 0;

    for (const attendee of attendeesToSend) {
      try {
        const response = await fetch('/api/admin/certificates/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificateId: attendee.certificate!.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setMessage({
      type: errorCount === 0 ? 'success' : 'error',
      text: `Sent ${successCount} certificates${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    setTimeout(() => window.location.reload(), 2000);
    setIsBulkAction(false);
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

  return (
    <AdminShell
      title="Course Certificates"
      subtitle="Generate and send certificates to course attendees"
      currentPath={currentPath}
      user={user}
    >
      {/* Message */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={eventFilter}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
            >
              <option value="">-- Select an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {formatDate(event.start_date)}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkGenerate}
                disabled={selectedIds.length === 0 || isBulkAction}
                className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkAction ? 'Processing...' : `Generate Selected (${selectedIds.filter(id => !attendees.find(a => a.ticket_id === id)?.certificate).length})`}
              </button>
              <button
                onClick={handleBulkSend}
                disabled={selectedIds.length === 0 || isBulkAction}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkAction ? 'Processing...' : `Send Selected (${selectedIds.filter(id => attendees.find(a => a.ticket_id === id)?.certificate && !attendees.find(a => a.ticket_id === id)?.certificate?.sent_at).length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Info & Stats */}
      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Total Checked-In</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Certificates Generated</div>
            <div className="text-2xl font-bold text-[#0B52AC]">{stats.withCertificate}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Certificates Sent</div>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">CE Credits</div>
            <div className="text-2xl font-bold text-[#DDC89D]">{selectedEvent.ce_credits || 0}</div>
          </div>
        </div>
      )}

      {/* Attendees Table */}
      {selectedEvent ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedEvent.title}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(selectedEvent.start_date)}
              {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                <> - {formatDate(selectedEvent.end_date)}</>
              )}
              {selectedEvent.venue && <> &bull; {selectedEvent.venue}</>}
            </p>
          </div>

          {attendees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No checked-in attendees found for this event.</p>
              <p className="text-sm mt-2">Certificates can only be generated for attendees who have checked in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === attendees.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-[#0B52AC] focus:ring-[#0B52AC]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendees.map((attendee) => (
                    <tr key={attendee.ticket_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(attendee.ticket_id)}
                          onChange={(e) => handleSelectOne(attendee.ticket_id, e.target.checked)}
                          className="rounded border-gray-300 text-[#0B52AC] focus:ring-[#0B52AC]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{attendee.attendee_name}</div>
                        <div className="text-sm text-gray-500">{attendee.attendee_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDateTime(attendee.checked_in_at)}</div>
                        <div className="text-xs text-gray-500 capitalize">{attendee.check_in_method?.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        {attendee.certificate ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Generated
                            </span>
                            {attendee.certificate.sent_at && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Sent
                              </span>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {attendee.certificate.certificate_code}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Generated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {attendee.certificate ? (
                            <>
                              <button
                                onClick={() => handlePreview(attendee.certificate!.id)}
                                disabled={isPreviewing === attendee.certificate.id}
                                className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Preview PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setShowTestEmailModal(attendee.certificate!.id)}
                                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Send Test Email"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </button>
                              {attendee.certificate.pdf_url && (
                                <a
                                  href={attendee.certificate.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-500 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Download PDF"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              )}
                              {!attendee.certificate.sent_at && (
                                <button
                                  onClick={() => handleSend(attendee.certificate!.id)}
                                  disabled={isSending === attendee.certificate.id}
                                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Send to Attendee"
                                >
                                  {isSending === attendee.certificate.id ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleGenerate(attendee.ticket_id, attendee.attendee_name)}
                              disabled={isGenerating === attendee.ticket_id}
                              className="px-3 py-1.5 bg-[#0B52AC] text-white text-sm font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50"
                            >
                              {isGenerating === attendee.ticket_id ? 'Generating...' : 'Generate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
          <p className="text-gray-500">Choose an event from the dropdown to manage certificates for its attendees.</p>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Email</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send a test certificate email to verify the template looks correct.
            </p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowTestEmailModal(null);
                  setTestEmail('');
                }}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTestEmail(showTestEmailModal)}
                disabled={isSending === showTestEmailModal || !testEmail}
                className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50"
              >
                {isSending === showTestEmailModal ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
