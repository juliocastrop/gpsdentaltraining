/**
 * Seminar Certificates Management Component - GPS Dental Training Admin
 * Generate and send bi-annual CE certificates for seminar participants
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

interface Certificate {
  id: string;
  certificate_url: string | null;
  generated_at: string;
  sent_at: string | null;
  period: string;
}

interface Registration {
  id: string;
  user: User;
  seminar: Seminar;
  sessions_completed: number;
  sessions_in_period: number;
  credits_in_period: number;
  eligible: boolean;
  certificate: Certificate | null;
}

interface SeminarCertificatesProps {
  currentPath: string;
  user: { name: string; email: string };
  registrations: Registration[];
  seminars: Seminar[];
  seminarFilter: string;
  periodFilter: string;
  periodLabel: string;
  stats: {
    total: number;
    eligible: number;
    generated: number;
    sent: number;
  };
}

export default function SeminarCertificates({
  currentPath,
  user,
  registrations,
  seminars,
  seminarFilter,
  periodFilter,
  periodLabel,
  stats,
}: SeminarCertificatesProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFilterChange = (type: 'seminar' | 'period', value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(type === 'seminar' ? 'seminar_id' : 'period', value);
    } else {
      url.searchParams.delete(type === 'seminar' ? 'seminar_id' : 'period');
    }
    window.location.href = url.toString();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(registrations.filter(r => r.eligible).map(r => r.id));
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

  const handleGenerate = async (registrationId: string) => {
    setIsGenerating(registrationId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/seminars/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          period: periodFilter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate');
      }

      setMessage({ type: 'success', text: 'Certificate generated successfully!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate certificate' });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSend = async (registrationId: string) => {
    setIsSending(registrationId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/seminars/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          period: periodFilter,
        }),
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

  const handleBulkGenerate = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Generate certificates for ${selectedIds.length} participants?`)) return;

    setIsBulkAction(true);
    setMessage(null);

    let generated = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch('/api/admin/seminars/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_id: id,
            period: periodFilter,
          }),
        });

        if (response.ok) {
          generated++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setMessage({
      type: generated > 0 ? 'success' : 'error',
      text: `Generated ${generated} certificates. ${failed > 0 ? `${failed} failed.` : ''}`,
    });
    setIsBulkAction(false);
    setSelectedIds([]);
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleBulkSend = async () => {
    const idsWithCerts = selectedIds.filter(id =>
      registrations.find(r => r.id === id)?.certificate
    );

    if (idsWithCerts.length === 0) {
      setMessage({ type: 'error', text: 'No certificates to send. Generate them first.' });
      return;
    }

    if (!confirm(`Send certificates to ${idsWithCerts.length} participants?`)) return;

    setIsBulkAction(true);
    setMessage(null);

    let sent = 0;
    let failed = 0;

    for (const id of idsWithCerts) {
      try {
        const response = await fetch('/api/admin/seminars/certificates/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_id: id,
            period: periodFilter,
          }),
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setMessage({
      type: sent > 0 ? 'success' : 'error',
      text: `Sent ${sent} certificates. ${failed > 0 ? `${failed} failed.` : ''}`,
    });
    setIsBulkAction(false);
    setSelectedIds([]);
    setTimeout(() => window.location.reload(), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AdminShell currentPath={currentPath} user={user} title="Seminar Certificates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seminar Certificates</h1>
            <p className="text-gray-600">Generate and send bi-annual CE credit certificates</p>
          </div>
          <a
            href="/admin/seminars/registrations"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            View Registrations
          </a>
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
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Period</label>
              <select
                value={periodFilter}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="first_half">January - June</option>
                <option value="second_half">July - December</option>
              </select>
            </div>
          </div>
        </div>

        {/* Period Label */}
        {seminarFilter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Certificate Period: {periodLabel}</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Certificates will be issued for CE credits earned during this period.
            </p>
          </div>
        )}

        {/* Stats */}
        {seminarFilter && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Total Registrations</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Eligible for Certificate</div>
              <div className="text-2xl font-bold text-green-600">{stats.eligible}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Certificates Generated</div>
              <div className="text-2xl font-bold text-blue-600">{stats.generated}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Certificates Sent</div>
              <div className="text-2xl font-bold text-purple-600">{stats.sent}</div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {seminarFilter && selectedIds.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkGenerate}
              disabled={isBulkAction}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isBulkAction ? 'Processing...' : 'Generate Certificates'}
            </button>
            <button
              onClick={handleBulkSend}
              disabled={isBulkAction}
              className="px-3 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isBulkAction ? 'Processing...' : 'Send Certificates'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Registrations Table */}
        {seminarFilter ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === registrations.filter(r => r.eligible).length && selectedIds.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions (Period)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.length > 0 ? (
                    registrations.map((reg) => (
                      <tr key={reg.id} className={`hover:bg-gray-50 ${!reg.eligible ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(reg.id)}
                            onChange={(e) => handleSelectOne(reg.id, e.target.checked)}
                            disabled={!reg.eligible}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {reg.user?.first_name} {reg.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reg.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{reg.sessions_in_period}</span>
                          <span className="text-gray-500"> / {reg.sessions_completed} total</span>
                        </td>
                        <td className="px-6 py-4">
                          {reg.credits_in_period > 0 ? (
                            <span className="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                              {reg.credits_in_period} CE
                            </span>
                          ) : (
                            <span className="text-gray-400">0 CE</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {reg.certificate?.sent_at ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Sent
                            </span>
                          ) : reg.certificate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Generated
                            </span>
                          ) : reg.eligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pending
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not eligible</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {reg.eligible && (
                            <div className="flex items-center gap-2">
                              {!reg.certificate ? (
                                <button
                                  onClick={() => handleGenerate(reg.id)}
                                  disabled={isGenerating === reg.id}
                                  className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                                >
                                  {isGenerating === reg.id ? 'Generating...' : 'Generate'}
                                </button>
                              ) : (
                                <>
                                  {reg.certificate.certificate_url && (
                                    <a
                                      href={reg.certificate.certificate_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                      View
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleGenerate(reg.id)}
                                    disabled={isGenerating === reg.id}
                                    className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50"
                                  >
                                    {isGenerating === reg.id ? '...' : 'Regenerate'}
                                  </button>
                                  <button
                                    onClick={() => handleSend(reg.id)}
                                    disabled={isSending === reg.id}
                                    className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50"
                                  >
                                    {isSending === reg.id ? 'Sending...' : 'Send'}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No registrations found for this seminar
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Seminar</h3>
            <p className="text-gray-500">
              Choose a seminar above to manage certificates for its participants
            </p>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">About Seminar Certificates</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Certificates are issued bi-annually (June 30 and December 31)</li>
            <li>Participants must have attended at least one session during the period to be eligible</li>
            <li>Each session awards 2 CE credits (up to 20 total for a 10-session seminar)</li>
            <li>Certificates can be regenerated if needed (e.g., name correction)</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
