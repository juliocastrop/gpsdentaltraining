/**
 * Tickets Management Component - GPS Dental Training Admin
 * View and manage all purchased tickets
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  billing_email: string;
}

interface Ticket {
  id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  created_at: string;
  qr_code_url: string | null;
  event: Event;
  ticket_type: TicketType;
  order: Order;
}

interface TicketsManagementProps {
  currentPath: string;
  user: { name: string; email: string };
  tickets: Ticket[];
  events: Event[];
  eventFilter: string;
  statusFilter: string;
}

export default function TicketsManagement({
  currentPath,
  user,
  tickets,
  events,
  eventFilter,
  statusFilter,
}: TicketsManagementProps) {
  const [isResending, setIsResending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResendEmail = async (ticketId: string, ticketCode: string) => {
    if (!confirm(`Resend ticket email for ${ticketCode}?`)) return;

    setIsResending(ticketId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/tickets/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend email');
      }

      setMessage({ type: 'success', text: `Email resent successfully for ticket ${ticketCode}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resend email. Please try again.' });
    } finally {
      setIsResending(null);
    }
  };

  const handleFilterChange = (type: 'event' | 'status', value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(type === 'event' ? 'event_id' : 'status', value);
    } else {
      url.searchParams.delete(type === 'event' ? 'event_id' : 'status');
    }
    window.location.href = url.toString();
  };

  // Stats
  const totalTickets = tickets.length;
  const validTickets = tickets.filter(t => t.status === 'valid').length;
  const usedTickets = tickets.filter(t => t.status === 'used').length;
  const totalRevenue = tickets
    .filter(t => t.status !== 'cancelled')
    .reduce((sum, t) => sum + (t.ticket_type?.price || 0), 0);

  return (
    <AdminShell currentPath={currentPath} user={user} title="Tickets Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchased Tickets</h1>
            <p className="text-gray-600">View and manage all ticket purchases</p>
          </div>
          <a
            href="/admin/ticket-types"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Manage Ticket Types
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900">{totalTickets}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Valid</div>
            <div className="text-2xl font-bold text-green-600">{validTickets}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Checked In</div>
            <div className="text-2xl font-bold text-blue-600">{usedTickets}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event</label>
              <select
                value={eventFilter}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.title}</option>
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
                <option value="valid">Valid</option>
                <option value="used">Used (Checked In)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {(eventFilter || statusFilter) && (
              <div className="flex items-end">
                <button
                  onClick={() => window.location.href = '/admin/tickets'}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium">{ticket.ticket_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/admin/events/${ticket.event?.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {ticket.event?.title || 'Unknown Event'}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div>{ticket.ticket_type?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {ticket.ticket_type?.price ? formatPrice(ticket.ticket_type.price) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{ticket.attendee_name}</div>
                        <div className="text-sm text-gray-500">{ticket.attendee_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResendEmail(ticket.id, ticket.ticket_code)}
                            disabled={isResending === ticket.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                          >
                            {isResending === ticket.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                            Resend
                          </button>
                          {ticket.qr_code_url && (
                            <a
                              href={ticket.qr_code_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              QR
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No tickets found
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
