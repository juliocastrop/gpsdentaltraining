/**
 * Speakers Management Component - GPS Dental Training Admin
 * Create, edit, and delete speakers with social media links
 */
import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import AdminShell from './AdminShell';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

interface Speaker {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_links: SocialLinks | null;
  created_at: string;
  event_count: number;
}

interface SpeakersManagementProps {
  currentPath: string;
  user: { name: string; email: string };
  speakers: Speaker[];
  events: Event[];
}

interface SpeakerFormData {
  name: string;
  slug: string;
  title: string;
  bio: string;
  photo_url: string;
  twitter: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  website: string;
}

const emptyFormData: SpeakerFormData = {
  name: '',
  slug: '',
  title: '',
  bio: '',
  photo_url: '',
  twitter: '',
  linkedin: '',
  facebook: '',
  instagram: '',
  website: '',
};

export default function SpeakersManagement({
  currentPath,
  user,
  speakers,
  events,
}: SpeakersManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpeakerFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setUploadError(null);
    setShowModal(true);
  };

  const openEditModal = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setFormData({
      name: speaker.name,
      slug: speaker.slug,
      title: speaker.title || '',
      bio: speaker.bio || '',
      photo_url: speaker.photo_url || '',
      twitter: speaker.social_links?.twitter || '',
      linkedin: speaker.social_links?.linkedin || '',
      facebook: speaker.social_links?.facebook || '',
      instagram: speaker.social_links?.instagram || '',
      website: speaker.social_links?.website || '',
    });
    setUploadError(null);
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingId ? formData.slug : generateSlug(name),
    });
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: JPG, PNG, WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB');
      return;
    }

    // Read file as data URL and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: CropArea, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: CropArea): Promise<Blob> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        },
        'image/jpeg',
        0.92,
      );
    });
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setShowCropModal(false);

    try {
      const croppedBlob = await createCroppedImage(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], `speaker-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/admin/upload/speaker-photo', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData((prev) => ({ ...prev, photo_url: result.url }));
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setCropImageSrc(null);
    }
  };

  const handleCropExistingPhoto = () => {
    if (formData.photo_url) {
      setCropImageSrc(formData.photo_url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const socialLinks: SocialLinks = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;
      if (formData.facebook) socialLinks.facebook = formData.facebook;
      if (formData.instagram) socialLinks.instagram = formData.instagram;
      if (formData.website) socialLinks.website = formData.website;

      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        title: formData.title || null,
        bio: formData.bio || null,
        photo_url: formData.photo_url || null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };

      const response = await fetch('/api/admin/speakers' + (editingId ? `/${editingId}` : ''), {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save speaker');
      }

      setMessage({ type: 'success', text: `Speaker ${editingId ? 'updated' : 'created'} successfully` });
      setShowModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save speaker' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/speakers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      setMessage({ type: 'success', text: 'Speaker deleted successfully' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete speaker' });
    }
  };

  const filteredSpeakers = speakers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.title && s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminShell currentPath={currentPath} user={user} title="Speakers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Speakers & Instructors</h1>
            <p className="text-gray-600">Manage speakers and instructors for your courses</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + Add Speaker
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search speakers..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Speakers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.length > 0 ? (
            filteredSpeakers.map((speaker) => (
              <div key={speaker.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Photo */}
                <div className="h-48 bg-gray-100 relative">
                  {speaker.photo_url ? (
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-6xl font-bold text-blue-400">
                        {speaker.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full">
                      {speaker.event_count} event{speaker.event_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{speaker.name}</h3>
                  {speaker.title && (
                    <p className="text-sm text-gray-600 mt-1">{speaker.title}</p>
                  )}

                  {/* Social Links */}
                  {speaker.social_links && Object.keys(speaker.social_links).length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {speaker.social_links.twitter && (
                        <a href={speaker.social_links.twitter} target="_blank" rel="noopener noreferrer"
                           className="text-gray-400 hover:text-blue-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                      {speaker.social_links.linkedin && (
                        <a href={speaker.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                           className="text-gray-400 hover:text-blue-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {speaker.social_links.facebook && (
                        <a href={speaker.social_links.facebook} target="_blank" rel="noopener noreferrer"
                           className="text-gray-400 hover:text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {speaker.social_links.instagram && (
                        <a href={speaker.social_links.instagram} target="_blank" rel="noopener noreferrer"
                           className="text-gray-400 hover:text-pink-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        </a>
                      )}
                      {speaker.social_links.website && (
                        <a href={speaker.social_links.website} target="_blank" rel="noopener noreferrer"
                           className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(speaker)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(speaker.id, speaker.name)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchTerm ? 'No speakers found matching your search' : 'No speakers yet.'}
              {!searchTerm && (
                <button onClick={openCreateModal} className="block mx-auto mt-2 text-blue-600 hover:underline">
                  Add your first speaker
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Speaker' : 'Add Speaker'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name and Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      placeholder="Dr. John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="dr-john-smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="DDS, FACP - Prosthodontist & Implant Specialist"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <div className="flex gap-4 items-start">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {formData.photo_url ? (
                        <div className="relative group">
                          <img
                            src={formData.photo_url}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo_url: '' })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          >
                            X
                          </button>
                          <button
                            type="button"
                            onClick={handleCropExistingPhoto}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Crop
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Upload area */}
                    <div className="flex-1 space-y-2">
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          aria-label="Upload speaker photo"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                            e.target.value = '';
                          }}
                        />
                        {isUploading ? (
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-600 mt-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">JPG, PNG, WebP (max 5MB)</p>
                          </>
                        )}
                      </div>

                      {uploadError && (
                        <p className="text-sm text-red-600">{uploadError}</p>
                      )}

                      {/* Manual URL fallback */}
                      <details className="text-xs">
                        <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                          Or paste image URL
                        </summary>
                        <input
                          type="url"
                          value={formData.photo_url}
                          onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </details>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Speaker biography and credentials..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Social Links */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Social Media Links</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Twitter / X</label>
                      <input
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://twitter.com/username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Facebook</label>
                      <input
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Instagram</label>
                      <input
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Crop Modal */}
        {showCropModal && cropImageSrc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Crop Photo</h3>
                <p className="text-sm text-gray-500">Adjust the crop area for the speaker photo</p>
              </div>
              <div className="relative w-full" style={{ height: '400px' }}>
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 flex-shrink-0">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                    aria-label="Zoom"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCropModal(false);
                      setCropImageSrc(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    disabled={isUploading}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Crop & Upload'}
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
