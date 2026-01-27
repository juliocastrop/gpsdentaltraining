/**
 * Ticket Types Management Component - GPS Dental Training Admin
 * Create, edit, and delete ticket types for events
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string;
}

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  ticket_type: string;
  price: number;
  quantity: number | null;
  sale_start: string | null;
  sale_end: string | null;
  features: string[] | null;
  internal_label: string | null;
  manual_sold_out: boolean;
  status: string;
  created_at: string;
  event: Event;
  sold_count: number;
}

interface TicketTypesManagementProps {
  currentPath: string;
  user: { name: string; email: string };
  ticketTypes: TicketType[];
  events: Event[];
  eventFilter: string;
}

interface TicketTypeFormData {
  event_id: string;
  name: string;
  ticket_type: string;
  price: string;
  quantity: string;
  sale_start: string;
  sale_end: string;
  features: string;
  internal_label: string;
  manual_sold_out: boolean;
  status: string;
}

const emptyFormData: TicketTypeFormData = {
  event_id: '',
  name: '',
  ticket_type: 'general',
  price: '',
  quantity: '',
  sale_start: '',
  sale_end: '',
  features: '',
  internal_label: '',
  manual_sold_out: false,
  status: 'active',
};

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  early_bird: { label: 'Early Bird', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '🐦' },
  general: { label: 'General Admission', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🎫' },
  vip: { label: 'VIP', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '⭐' },
  group: { label: 'Group', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', icon: '👥' },
};

export default function TicketTypesManagement({
  currentPath,
  user,
  ticketTypes,
  events,
  eventFilter,
}: TicketTypesManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TicketTypeFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleFilterChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('event_id', value);
    } else {
      url.searchParams.delete('event_id');
    }
    window.location.href = url.toString();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ ...emptyFormData, event_id: eventFilter });
    setShowModal(true);
  };

  const openEditModal = (tt: TicketType) => {
    setEditingId(tt.id);
    setFormData({
      event_id: tt.event_id,
      name: tt.name,
      ticket_type: tt.ticket_type,
      price: tt.price.toString(),
      quantity: tt.quantity?.toString() || '',
      sale_start: tt.sale_start?.split('T')[0] || '',
      sale_end: tt.sale_end?.split('T')[0] || '',
      features: tt.features?.join('\n') || '',
      internal_label: tt.internal_label || '',
      manual_sold_out: tt.manual_sold_out,
      status: tt.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        event_id: formData.event_id,
        name: formData.name,
        ticket_type: formData.ticket_type,
        price: parseFloat(formData.price),
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        sale_start: formData.sale_start || null,
        sale_end: formData.sale_end || null,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
        internal_label: formData.internal_label || null,
        manual_sold_out: formData.manual_sold_out,
        status: formData.status,
      };

      const response = await fetch('/api/admin/ticket-types' + (editingId ? `/${editingId}` : ''), {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save ticket type');
      }

      setMessage({ type: 'success', text: `Ticket type ${editingId ? 'updated' : 'created'} successfully` });
      setShowModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save ticket type. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/ticket-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      setMessage({ type: 'success', text: 'Ticket type deleted successfully' });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete ticket type. It may have sold tickets.' });
    }
  };

  const handleToggleSoldOut = async (tt: TicketType) => {
    try {
      const response = await fetch(`/api/admin/ticket-types/${tt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_sold_out: !tt.manual_sold_out }),
      });

      if (!response.ok) throw new Error('Failed to update');
      window.location.reload();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update sold out status' });
    }
  };

  // Apply client-side filters
  const filteredTicketTypes = ticketTypes.filter((tt) => {
    if (typeFilter && tt.ticket_type !== typeFilter) return false;
    if (statusFilter === 'active' && (tt.status !== 'active' || tt.manual_sold_out)) return false;
    if (statusFilter === 'sold_out' && !tt.manual_sold_out && !(tt.quantity != null && tt.sold_count >= tt.quantity)) return false;
    if (statusFilter === 'inactive' && tt.status !== 'inactive') return false;
    return true;
  });

  const hasActiveFilters = typeFilter || statusFilter;

  // Stats (always from full dataset)
  const totalTicketTypes = ticketTypes.length;
  const activeCount = ticketTypes.filter(t => t.status === 'active' && !t.manual_sold_out).length;
  const soldOutCount = ticketTypes.filter(t => t.manual_sold_out || (t.quantity && t.sold_count >= t.quantity)).length;
  const totalSold = ticketTypes.reduce((sum, t) => sum + t.sold_count, 0);
  const totalRevenue = ticketTypes.reduce((sum, t) => sum + (t.sold_count * t.price), 0);

  return (
    <AdminShell currentPath={currentPath} user={user} title="Ticket Types">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Types</h1>
            <p className="text-gray-500 mt-1">Manage pricing and availability for your events</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Sold Tickets
            </a>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Ticket Type
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span className="text-lg">{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Types</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{totalTicketTypes}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{activeCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Sold Out</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{soldOutCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Tickets Sold</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalSold}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
            <div className="text-sm font-medium text-gray-500">Est. Revenue</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(totalRevenue)}</div>
          </div>
        </div>

        {/* Filters + View Toggle */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="filter-event" className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                id="filter-event"
                value={eventFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({formatDate(event.start_date)})
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="early_bird">Early Bird</option>
                <option value="general">General Admission</option>
                <option value="vip">VIP</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div className="min-w-[140px]">
              <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="sold_out">Sold Out</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {(eventFilter || hasActiveFilters) && (
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            )}
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                title="List view"
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                title="Grid view"
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Active filter count */}
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-500">
              Showing {filteredTicketTypes.length} of {ticketTypes.length} ticket types
            </div>
          )}
        </div>

        {/* Ticket Types */}
        {filteredTicketTypes.length > 0 ? (
          viewMode === 'list' ? (
            /* ===== LIST VIEW ===== */
            <div className="space-y-4">
              {filteredTicketTypes.map((tt) => {
                const isSoldOut = tt.manual_sold_out || (tt.quantity != null && tt.sold_count >= tt.quantity);
                const soldPercentage = tt.quantity ? Math.round((tt.sold_count / tt.quantity) * 100) : 0;
                const config = typeConfig[tt.ticket_type] || typeConfig.general;
                const isOnSale = (() => {
                  if (!tt.sale_start && !tt.sale_end) return true;
                  const now = new Date();
                  if (tt.sale_start && now < new Date(tt.sale_start)) return false;
                  if (tt.sale_end && now > new Date(tt.sale_end)) return false;
                  return true;
                })();

                return (
                  <div
                    key={tt.id}
                    className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
                      isSoldOut ? 'border-red-200 bg-red-50/30' :
                      tt.status !== 'active' ? 'border-gray-200 opacity-60' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Left: Type indicator */}
                      <div className={`flex items-center justify-center lg:w-16 py-2 lg:py-0 border-b lg:border-b-0 lg:border-r ${config.bg}`}>
                        <span className="text-2xl">{config.icon}</span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900">{tt.name}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.bg} ${config.color}`}>
                                {config.label}
                              </span>
                              {isSoldOut && (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                                  Sold Out
                                </span>
                              )}
                              {tt.status !== 'active' && !isSoldOut && (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  Inactive
                                </span>
                              )}
                              {tt.status === 'active' && !isSoldOut && isOnSale && (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                                  On Sale
                                </span>
                              )}
                            </div>

                            {tt.internal_label && (
                              <p className="text-sm text-gray-500 mt-1">{tt.internal_label}</p>
                            )}

                            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <a href={`/admin/events/${tt.event?.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                {tt.event?.title || 'Unknown Event'}
                              </a>
                            </div>

                            {/* Features */}
                            {tt.features && tt.features.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {tt.features.slice(0, 3).map((feature, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">
                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {feature}
                                  </span>
                                ))}
                                {tt.features.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-400">
                                    +{tt.features.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price & Sales */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2 lg:min-w-[180px]">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{formatPrice(tt.price)}</div>
                              <div className="text-xs text-gray-500 mt-0.5">per ticket</div>
                            </div>

                            {/* Sold progress */}
                            <div className="text-right min-w-[120px]">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-sm font-medium text-gray-700">
                                  {tt.sold_count} / {tt.quantity ?? '∞'}
                                </span>
                                <span className="text-xs text-gray-400">sold</span>
                              </div>
                              {tt.quantity != null && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      soldPercentage >= 90 ? 'bg-red-500' :
                                      soldPercentage >= 70 ? 'bg-amber-500' :
                                      soldPercentage >= 40 ? 'bg-blue-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer: Sale period + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                          {/* Sale Period */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tt.sale_start || tt.sale_end ? (
                              <span>
                                {tt.sale_start ? formatDate(tt.sale_start) : 'Now'}
                                {' — '}
                                {tt.sale_end ? formatDate(tt.sale_end) : 'No end date'}
                              </span>
                            ) : (
                              <span>Always available</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(tt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSoldOut(tt)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                                tt.manual_sold_out
                                  ? 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
                                  : 'text-orange-700 bg-orange-50 border-orange-300 hover:bg-orange-100'
                              }`}
                            >
                              {tt.manual_sold_out ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Reactivate
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Mark Sold Out
                                </>
                              )}
                            </button>
                            {tt.sold_count === 0 && (
                              <button
                                type="button"
                                onClick={() => handleDelete(tt.id, tt.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ===== GRID VIEW ===== */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTicketTypes.map((tt) => {
                const isSoldOut = tt.manual_sold_out || (tt.quantity != null && tt.sold_count >= tt.quantity);
                const soldPercentage = tt.quantity ? Math.round((tt.sold_count / tt.quantity) * 100) : 0;
                const config = typeConfig[tt.ticket_type] || typeConfig.general;
                const isOnSale = (() => {
                  if (!tt.sale_start && !tt.sale_end) return true;
                  const now = new Date();
                  if (tt.sale_start && now < new Date(tt.sale_start)) return false;
                  if (tt.sale_end && now > new Date(tt.sale_end)) return false;
                  return true;
                })();

                return (
                  <div
                    key={tt.id}
                    className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md flex flex-col ${
                      isSoldOut ? 'border-red-200 bg-red-50/30' :
                      tt.status !== 'active' ? 'border-gray-200 opacity-60' :
                      'border-gray-200'
                    }`}
                  >
                    {/* Type header bar */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${config.bg}`}>
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                      <div className="flex-1" />
                      {isSoldOut && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                          SOLD OUT
                        </span>
                      )}
                      {tt.status !== 'active' && !isSoldOut && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          INACTIVE
                        </span>
                      )}
                      {tt.status === 'active' && !isSoldOut && isOnSale && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                          ON SALE
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4 flex-1 flex flex-col">
                      {/* Name & Price */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">{tt.name}</h3>
                        <div className="text-xl font-bold text-gray-900 whitespace-nowrap">{formatPrice(tt.price)}</div>
                      </div>

                      {/* Event */}
                      <a href={`/admin/events/${tt.event?.id}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1.5 truncate block">
                        {tt.event?.title || 'Unknown Event'}
                      </a>

                      {tt.internal_label && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{tt.internal_label}</p>
                      )}

                      {/* Sold progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Sold</span>
                          <span className="font-medium text-gray-700">
                            {tt.sold_count} / {tt.quantity ?? '∞'}
                          </span>
                        </div>
                        {tt.quantity != null && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                soldPercentage >= 90 ? 'bg-red-500' :
                                soldPercentage >= 70 ? 'bg-amber-500' :
                                soldPercentage >= 40 ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Features (compact) */}
                      {tt.features && tt.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {tt.features.slice(0, 2).map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] bg-gray-100 text-gray-500 rounded">
                              <svg className="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </span>
                          ))}
                          {tt.features.length > 2 && (
                            <span className="text-[11px] text-gray-400 px-1">+{tt.features.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Sale period */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tt.sale_start || tt.sale_end ? (
                          <span>
                            {tt.sale_start ? formatDate(tt.sale_start) : 'Now'}
                            {' — '}
                            {tt.sale_end ? formatDate(tt.sale_end) : 'No end'}
                          </span>
                        ) : (
                          <span>Always available</span>
                        )}
                      </div>

                      {/* Spacer to push actions to bottom */}
                      <div className="flex-1" />

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(tt)}
                          title="Edit"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSoldOut(tt)}
                          title={tt.manual_sold_out ? 'Reactivate' : 'Mark Sold Out'}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
                            tt.manual_sold_out
                              ? 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
                              : 'text-orange-700 bg-orange-50 border-orange-300 hover:bg-orange-100'
                          }`}
                        >
                          {tt.manual_sold_out ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          )}
                        </button>
                        {tt.sold_count === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tt.id, tt.name)}
                            title="Delete"
                            className="inline-flex items-center justify-center p-1.5 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No matching ticket types' : 'No ticket types found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : eventFilter
                  ? 'No ticket types for this event. Create one to start selling.'
                  : 'Create your first ticket type to start selling for events.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => { setTypeFilter(''); setStatusFilter(''); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Ticket Type
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Ticket Type' : 'Create Ticket Type'}
                </h2>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Event */}
                <div>
                  <label htmlFor="modal-event" className="block text-sm font-medium text-gray-700 mb-1.5">Event *</label>
                  <select
                    id="modal-event"
                    value={formData.event_id}
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({formatDate(event.start_date)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Early Bird Special"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Type and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modal-ticket-type" className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Type *</label>
                    <select
                      id="modal-ticket-type"
                      value={formData.ticket_type}
                      onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="early_bird">Early Bird</option>
                      <option value="general">General Admission</option>
                      <option value="vip">VIP</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="1,995.00"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      id="modal-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Sale Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Period</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-sale-start" className="block text-xs text-gray-400 mb-1">Start Date</label>
                      <input
                        id="modal-sale-start"
                        type="date"
                        value={formData.sale_start}
                        onChange={(e) => setFormData({ ...formData, sale_start: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-sale-end" className="block text-xs text-gray-400 mb-1">End Date</label>
                      <input
                        id="modal-sale-end"
                        type="date"
                        value={formData.sale_end}
                        onChange={(e) => setFormData({ ...formData, sale_end: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Internal Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Label</label>
                  <input
                    type="text"
                    value={formData.internal_label}
                    onChange={(e) => setFormData({ ...formData, internal_label: e.target.value })}
                    placeholder="Internal reference (not shown to customers)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Only visible to administrators</p>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Features (one per line)</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={3}
                    placeholder={"Full course access\nLunch included\nCertificate of completion"}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Manual Sold Out */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.manual_sold_out}
                    onChange={(e) => setFormData({ ...formData, manual_sold_out: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Mark as sold out</div>
                    <div className="text-xs text-gray-400">Manually override availability regardless of remaining stock</div>
                  </div>
                </label>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Ticket Type')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
