/**
 * Seminar Detail Component - GPS Dental Training Admin
 * Display and manage individual seminar details
 */
import { useState, useRef } from 'react';
import AdminShell from './AdminShell';

interface Speaker {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
}

interface Moderator {
  id: string;
  role: string;
  display_order: number;
  speaker: Speaker | null;
}

interface SeminarSession {
  id: string;
  seminar_id: string;
  session_number: number;
  session_date: string;
  session_time_start: string | null;
  session_time_end: string | null;
  topic: string | null;
  description: string | null;
}

interface Registration {
  id: string;
  user_id: string;
  status: string;
  sessions_completed: number;
  sessions_remaining: number;
  registered_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Seminar {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number;
  price: number;
  capacity: number | null;
  total_sessions: number;
  credits_per_session: number;
  total_credits: number;
  status: string;
  layout_template: string | null;
  featured_image_url: string | null;
  hero_image_url: string | null;
  subtitle: string | null;
  program_description: string | null;
  benefits: string[] | null;
  agenda_items: any[] | null;
  membership_policy: string | null;
  refund_policy: string | null;
  venue: string | null;
  address: string | null;
  contact_email: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface SeminarFormData {
  title: string;
  slug: string;
  subtitle: string;
  year: string;
  price: string;
  capacity: string;
  total_sessions: string;
  credits_per_session: string;
  status: string;
  layout_template: string;
  featured_image_url: string;
  hero_image_url: string;
  program_description: string;
  venue: string;
  address: string;
  contact_email: string;
  membership_policy: string;
  refund_policy: string;
  benefits: string;
}

interface SeminarDetailProps {
  currentPath: string;
  user: { name: string; email: string };
  seminar: Seminar;
  sessions: SeminarSession[];
  registrations: Registration[];
  moderators: Moderator[];
  allSpeakers: Speaker[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function SeminarDetail({
  currentPath,
  user,
  seminar,
  sessions: initialSessions,
  registrations,
  moderators: initialModerators,
  allSpeakers,
}: SeminarDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'registrations' | 'moderators'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SeminarSession[]>(initialSessions || []);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SeminarSession | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    session_number: '',
    session_date: '',
    session_time_start: '',
    session_time_end: '',
    topic: '',
    description: '',
  });

  // Moderators state
  const [moderators, setModerators] = useState<Moderator[]>(initialModerators || []);
  const [showModeratorPicker, setShowModeratorPicker] = useState(false);
  const [isSavingModerators, setIsSavingModerators] = useState(false);
  const [moderatorMessage, setModeratorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<SeminarFormData>({
    title: seminar.title || '',
    slug: seminar.slug || '',
    subtitle: seminar.subtitle || '',
    year: String(seminar.year || new Date().getFullYear()),
    price: String(seminar.price || 750),
    capacity: seminar.capacity ? String(seminar.capacity) : '',
    total_sessions: String(seminar.total_sessions || 10),
    credits_per_session: String(seminar.credits_per_session || 2),
    status: seminar.status || 'draft',
    layout_template: seminar.layout_template || 'modern',
    featured_image_url: seminar.featured_image_url || '',
    hero_image_url: seminar.hero_image_url || '',
    program_description: seminar.program_description || '',
    venue: seminar.venue || '',
    address: seminar.address || '',
    contact_email: seminar.contact_email || '',
    membership_policy: seminar.membership_policy || '',
    refund_policy: seminar.refund_policy || '',
    benefits: (seminar.benefits || []).join('\n'),
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const toArray = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);

      const payload = {
        title: formData.title,
        slug: formData.slug,
        subtitle: formData.subtitle || null,
        year: parseInt(formData.year),
        price: parseFloat(formData.price) || 750,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        total_sessions: parseInt(formData.total_sessions) || 10,
        credits_per_session: parseInt(formData.credits_per_session) || 2,
        total_credits: (parseInt(formData.total_sessions) || 10) * (parseInt(formData.credits_per_session) || 2),
        status: formData.status,
        layout_template: formData.layout_template,
        featured_image_url: formData.featured_image_url || null,
        hero_image_url: formData.hero_image_url || null,
        program_description: formData.program_description || null,
        venue: formData.venue || null,
        address: formData.address || null,
        contact_email: formData.contact_email || null,
        membership_policy: formData.membership_policy || null,
        refund_policy: formData.refund_policy || null,
        benefits: toArray(formData.benefits),
      };

      const response = await fetch(`/api/admin/seminars/${seminar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update seminar');
      }

      setMessage({ type: 'success', text: 'Seminar updated successfully' });
      setShowEditModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update seminar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (file: File, type: 'featured' | 'hero') => {
    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'seminars');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (type === 'featured') {
        setFormData(prev => ({ ...prev, featured_image_url: result.url }));
      } else {
        setFormData(prev => ({ ...prev, hero_image_url: result.url }));
      }
    } catch (err) {
      setImageUploadError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Moderator management
  const handleAddModerator = (speakerId: string) => {
    const speaker = allSpeakers.find(s => s.id === speakerId);
    if (!speaker) return;

    const alreadyAdded = moderators.some(m => m.speaker?.id === speakerId);
    if (alreadyAdded) return;

    setModerators(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'moderator',
        display_order: prev.length,
        speaker,
      },
    ]);
  };

  const handleRemoveModerator = (speakerId: string) => {
    setModerators(prev => prev.filter(m => m.speaker?.id !== speakerId));
  };

  const handleSaveModerators = async () => {
    setIsSavingModerators(true);
    setModeratorMessage(null);

    try {
      const response = await fetch(`/api/admin/seminars/${seminar.id}/moderators`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderators: moderators.map((m, index) => ({
            speaker_id: m.speaker?.id,
            role: m.role || 'moderator',
            display_order: index,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save moderators');
      }

      setModeratorMessage({ type: 'success', text: 'Moderators saved successfully' });
    } catch (err) {
      setModeratorMessage({ type: 'error', text: 'Failed to save moderators' });
    } finally {
      setIsSavingModerators(false);
    }
  };

  // Session management
  const openSessionModal = (session?: SeminarSession) => {
    if (session) {
      setEditingSession(session);
      setSessionFormData({
        session_number: String(session.session_number),
        session_date: session.session_date,
        session_time_start: session.session_time_start || '',
        session_time_end: session.session_time_end || '',
        topic: session.topic || '',
        description: session.description || '',
      });
    } else {
      setEditingSession(null);
      const nextNumber = sessions.length > 0
        ? Math.max(...sessions.map(s => s.session_number)) + 1
        : 1;
      setSessionFormData({
        session_number: String(nextNumber),
        session_date: '',
        session_time_start: '',
        session_time_end: '',
        topic: '',
        description: '',
      });
    }
    setShowSessionModal(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSession(true);
    setSessionMessage(null);

    try {
      const payload = {
        seminar_id: seminar.id,
        session_number: parseInt(sessionFormData.session_number),
        session_date: sessionFormData.session_date,
        session_time_start: sessionFormData.session_time_start || null,
        session_time_end: sessionFormData.session_time_end || null,
        topic: sessionFormData.topic || null,
        description: sessionFormData.description || null,
      };

      let response;
      if (editingSession) {
        response = await fetch(`/api/admin/seminars/sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/admin/seminars/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save session');
      }

      // Update local state
      if (editingSession) {
        setSessions(prev => prev.map(s => s.id === editingSession.id ? result.data : s));
      } else {
        setSessions(prev => [...prev, result.data].sort((a, b) => a.session_number - b.session_number));
      }

      setSessionMessage({ type: 'success', text: editingSession ? 'Session updated' : 'Session created' });
      setShowSessionModal(false);
    } catch (err) {
      setSessionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save session' });
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`/api/admin/seminars/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete session');
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSessionMessage({ type: 'success', text: 'Session deleted' });
    } catch (err) {
      setSessionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete session' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sessions', label: 'Sessions', count: sessions.length },
    { id: 'registrations', label: 'Registrations', count: registrations.length },
    { id: 'moderators', label: 'Moderators', count: moderators.length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Completed</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Draft</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  return (
    <AdminShell
      title={seminar.title}
      subtitle={`${seminar.year} • ${seminar.total_sessions || 10} Sessions • ${seminar.total_credits || 20} CE Credits`}
      currentPath={currentPath}
      user={user}
      actions={
        <div className="flex items-center gap-3">
          <a
            href={`/monthly-seminars/${seminar.slug}`}
            target="_blank"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Page
          </a>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Seminar
          </button>
        </div>
      }
    >
      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#0B52AC] text-[#0B52AC]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-[#0B52AC]/10' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[#0C2044]">Seminar Overview</h3>
                {getStatusBadge(seminar.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="text-2xl font-bold text-[#0C2044]">{seminar.year}</p>
                </div>
                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-2xl font-bold text-[#0C2044]">${seminar.price}</p>
                </div>
                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm text-gray-500">Sessions</p>
                  <p className="text-2xl font-bold text-[#0C2044]">{seminar.total_sessions || 10}</p>
                </div>
                <div className="p-4 bg-[#DDC89D]/20 rounded-lg">
                  <p className="text-sm text-gray-500">Total CE</p>
                  <p className="text-2xl font-bold text-[#0C2044]">{seminar.total_credits || 20}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {seminar.program_description && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-[#0C2044] mb-4">Program Description</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: seminar.program_description }}
                />
              </div>
            )}

            {/* Benefits */}
            {seminar.benefits && seminar.benefits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-[#0C2044] mb-4">Benefits</h3>
                <ul className="space-y-2">
                  {seminar.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-[#0C2044] mb-4">Display Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Layout Template</span>
                  <span className="font-medium text-[#0C2044] capitalize">{seminar.layout_template || 'modern'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slug</span>
                  <span className="font-medium text-[#0C2044]">{seminar.slug}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-[#0C2044] mb-4">Contact Info</h3>
              <div className="space-y-3 text-sm">
                {seminar.venue && (
                  <div>
                    <p className="text-gray-500">Venue</p>
                    <p className="font-medium text-[#0C2044]">{seminar.venue}</p>
                  </div>
                )}
                {seminar.address && (
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-[#0C2044]">{seminar.address}</p>
                  </div>
                )}
                {seminar.contact_email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-[#0B52AC]">{seminar.contact_email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-[#0C2044] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href={`/admin/seminars/${seminar.id}/attendance`}
                  className="w-full px-4 py-2 bg-[#F8F9FA] text-[#0C2044] font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Manage Attendance
                </a>
                <a
                  href={`/admin/seminars/${seminar.id}/certificates`}
                  className="w-full px-4 py-2 bg-[#F8F9FA] text-[#0C2044] font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Certificates
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Session Message */}
          {sessionMessage && (
            <div className={`p-4 rounded-lg ${sessionMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {sessionMessage.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-[#0C2044]">Session Schedule</h3>
              <button
                onClick={() => openSessionModal()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#0B52AC] rounded-lg hover:bg-[#0C2044] transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Session
              </button>
            </div>
            {sessions.length > 0 ? (
              <div className="divide-y">
                {sessions.map((session) => {
                  const sessionDate = new Date(session.session_date);
                  const isPast = sessionDate < new Date();

                  return (
                    <div key={session.id} className={`p-4 flex items-center gap-4 ${isPast ? 'bg-gray-50' : ''}`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        isPast ? 'bg-green-100 text-green-600' : 'bg-[#0B52AC]/10 text-[#0B52AC]'
                      }`}>
                        {isPast ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          session.session_number
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0C2044]">Session {session.session_number}</p>
                        {session.topic && <p className="text-sm text-gray-500">{session.topic}</p>}
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-medium text-[#0C2044]">{formatDate(session.session_date)}</p>
                        {session.session_time_start && (
                          <p className="text-sm text-gray-500">
                            {formatTime(session.session_time_start)}
                            {session.session_time_end && ` - ${formatTime(session.session_time_end)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openSessionModal(session)}
                          className="p-2 text-gray-400 hover:text-[#0B52AC] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No sessions scheduled yet</p>
                <button
                  onClick={() => openSessionModal()}
                  className="mt-4 px-4 py-2 text-sm font-medium text-[#0B52AC] bg-[#0B52AC]/10 rounded-lg hover:bg-[#0B52AC]/20 transition-colors"
                >
                  Add your first session
                </button>
              </div>
            )}
          </div>

          {/* Session Modal */}
          {showSessionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-[#0C2044]">
                    {editingSession ? 'Edit Session' : 'Add New Session'}
                  </h3>
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSaveSession} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session # <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={sessionFormData.session_number}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, session_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                        min={1}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={sessionFormData.session_date}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={sessionFormData.session_time_start}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, session_time_start: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={sessionFormData.session_time_end}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, session_time_end: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <input
                      type="text"
                      value={sessionFormData.topic}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, topic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                      placeholder="e.g., Literature Review - Implants"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={sessionFormData.description}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Optional session description..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowSessionModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSession || !sessionFormData.session_date}
                      className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingSession ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        editingSession ? 'Update Session' : 'Create Session'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-[#0C2044]">Registrations</h3>
            <span className="text-sm text-gray-500">{registrations.length} total</span>
          </div>
          {registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-[#0C2044]">
                        {reg.user ? `${reg.user.first_name} ${reg.user.last_name}` : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {reg.user?.email || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-[#0B52AC] rounded-full"
                              style={{ width: `${(reg.sessions_completed / (seminar.total_sessions || 10)) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {reg.sessions_completed}/{seminar.total_sessions || 10}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          reg.status === 'active' ? 'bg-green-100 text-green-700' :
                          reg.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(reg.registered_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No registrations yet
            </div>
          )}
        </div>
      )}

      {activeTab === 'moderators' && (
        <div className="space-y-6">
          {/* Moderator Message */}
          {moderatorMessage && (
            <div className={`p-4 rounded-lg ${moderatorMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {moderatorMessage.text}
            </div>
          )}

          {/* Current Moderators */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-[#0C2044]">Moderators</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModeratorPicker(true)}
                  className="px-3 py-1.5 text-sm font-medium text-[#0B52AC] bg-[#0B52AC]/10 rounded-lg hover:bg-[#0B52AC]/20 transition-colors"
                >
                  Add Moderator
                </button>
                {moderators.length > 0 && (
                  <button
                    onClick={handleSaveModerators}
                    disabled={isSavingModerators}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-[#0B52AC] rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50"
                  >
                    {isSavingModerators ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
            {moderators.length > 0 ? (
              <div className="divide-y">
                {moderators.map((mod) => (
                  <div key={mod.id} className="p-4 flex items-center gap-4">
                    {mod.speaker?.photo_url ? (
                      <img
                        src={mod.speaker.photo_url}
                        alt={mod.speaker.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0B52AC]/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-[#0B52AC]">
                          {mod.speaker?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-[#0C2044]">{mod.speaker?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{mod.speaker?.title || 'No title'}</p>
                    </div>
                    <select
                      value={mod.role}
                      onChange={(e) => {
                        setModerators(prev => prev.map(m =>
                          m.id === mod.id ? { ...m, role: e.target.value } : m
                        ));
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="co_moderator">Co-Moderator</option>
                      <option value="guest_speaker">Guest Speaker</option>
                    </select>
                    <button
                      onClick={() => handleRemoveModerator(mod.speaker?.id || '')}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No moderators assigned yet
              </div>
            )}
          </div>

          {/* Moderator Picker Modal */}
          {showModeratorPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-[#0C2044]">Select Speaker</h3>
                  <button
                    onClick={() => setShowModeratorPicker(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                  {allSpeakers.map((speaker) => {
                    const isAdded = moderators.some(m => m.speaker?.id === speaker.id);
                    return (
                      <button
                        key={speaker.id}
                        onClick={() => {
                          handleAddModerator(speaker.id);
                          setShowModeratorPicker(false);
                        }}
                        disabled={isAdded}
                        className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                          isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        {speaker.photo_url ? (
                          <img
                            src={speaker.photo_url}
                            alt={speaker.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#0B52AC]/10 flex items-center justify-center">
                            <span className="font-bold text-[#0B52AC]">{speaker.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-[#0C2044]">{speaker.name}</p>
                          {speaker.title && <p className="text-sm text-gray-500">{speaker.title}</p>}
                        </div>
                        {isAdded && (
                          <span className="ml-auto text-xs text-gray-400">Added</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-[#0C2044]">Edit Seminar</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    required
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="A brief description shown under the title"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                {/* Total Sessions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions</label>
                  <input
                    type="number"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  />
                </div>

                {/* Credits Per Session */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CE Credits per Session</label>
                  <input
                    type="number"
                    value={formData.credits_per_session}
                    onChange={(e) => setFormData({ ...formData, credits_per_session: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Layout Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Layout Template</label>
                  <select
                    value={formData.layout_template}
                    onChange={(e) => setFormData({ ...formData, layout_template: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="e.g., GPS Training Center"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                  />
                </div>

                {/* Featured Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                {/* Hero Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                  <input
                    type="url"
                    value={formData.hero_image_url}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                {/* Benefits */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="Literature Review Sessions&#10;Case Discussions&#10;Treatment Planning"
                  />
                </div>

                {/* Refund Policy */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Policy</label>
                  <textarea
                    value={formData.refund_policy}
                    onChange={(e) => setFormData({ ...formData, refund_policy: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent"
                    placeholder="Tuition is non-refundable..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0B52AC] text-white font-medium rounded-lg hover:bg-[#0C2044] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
