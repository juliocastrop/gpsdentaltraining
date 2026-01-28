/**
 * Event Detail Component - GPS Dental Training Admin
 * Display and manage individual event details
 */
import { useState, useRef } from 'react';
import AdminShell from './AdminShell';

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold_count: number;
  status: string;
}

interface Ticket {
  id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  created_at: string;
  ticket_type: {
    name: string;
    price: number;
  };
}

interface AttendanceRecord {
  id: string;
  checked_in_at: string;
  check_in_method: string;
  ticket: {
    attendee_name: string;
    attendee_email: string;
    ticket_code: string;
  };
}

interface WaitlistEntry {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
  notified_at: string | null;
}

interface ScheduleTopicItem {
  name: string;
  start_time: string;
  end_time: string;
  speakers: string[];
  location: string;
  description: string;
}

interface EventSchedule {
  id: string;
  event_id: string;
  schedule_date: string;
  tab_label: string | null;
  topics: ScheduleTopicItem[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SpeakerOption {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
}

interface EventSponsor {
  name: string;
  logo_url: string;
  website_url: string;
}

interface EventAccreditation {
  name: string;
  logo_url: string;
  text: string;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  start_date: string;
  end_date: string;
  venue: string;
  address: string;
  ce_credits: number;
  capacity: number;
  featured_image_url: string;
  video_url: string | null;
  gallery_images: string[] | null;
  learning_objectives: string[] | null;
  includes: string[] | null;
  prerequisites: string[] | null;
  target_audience: string[] | null;
  sponsors: EventSponsor[] | null;
  accreditation: EventAccreditation[] | null;
  status: string;
  speakers: Array<{ speaker: Speaker }>;
}

interface EventDetailProps {
  currentPath: string;
  user: { name: string; email: string };
  event: Event;
  ticketTypes: TicketType[];
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  waitlist: WaitlistEntry[];
  schedules: EventSchedule[];
  allSpeakers: SpeakerOption[];
}

interface EventFormData {
  title: string;
  slug: string;
  excerpt: string;
  start_date: string;
  end_date: string;
  venue: string;
  address: string;
  ce_credits: string;
  capacity: string;
  featured_image_url: string;
  video_url: string;
  status: string;
  learning_objectives: string;
  includes: string;
  prerequisites: string;
  target_audience: string;
  layout_template: string;
}

export default function EventDetail({
  currentPath,
  user,
  event,
  ticketTypes,
  tickets,
  attendance,
  waitlist,
  schedules: initialSchedules,
  allSpeakers,
}: EventDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'tickets' | 'attendance' | 'waitlist'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Schedule state
  const [schedules, setSchedules] = useState<EventSchedule[]>(initialSchedules || []);
  const [activeScheduleDay, setActiveScheduleDay] = useState(0);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Event speakers state
  const [eventSpeakers, setEventSpeakers] = useState<string[]>(
    (event.speakers || []).map(s => s.speaker?.id).filter(Boolean)
  );
  const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
  const [speakerMessage, setSpeakerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);

  // Featured image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>(event.gallery_images || []);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sponsors & Accreditation state
  const [sponsors, setSponsors] = useState<EventSponsor[]>(event.sponsors || []);
  const [accreditations, setAccreditations] = useState<EventAccreditation[]>(event.accreditation || []);
  const [isSavingSponsors, setIsSavingSponsors] = useState(false);
  const [sponsorMessage, setSponsorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingSponsorLogo, setIsUploadingSponsorLogo] = useState<number | null>(null);
  const [isUploadingAccredLogo, setIsUploadingAccredLogo] = useState<number | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: event.title || '',
    slug: event.slug || '',
    excerpt: event.excerpt || '',
    start_date: event.start_date?.split('T')[0] || '',
    end_date: event.end_date?.split('T')[0] || '',
    venue: event.venue || '',
    address: event.address || '',
    ce_credits: String(event.ce_credits || 0),
    capacity: event.capacity ? String(event.capacity) : '',
    featured_image_url: event.featured_image_url || '',
    video_url: event.video_url || '',
    status: event.status || 'draft',
    learning_objectives: (event.learning_objectives || []).join('\n'),
    includes: (event.includes || []).join('\n'),
    prerequisites: (event.prerequisites || []).join('\n'),
    target_audience: (event.target_audience || []).join('\n'),
    layout_template: event.layout_template || 'modern',
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Convert newline-separated strings to arrays, filtering empty lines
      const toArray = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);

      const payload: Record<string, any> = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        venue: formData.venue || null,
        address: formData.address || null,
        ce_credits: parseFloat(formData.ce_credits) || 0,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        featured_image_url: formData.featured_image_url || null,
        video_url: formData.video_url || null,
        status: formData.status,
        learning_objectives: toArray(formData.learning_objectives),
        includes: toArray(formData.includes),
        prerequisites: toArray(formData.prerequisites),
        target_audience: toArray(formData.target_audience),
        layout_template: formData.layout_template,
        gallery_images: galleryImages,
      };
      console.log('[EventDetail] Saving event payload:', { id: event.id, gallery_images_count: galleryImages.length, gallery_images: galleryImages });

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('[EventDetail] Save response:', response.status, result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event');
      }

