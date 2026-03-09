/**
 * Pages Management Component - GPS Dental Training Admin
 * List, create, and manage CMS pages
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface Page {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  content: any;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PagesManagementProps {
  currentPath: string;
  user: { name: string; email: string };
  pages: Page[];
}

// System pages have dedicated Astro layouts; slug can't be changed
const SYSTEM_SLUGS: Record<string, string> = {
  about: 'About Us',
  contact: 'Contact',
};

export default function PagesManagement({ currentPath, user, pages: initialPages }: PagesManagementProps) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          slug: createSlug || generateSlug(createTitle),
          status: 'draft',
          content: { sections: [] },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create page');

      // Redirect to edit page
      window.location.href = `/admin/pages/${result.data.id}`;
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Are you sure you want to delete "${page.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete page');

      setPages(prev => prev.filter(p => p.id !== page.id));
      setMessage({ type: 'success', text: `"${page.title}" deleted successfully` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete page' });
    }
  };

  const handleStatusToggle = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: newStatus } : p));
    } catch {
      setMessage({ type: 'error', text: 'Failed to update page status' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // Filter pages
  const filteredPages = pages.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-amber-100 text-amber-700 border-amber-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <AdminShell currentPath={currentPath} user={user} title="Pages">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="text-gray-500 mt-1">Manage static content pages (Terms, Privacy, About, etc.)</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowCreateModal(true); setCreateTitle(''); setCreateSlug(''); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Page
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span className="text-lg">{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Pages</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{pages.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Published</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{pages.filter(p => p.status === 'published').length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Draft</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pages.filter(p => p.status === 'draft').length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Archived</div>
            <div className="text-2xl font-bold text-gray-500 mt-1">{pages.filter(p => p.status === 'archived').length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search-pages" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="search-pages"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or slug..."
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pages List */}
        {filteredPages.length > 0 ? (
          <div className="space-y-3">
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`/admin/pages/${page.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {page.title}
                      </a>
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[page.status] || statusColors.draft}`}>
                        {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                      </span>
                      {SYSTEM_SLUGS[page.slug] && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-indigo-50 border-indigo-200 text-indigo-700">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          System
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        /{page.slug}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(page.updated_at)}
                      </span>
                      {page.content?.sections?.length > 0 && (
                        <span className="text-gray-400">
                          {page.content.sections.length} section{page.content.sections.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {page.status === 'published' && (
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                    )}
                    <a
                      href={`/admin/pages/${page.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(page)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                        page.status === 'published'
                          ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
                          : 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
                      }`}
                    >
                      {page.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    {!SYSTEM_SLUGS[page.slug] && (
                    <button
                      type="button"
                      onClick={() => handleDelete(page)}
                      className="inline-flex items-center p-1.5 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4 text-gray-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search || statusFilter ? 'No matching pages' : 'No pages yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {search || statusFilter
                ? 'Try adjusting your filters.'
                : 'Create your first page to start managing content.'}
            </p>
            {!(search || statusFilter) && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Page
              </button>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Create New Page</h2>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title *</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => {
                      setCreateTitle(e.target.value);
                      if (!createSlug || createSlug === generateSlug(createTitle)) {
                        setCreateSlug(generateSlug(e.target.value));
                      }
                    }}
                    required
                    placeholder="e.g., Terms and Conditions"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">/</span>
                    <input
                      type="text"
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required
                      placeholder="terms-and-conditions"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This will be the URL path for the page</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create & Edit'}
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