      setMessage({ type: 'success', text: 'Event updated successfully' });
      setShowEditModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update event' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speaker management handlers
  const handleToggleSpeaker = (speakerId: string) => {
    setEventSpeakers(prev =>
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  const handleSaveSpeakers = async () => {
    setIsSavingSpeakers(true);
    setSpeakerMessage(null);

    try {
      const response = await fetch(`/api/admin/events/${event.id}/speakers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speaker_ids: eventSpeakers }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save speakers');
      }

      setSpeakerMessage({ type: 'success', text: 'Speakers updated successfully' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setSpeakerMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setIsSavingSpeakers(false);
    }
  };

  // Featured image upload handler
  const handleFeaturedImageUpload = async (file: File) => {
    setImageUploadError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError('Invalid file type. Allowed: JPG, PNG, WebP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('File too large. Maximum size is 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await fetch('/api/admin/upload/event-image', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, featured_image_url: result.url }));
    } catch (error: any) {
      setImageUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Gallery handlers
  const handleGalleryUpload = async (files: FileList) => {
    setGalleryUploadError(null);
    setIsUploadingGallery(true);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newUrls: string[] = [];
    console.log('[Gallery] Starting upload of', files.length, 'file(s)');

    try {
      for (const file of Array.from(files)) {
        console.log('[Gallery] Uploading file:', file.name, file.type, file.size);
        if (!allowedTypes.includes(file.type)) {
          setGalleryUploadError('Invalid file type. Allowed: JPG, PNG, WebP');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setGalleryUploadError('File too large. Maximum size is 10MB');
          continue;
        }
        const uploadData = new FormData();
        uploadData.append('file', file);
        const response = await fetch('/api/admin/upload/event-image', {
          method: 'POST',
          body: uploadData,
        });
        const result = await response.json();
        console.log('[Gallery] Upload response:', response.status, result);
        if (response.ok && result.url) {
          newUrls.push(result.url);
        } else {
          setGalleryUploadError(result.error || 'Upload failed');
        }
      }
      if (newUrls.length > 0) {
        setGalleryImages(prev => {
          const updated = [...prev, ...newUrls];
          console.log('[Gallery] Updated gallery state:', updated.length, 'images');
          return updated;
        });
      }
    } catch (error: any) {
      console.error('[Gallery] Upload error:', error);
      setGalleryUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveGallery = async () => {
    setIsSavingGallery(true);
    setGalleryMessage(null);
    console.log('[Gallery] Saving gallery independently:', { event_id: event.id, count: galleryImages.length, urls: galleryImages });
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery_images: galleryImages }),
      });
      const result = await response.json();
      console.log('[Gallery] Save response:', response.status, result);
      if (!response.ok) throw new Error(result.error || result.details || 'Failed to save gallery');
      setGalleryMessage({ type: 'success', text: `Gallery saved (${galleryImages.length} image${galleryImages.length !== 1 ? 's' : ''})` });
      setTimeout(() => setGalleryMessage(null), 3000);
    } catch (error: any) {
      console.error('[Gallery] Save error:', error);
      setGalleryMessage({ type: 'error', text: error.message || 'Save failed' });
    } finally {
      setIsSavingGallery(false);
    }
  };

  // Sponsors & Accreditation handlers
  const handleSponsorLogoUpload = async (file: File, index: number) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;

    setIsUploadingSponsorLogo(index);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const response = await fetch('/api/admin/upload/site-image', { method: 'POST', body: uploadData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSponsors(prev => prev.map((s, i) => i === index ? { ...s, logo_url: result.url } : s));
    } catch { /* silent */ } finally {
      setIsUploadingSponsorLogo(null);
    }
  };

  const handleAccredLogoUpload = async (file: File, index: number) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;

    setIsUploadingAccredLogo(index);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const response = await fetch('/api/admin/upload/site-image', { method: 'POST', body: uploadData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAccreditations(prev => prev.map((a, i) => i === index ? { ...a, logo_url: result.url } : a));
    } catch { /* silent */ } finally {
      setIsUploadingAccredLogo(null);
    }
  };

  const handleSaveSponsorsAccreditation = async () => {
    setIsSavingSponsors(true);
    setSponsorMessage(null);
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsors: sponsors.filter(s => s.name.trim()),
          accreditation: accreditations.filter(a => a.name.trim()),
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setSponsorMessage({ type: 'success', text: 'Sponsors & accreditation saved' });
      setTimeout(() => setSponsorMessage(null), 3000);
    } catch (err) {
      setSponsorMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setIsSavingSponsors(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  // ====== Schedule CRUD ======

  async function refreshSchedules() {
    try {
      const res = await fetch(`/api/admin/events/${event.id}/schedules`);
      if (res.ok) {
        const json = await res.json();
        setSchedules(json.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh schedules:', err);
    }
  }

  async function handleAddDay() {
    setIsSavingSchedule(true);
    setScheduleMessage(null);
    try {
      // Calculate next date based on event start_date + number of existing days
      const baseDate = new Date(event.start_date);
      baseDate.setDate(baseDate.getDate() + schedules.length);
      const dateStr = baseDate.toISOString().split('T')[0];

      const res = await fetch(`/api/admin/events/${event.id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_date: dateStr,
          tab_label: `Day ${schedules.length + 1}`,
          topics: [],
        }),
      });
      if (!res.ok) throw new Error('Failed to create schedule day');
      await refreshSchedules();
      setActiveScheduleDay(schedules.length); // Switch to new day
      setScheduleMessage({ type: 'success', text: 'Day added' });
    } catch (err) {
      setScheduleMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add day' });
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleDeleteDay(scheduleId: string) {
    if (!confirm('Delete this entire day and all its topics?')) return;
    setIsSavingSchedule(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/schedules`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: scheduleId }),
      });
      if (!res.ok) throw new Error('Failed to delete day');
      await refreshSchedules();
      setActiveScheduleDay(0);
      setScheduleMessage({ type: 'success', text: 'Day deleted' });
    } catch (err) {
      setScheduleMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete day' });
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleSaveSchedule(schedule: EventSchedule) {
    setIsSavingSchedule(true);
    setScheduleMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/schedules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: schedule.id,
          schedule_date: schedule.schedule_date,
          tab_label: schedule.tab_label,
          topics: schedule.topics,
          display_order: schedule.display_order,
        }),
      });
      if (!res.ok) throw new Error('Failed to save schedule');
      await refreshSchedules();
      setScheduleMessage({ type: 'success', text: 'Schedule saved' });
      setTimeout(() => setScheduleMessage(null), 3000);
    } catch (err) {
      setScheduleMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setIsSavingSchedule(false);
    }
  }

  function updateScheduleLocally(scheduleId: string, updates: Partial<EventSchedule>) {
    setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, ...updates } : s));
  }

  function addTopicToSchedule(scheduleId: string) {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      return {
        ...s,
        topics: [...s.topics, { name: '', start_time: '', end_time: '', speakers: [], location: '', description: '' }],
      };
    }));
  }

  function updateTopicInSchedule(scheduleId: string, topicIndex: number, updates: Partial<ScheduleTopicItem>) {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const newTopics = [...s.topics];
      newTopics[topicIndex] = { ...newTopics[topicIndex], ...updates };
      return { ...s, topics: newTopics };
    }));
  }

  function removeTopicFromSchedule(scheduleId: string, topicIndex: number) {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const newTopics = [...s.topics];
      newTopics.splice(topicIndex, 1);
      return { ...s, topics: newTopics };
    }));
  }

  function moveTopicInSchedule(scheduleId: string, fromIndex: number, direction: 'up' | 'down') {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const newTopics = [...s.topics];
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= newTopics.length) return s;
      [newTopics[fromIndex], newTopics[toIndex]] = [newTopics[toIndex], newTopics[fromIndex]];
      return { ...s, topics: newTopics };
    }));
  }

  function toggleSpeakerInTopic(scheduleId: string, topicIndex: number, speakerName: string) {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const newTopics = [...s.topics];
      const topic = { ...newTopics[topicIndex] };
      if (topic.speakers.includes(speakerName)) {
        topic.speakers = topic.speakers.filter(n => n !== speakerName);
      } else {
        topic.speakers = [...topic.speakers, speakerName];
      }
      newTopics[topicIndex] = topic;
      return { ...s, topics: newTopics };
    }));
  }

  const totalSold = tickets.filter(t => t.status === 'valid').length;
  const totalCheckedIn = attendance.length;
  const totalCapacity = event.capacity || ticketTypes.reduce((sum, tt) => sum + (tt.quantity || 0), 0);
  const totalRevenue = tickets
    .filter(t => t.status === 'valid')
    .reduce((sum, t) => sum + (t.ticket_type?.price || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: `Schedule (${schedules.length} days)` },
    { id: 'tickets', label: `Tickets (${tickets.length})` },
    { id: 'attendance', label: `Attendance (${attendance.length})` },
    { id: 'waitlist', label: `Waitlist (${waitlist.length})` },
  ];

  return (
    <AdminShell currentPath={currentPath} user={user} title={event.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <a
                href="/admin/events"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            </div>
            <p className="text-gray-600">
              {formatDate(event.start_date)}
              {event.end_date && event.end_date !== event.start_date && (
                <> - {formatDate(event.end_date)}</>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/courses/${event.slug}`}
              target="_blank"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View Public Page
            </a>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Edit Event
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Tickets Sold</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalSold} / {totalCapacity || '∞'}
            </div>
            <div className="text-sm text-gray-500">
              {totalCapacity ? `${Math.round((totalSold / totalCapacity) * 100)}% capacity` : 'No limit set'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Checked In</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalCheckedIn} / {totalSold}
            </div>
            <div className="text-sm text-gray-500">
              {totalSold ? `${Math.round((totalCheckedIn / totalSold) * 100)}% attendance` : 'No tickets'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-bold text-gray-900">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">From ticket sales</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">CE Credits</div>
            <div className="text-2xl font-bold text-gray-900">{event.ce_credits || 0}</div>
            <div className="text-sm text-gray-500">Per attendee</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Event Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Event Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Info Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Event Information
                    </h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                        <dd className="mt-1 text-gray-900">{formatDate(event.start_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">End Date</dt>
                        <dd className="mt-1 text-gray-900">{event.end_date ? formatDate(event.end_date) : 'Same day'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Venue</dt>
                        <dd className="mt-1 text-gray-900">{event.venue || 'TBD'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                        <dd className="mt-1 text-gray-900">{totalCapacity || 'Unlimited'}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="mt-1 text-gray-900">{event.address || 'TBD'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            event.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">CE Credits</dt>
                        <dd className="mt-1 text-gray-900">{event.ce_credits || 0} credits</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Speakers Management */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Speakers ({eventSpeakers.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowSpeakerPicker(!showSpeakerPicker)}
                        className="text-sm px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        {showSpeakerPicker ? 'Done' : '+ Add / Remove'}
                      </button>
                    </div>

                    {speakerMessage && (
                      <div className={`mb-3 p-2 rounded text-sm ${
                        speakerMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {speakerMessage.text}
                      </div>
                    )}

                    {/* Current speakers */}
                    {eventSpeakers.length > 0 ? (
                      <div className="space-y-2">
                        {eventSpeakers.map(speakerId => {
                          const sp = allSpeakers.find(s => s.id === speakerId);
                          if (!sp) return null;
                          return (
                            <div key={sp.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
                              {sp.photo_url ? (
                                <img src={sp.photo_url} alt={sp.name} className="w-10 h-10 rounded-full object-cover object-top" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">{sp.name?.charAt(0) || '?'}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">{sp.name}</div>
                                {sp.title && <div className="text-xs text-gray-500 truncate">{sp.title}</div>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleSpeaker(sp.id)}
                                className="text-red-400 hover:text-red-600 flex-shrink-0"
                                title="Remove speaker"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No speakers assigned to this event.</p>
                    )}

                    {/* Speaker picker */}
                    {showSpeakerPicker && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-500 mb-2">Select speakers to assign:</p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                          {allSpeakers
                            .filter(s => !eventSpeakers.includes(s.id))
                            .map(sp => (
                              <button
                                key={sp.id}
                                type="button"
                                onClick={() => handleToggleSpeaker(sp.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-left transition-colors"
                              >
                                {sp.photo_url ? (
                                  <img src={sp.photo_url} alt={sp.name} className="w-8 h-8 rounded-full object-cover object-top" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-sm font-medium">{sp.name?.charAt(0) || '?'}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-700 truncate">{sp.name}</div>
                                  {sp.title && <div className="text-xs text-gray-400 truncate">{sp.title}</div>}
                                </div>
                                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            ))}
                          {allSpeakers.filter(s => !eventSpeakers.includes(s.id)).length === 0 && (
                            <p className="text-xs text-gray-400 italic p-2">All speakers are already assigned.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Save button - show only if speakers changed */}
                    {JSON.stringify(eventSpeakers) !== JSON.stringify((event.speakers || []).map(s => s.speaker?.id).filter(Boolean)) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSpeakers}
                          disabled={isSavingSpeakers}
                          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSavingSpeakers ? 'Saving...' : 'Save Speakers'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Excerpt/Summary */}
                  {event.excerpt && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Summary
                      </h3>
                      <p className="text-gray-700">{event.excerpt}</p>
                    </div>
                  )}

                  {/* Learning Objectives */}
                  {event.learning_objectives && event.learning_objectives.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Learning Objectives ({event.learning_objectives.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {event.learning_objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What's Included */}
                  {event.includes && event.includes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        What's Included ({event.includes.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {event.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">&#8226;</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prerequisites & Target Audience side by side */}
                  {((event.prerequisites && event.prerequisites.length > 0) || (event.target_audience && event.target_audience.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.prerequisites && event.prerequisites.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold mb-2 text-gray-900">Prerequisites</h3>
                          <ul className="space-y-1">
                            {event.prerequisites.map((pre, i) => (
                              <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5 flex-shrink-0">&#8226;</span>
                                {pre}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {event.target_audience && event.target_audience.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold mb-2 text-gray-900">Target Audience</h3>
                          <ul className="space-y-1">
                            {event.target_audience.map((aud, i) => (
                              <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5 flex-shrink-0">&#8226;</span>
                                {aud}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schedule Summary */}
                  {schedules.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Schedule ({schedules.length} {schedules.length === 1 ? 'day' : 'days'}, {schedules.reduce((sum, s) => sum + s.topics.length, 0)} topics)
                      </h3>
                      <div className="space-y-2">
                        {schedules.map((schedule, i) => (
                          <div key={schedule.id} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-gray-900 text-sm">
                                {schedule.tab_label || `Day ${i + 1}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(schedule.schedule_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' '}&middot;{' '}
                                {schedule.topics.length} topic{schedule.topics.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('schedule')}
                        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Manage Schedule &rarr;
                      </button>
                    </div>
                  )}

                  {/* Sponsors & Accreditation */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Sponsors & Accreditation
                    </h3>

                    {sponsorMessage && (
                      <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                        sponsorMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {sponsorMessage.text}
                      </div>
                    )}

                    {/* Sponsors */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">Sponsors ({sponsors.length})</h4>
                        <button
                          type="button"
                          onClick={() => setSponsors([...sponsors, { name: '', logo_url: '', website_url: '' }])}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add Sponsor
                        </button>
                      </div>
                      {sponsors.length > 0 ? (
                        <div className="space-y-3">
                          {sponsors.map((sponsor, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-start gap-3">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                  {sponsor.logo_url ? (
                                    <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain bg-gray-50 rounded border border-gray-200 p-0.5" />
                                  ) : (
                                    <label className="w-12 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                                      {isUploadingSponsorLogo === idx ? (
                                        <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                      ) : (
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                      )}
                                      <input type="file" accept="image/*" className="hidden" aria-label={`Upload logo for sponsor ${idx + 1}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSponsorLogoUpload(f, idx); e.target.value = ''; }} />
                                    </label>
                                  )}
                                </div>
                                {/* Fields */}
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={sponsor.name}
                                    onChange={(e) => setSponsors(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                                    placeholder="Sponsor name"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="url"
                                      value={sponsor.logo_url}
                                      onChange={(e) => setSponsors(prev => prev.map((s, i) => i === idx ? { ...s, logo_url: e.target.value } : s))}
                                      placeholder="Logo URL (or upload)"
                                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                      type="url"
                                      value={sponsor.website_url}
                                      onChange={(e) => setSponsors(prev => prev.map((s, i) => i === idx ? { ...s, website_url: e.target.value } : s))}
                                      placeholder="Website URL"
                                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => setSponsors(prev => prev.filter((_, i) => i !== idx))}
                                  className="flex-shrink-0 text-gray-400 hover:text-red-500 mt-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No sponsors added</p>
                      )}
                    </div>

                    {/* Accreditation */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">Accreditation ({accreditations.length})</h4>
                        <button
                          type="button"
                          onClick={() => setAccreditations([...accreditations, { name: '', logo_url: '', text: '' }])}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add Accreditation
                        </button>
                      </div>
                      {accreditations.length > 0 ? (
                        <div className="space-y-3">
                          {accreditations.map((accred, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-start gap-3">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                  {accred.logo_url ? (
                                    <img src={accred.logo_url} alt={accred.name} className="w-12 h-12 object-contain bg-gray-50 rounded border border-gray-200 p-0.5" />
                                  ) : (
                                    <label className="w-12 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                                      {isUploadingAccredLogo === idx ? (
                                        <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                      ) : (
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                      )}
                                      <input type="file" accept="image/*" className="hidden" aria-label={`Upload logo for accreditation ${idx + 1}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAccredLogoUpload(f, idx); e.target.value = ''; }} />
                                    </label>
                                  )}
                                </div>
                                {/* Fields */}
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={accred.name}
                                    onChange={(e) => setAccreditations(prev => prev.map((a, i) => i === idx ? { ...a, name: e.target.value } : a))}
                                    placeholder="e.g., AGD PACE"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="url"
                                    value={accred.logo_url}
                                    onChange={(e) => setAccreditations(prev => prev.map((a, i) => i === idx ? { ...a, logo_url: e.target.value } : a))}
                                    placeholder="Logo URL (or upload)"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                  />
                                  <textarea
                                    value={accred.text}
                                    onChange={(e) => setAccreditations(prev => prev.map((a, i) => i === idx ? { ...a, text: e.target.value } : a))}
                                    placeholder="Accreditation description text..."
                                    rows={2}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => setAccreditations(prev => prev.filter((_, i) => i !== idx))}
                                  className="flex-shrink-0 text-gray-400 hover:text-red-500 mt-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No accreditation added</p>
                      )}
                    </div>

                    {/* Save button */}
                    {(JSON.stringify(sponsors) !== JSON.stringify(event.sponsors || []) ||
                      JSON.stringify(accreditations) !== JSON.stringify(event.accreditation || [])) && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSponsorsAccreditation}
                          disabled={isSavingSponsors}
                          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSavingSponsors ? 'Saving...' : 'Save Sponsors & Accreditation'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Ticket Types & Quick Actions */}
                <div className="space-y-6">
                  {/* Ticket Types */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      Ticket Types
                    </h3>
                    {ticketTypes.length > 0 ? (
                      <div className="space-y-3">
                        {ticketTypes.map((tt) => {
                          const soldPercentage = tt.quantity ? Math.round(((tt.sold_count || 0) / tt.quantity) * 100) : 0;
                          return (
                            <div key={tt.id} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-gray-900">{tt.name}</div>
                                <div className="text-lg font-bold text-blue-600">${tt.price}</div>
                              </div>
                              <div className="text-sm text-gray-500 mb-2">
                                {tt.sold_count || 0} / {tt.quantity || '∞'} sold
                              </div>
                              {tt.quantity && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      soldPercentage >= 90 ? 'bg-red-500' :
                                      soldPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No ticket types configured</p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <a
                        href={`/admin/events/${event.id}/attendance`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Manage Check-in
                      </a>
                      <a
                        href={`/admin/certificates?event_id=${event.id}`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Generate Certificates
                      </a>
                      <a
                        href={`/admin/reports?event_id=${event.id}`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Reports
                      </a>
                      <button
                        type="button"
                        onClick={() => window.open(`/courses/${event.slug}`, '_blank')}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Public Page
                      </button>
                    </div>
                  </div>

                  {/* Featured Image */}
                  {event.featured_image_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Featured Image</h3>
                      <img
                        src={event.featured_image_url}
                        alt={event.title}
                        className="w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-6 space-y-4">
              {/* Schedule Message */}
              {scheduleMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  scheduleMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <span>{scheduleMessage.type === 'success' ? '✓' : '✕'}</span>
                  {scheduleMessage.text}
                </div>
              )}

              {/* Day Tabs + Add Day */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <div className="flex gap-1 flex-wrap">
                  {schedules.map((schedule, idx) => (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => setActiveScheduleDay(idx)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        activeScheduleDay === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {schedule.tab_label || `Day ${idx + 1}`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddDay}
                  disabled={isSavingSchedule}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  + Add Day
                </button>
              </div>

              {/* Active Day Editor */}
              {schedules.length > 0 && schedules[activeScheduleDay] ? (() => {
                const schedule = schedules[activeScheduleDay];
                return (
                  <div className="space-y-4">
                    {/* Day Header */}
                    <div className="flex items-start justify-between gap-4 bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        <div>
                          <label htmlFor={`day-label-${schedule.id}`} className="block text-xs font-medium text-gray-500 mb-1">Tab Label</label>
                          <input
                            id={`day-label-${schedule.id}`}
                            type="text"
                            value={schedule.tab_label || ''}
                            onChange={(e) => updateScheduleLocally(schedule.id, { tab_label: e.target.value })}
                            placeholder="e.g., Day 1, Friday"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor={`day-date-${schedule.id}`} className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                          <input
                            id={`day-date-${schedule.id}`}
                            type="date"
                            value={schedule.schedule_date}
                            onChange={(e) => updateScheduleLocally(schedule.id, { schedule_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor={`day-order-${schedule.id}`} className="block text-xs font-medium text-gray-500 mb-1">Display Order</label>
                          <input
                            id={`day-order-${schedule.id}`}
                            type="number"
                            min={1}
                            value={schedule.display_order}
                            onChange={(e) => updateScheduleLocally(schedule.id, { display_order: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDay(schedule.id)}
                        className="mt-5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete this day"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Topics List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Topics ({schedule.topics.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => addTopicToSchedule(schedule.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Add Topic
                        </button>
                      </div>

                      {schedule.topics.length === 0 && (
                        <p className="text-sm text-gray-400 italic py-4 text-center">
                          No topics yet. Click "+ Add Topic" to add the first session.
                        </p>
                      )}

                      {schedule.topics.map((topic, topicIdx) => (
                        <div key={topicIdx} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                          {/* Topic Header Row */}
                          <div className="flex items-start gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 pt-1">
                              <button
                                type="button"
                                title="Move up"
                                onClick={() => moveTopicInSchedule(schedule.id, topicIdx, 'up')}
                                disabled={topicIdx === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                title="Move down"
                                onClick={() => moveTopicInSchedule(schedule.id, topicIdx, 'down')}
                                disabled={topicIdx === schedule.topics.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>

                            {/* Topic Name */}
                            <div className="flex-1">
                              <label htmlFor={`topic-name-${schedule.id}-${topicIdx}`} className="block text-xs font-medium text-gray-500 mb-1">Session Name *</label>
                              <input
                                id={`topic-name-${schedule.id}-${topicIdx}`}
                                type="text"
                                value={topic.name}
                                onChange={(e) => updateTopicInSchedule(schedule.id, topicIdx, { name: e.target.value })}
                                placeholder="e.g., Implant Planning Workshop"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {/* Delete Topic */}
                            <button
                              type="button"
                              title="Remove topic"
                              onClick={() => removeTopicFromSchedule(schedule.id, topicIdx)}
                              className="mt-5 p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Times + Location Row */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label htmlFor={`topic-start-${schedule.id}-${topicIdx}`} className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                              <input
                                id={`topic-start-${schedule.id}-${topicIdx}`}
                                type="time"
                                value={topic.start_time}
                                onChange={(e) => updateTopicInSchedule(schedule.id, topicIdx, { start_time: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor={`topic-end-${schedule.id}-${topicIdx}`} className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                              <input
                                id={`topic-end-${schedule.id}-${topicIdx}`}
                                type="time"
                                value={topic.end_time}
                                onChange={(e) => updateTopicInSchedule(schedule.id, topicIdx, { end_time: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor={`topic-location-${schedule.id}-${topicIdx}`} className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                              <input
                                id={`topic-location-${schedule.id}-${topicIdx}`}
                                type="text"
                                value={topic.location}
                                onChange={(e) => updateTopicInSchedule(schedule.id, topicIdx, { location: e.target.value })}
                                placeholder="e.g., Room A"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Speakers */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Speakers</label>
                            <div className="flex flex-wrap gap-1.5">
                              {allSpeakers.map((spk) => {
                                const isSelected = topic.speakers.includes(spk.name);
                                return (
                                  <button
                                    key={spk.id}
                                    type="button"
                                    onClick={() => toggleSpeakerInTopic(schedule.id, topicIdx, spk.name)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                      isSelected
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {spk.name}
                                  </button>
                                );
                              })}
                              {allSpeakers.length === 0 && (
                                <span className="text-xs text-gray-400 italic">No speakers in system</span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label htmlFor={`topic-desc-${schedule.id}-${topicIdx}`} className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <textarea
                              id={`topic-desc-${schedule.id}-${topicIdx}`}
                              value={topic.description}
                              onChange={(e) => updateTopicInSchedule(schedule.id, topicIdx, { description: e.target.value })}
                              rows={2}
                              placeholder="Session description..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSchedule(schedule)}
                        disabled={isSavingSchedule}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {isSavingSchedule ? 'Saving...' : `Save ${schedule.tab_label || 'Day ' + (activeScheduleDay + 1)}`}
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium mb-1">No schedule days yet</p>
                  <p className="text-sm mb-4">Add a day to start building your event agenda.</p>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    disabled={isSavingSchedule}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    + Add First Day
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{ticket.ticket_code}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{ticket.attendee_name}</div>
                          <div className="text-sm text-gray-500">{ticket.attendee_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{ticket.ticket_type?.name}</div>
                          <div className="text-sm text-gray-500">${ticket.ticket_type?.price}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            ticket.status === 'valid'
                              ? 'bg-green-100 text-green-800'
                              : ticket.status === 'used'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(ticket.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No tickets sold yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked In At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{record.ticket?.attendee_name}</div>
                          <div className="text-sm text-gray-500">{record.ticket?.attendee_email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{record.ticket?.ticket_code}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            record.check_in_method === 'qr_scan'
                              ? 'bg-purple-100 text-purple-800'
                              : record.check_in_method === 'manual'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.check_in_method?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(record.checked_in_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No attendance records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'waitlist' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waitlist.length > 0 ? (
                    waitlist.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {entry.first_name} {entry.last_name}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{entry.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            entry.status === 'waiting'
                              ? 'bg-yellow-100 text-yellow-800'
                              : entry.status === 'notified'
                              ? 'bg-blue-100 text-blue-800'
                              : entry.status === 'converted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          {entry.status === 'waiting' && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Notify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No waitlist entries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
                  <input
                    id="edit-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">URL path: /courses/{formData.slug}</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-start-date" className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                    <input
                      id="edit-start-date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-end-date" className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                    <input
                      id="edit-end-date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Venue & Address */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-venue" className="block text-sm font-medium text-gray-700 mb-1.5">Venue</label>
                    <input
                      id="edit-venue"
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g., Marriott Marquis"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input
                      id="edit-address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* CE Credits, Capacity, Status, Template */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="edit-ce-credits" className="block text-sm font-medium text-gray-700 mb-1.5">CE Credits</label>
                    <input
                      id="edit-ce-credits"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.ce_credits}
                      onChange={(e) => setFormData({ ...formData, ce_credits: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-capacity" className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
                    <input
                      id="edit-capacity"
                      type="number"
                      min="0"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      id="edit-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-layout-template" className="block text-sm font-medium text-gray-700 mb-1.5">Template</label>
                    <select
                      id="edit-layout-template"
                      value={formData.layout_template}
                      onChange={(e) => setFormData({ ...formData, layout_template: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                    </select>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label htmlFor="edit-excerpt" className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt / Summary</label>
                  <textarea
                    id="edit-excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    placeholder="Short summary for listings"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Divider - Content Sections */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Course Content</h3>
                </div>

                {/* Learning Objectives */}
                <div>
                  <label htmlFor="edit-objectives" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Learning Objectives
                    <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                  </label>
                  <textarea
                    id="edit-objectives"
                    value={formData.learning_objectives}
                    onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                    rows={4}
                    placeholder={"Understand advanced implant techniques\nLearn digital workflow integration\nMaster patient communication strategies"}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.learning_objectives.split('\n').filter(l => l.trim()).length} objective(s)
                  </p>
                </div>

                {/* What's Included */}
                <div>
                  <label htmlFor="edit-includes" className="block text-sm font-medium text-gray-700 mb-1.5">
                    What's Included
                    <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                  </label>
                  <textarea
                    id="edit-includes"
                    value={formData.includes}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                    rows={3}
                    placeholder={"Course materials and handouts\nLunch and refreshments\nCE credit certificate"}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.includes.split('\n').filter(l => l.trim()).length} item(s)
                  </p>
                </div>

                {/* Prerequisites */}
                <div>
                  <label htmlFor="edit-prerequisites" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prerequisites
                    <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                  </label>
                  <textarea
                    id="edit-prerequisites"
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    rows={2}
                    placeholder={"Active dental license\nBasic implant placement experience"}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.prerequisites.split('\n').filter(l => l.trim()).length} prerequisite(s)
                  </p>
                </div>

                {/* Target Audience */}
                <div>
                  <label htmlFor="edit-audience" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Target Audience
                    <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                  </label>
                  <textarea
                    id="edit-audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    rows={2}
                    placeholder={"General Dentists\nOral Surgeons\nProsthodontists"}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.target_audience.split('\n').filter(l => l.trim()).length} audience(s)
                  </p>
                </div>

                {/* Schedule Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Schedule / Agenda</span> is managed in the
                    <button
                      type="button"
                      onClick={() => { setShowEditModal(false); setActiveTab('schedule'); }}
                      className="ml-1 font-medium underline hover:text-blue-900"
                    >
                      Schedule tab
                    </button>
                    {' '}with multi-day support, speakers, times, and locations.
                  </p>
                </div>

                {/* Divider - Media */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Media</h3>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Featured Image</label>

                  {/* Current image preview */}
                  {formData.featured_image_url && (
                    <div className="mb-3 relative group inline-block">
                      <img
                        src={formData.featured_image_url}
                        alt="Featured"
                        className="w-full max-w-xs h-40 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Upload area */}
                  <input
                    ref={featuredImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFeaturedImageUpload(file);
                      e.target.value = '';
                    }}
                  />

                  <div
                    onClick={() => featuredImageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFeaturedImageUpload(file);
                    }}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      isUploadingImage
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">JPG, PNG, WebP up to 10MB</p>
                      </>
                    )}
                  </div>

                  {imageUploadError && (
                    <p className="mt-1.5 text-sm text-red-600">{imageUploadError}</p>
                  )}

                  {/* URL fallback */}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Or paste an image URL
                    </summary>
                    <input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      placeholder="https://..."
                      className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </details>
                </div>

                {/* Video URL */}
                <div>
                  <label htmlFor="edit-video" className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
                  <input
                    id="edit-video"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/... or https://vimeo.com/..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Gallery Images */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
                    {galleryImages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveGallery}
                        disabled={isSavingGallery}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {isSavingGallery ? 'Saving...' : 'Save Gallery'}
                      </button>
                    )}
                  </div>

                  {galleryMessage && (
                    <p className={`text-xs mb-2 ${galleryMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {galleryMessage.text}
                    </p>
                  )}

                  {/* Gallery grid */}
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {galleryImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload area */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleGalleryUpload(files);
                      e.target.value = '';
                    }}
                  />
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) handleGalleryUpload(files);
                    }}
                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      isUploadingGallery
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    {isUploadingGallery ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Click or drag images here ({galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''})
                      </p>
                    )}
                  </div>

                  {galleryUploadError && (
                    <p className="mt-1 text-xs text-red-600">{galleryUploadError}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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
