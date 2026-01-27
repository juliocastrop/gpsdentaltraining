/**
 * General Settings Component - GPS Dental Training Admin
 * Configure company info, contact details, notifications, and integrations
 */
import { useState, useRef } from 'react';
import AdminShell from './AdminShell';

interface GeneralSettingsData {
  // Company Info
  company_name: string;
  company_legal_name: string;
  logo_url: string;
  logo_white_url: string;
  favicon_url: string;
  website_url: string;

  // Contact
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;

  // Social Media
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
  vimeo_url: string;
  youtube_url: string;

  // Notifications
  admin_emails: string;
  notification_order: boolean;
  notification_registration: boolean;
  notification_waitlist: boolean;
  notification_checkin: boolean;

  // Business
  timezone: string;
  currency: string;
  ce_provider_name: string;
  ce_provider_id: string;
  default_event_capacity: number;
  waitlist_expiration_hours: number;
}

interface GeneralSettingsProps {
  currentPath: string;
  user: { name: string; email: string };
  settings: GeneralSettingsData;
}

export default function GeneralSettings({
  currentPath,
  user,
  settings: initialSettings,
}: GeneralSettingsProps) {
  const [settings, setSettings] = useState<GeneralSettingsData>(initialSettings);
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoWhiteInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, field: 'logo_url' | 'logo_white_url' | 'favicon_url') => {
    setUploadError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: JPG, PNG, WebP, SVG, ICO');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB');
      return;
    }

    setUploadingField(field);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/admin/upload/site-image', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSettings(prev => ({ ...prev, [field]: result.url }));
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Info' },
    { id: 'contact', label: 'Contact & Address' },
    { id: 'social', label: 'Social Media' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'business', label: 'Business Settings' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <AdminShell
      title="General Settings"
      subtitle="Configure your application settings"
      currentPath={currentPath}
      user={user}
    >
      <div className="max-w-4xl">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#0B52AC] text-[#0B52AC]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Company Info Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Company Information</h3>
              <p className="text-sm text-gray-500">Basic company details used across the application</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Company Name *</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className={inputClass}
                  placeholder="GPS Dental Training"
                />
              </div>
              <div>
                <label className={labelClass}>Legal Name</label>
                <input
                  type="text"
                  value={settings.company_legal_name}
                  onChange={(e) => setSettings({ ...settings, company_legal_name: e.target.value })}
                  className={inputClass}
                  placeholder="GPS Dental Training LLC"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Website URL</label>
              <input
                type="url"
                value={settings.website_url}
                onChange={(e) => setSettings({ ...settings, website_url: e.target.value })}
                className={inputClass}
                placeholder="https://gpsdentaltraining.com"
              />
            </div>

            {uploadError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Logo Upload */}
              <div>
                <label className={labelClass}>Logo</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  aria-label="Upload logo"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo_url');
                    e.target.value = '';
                  }}
                />

                {settings.logo_url ? (
                  <div className="relative group inline-block">
                    <img
                      src={settings.logo_url}
                      alt="Logo preview"
                      className="h-16 max-w-full object-contain bg-gray-50 rounded-lg border border-gray-200 p-2"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2 py-1 bg-white text-gray-700 text-xs rounded hover:bg-gray-100"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logo_url: '' })}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file, 'logo_url');
                    }}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      uploadingField === 'logo_url'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    {uploadingField === 'logo_url' ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-xs text-gray-500">Click or drag to upload</p>
                      </>
                    )}
                  </div>
                )}
                <details className="mt-1.5">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or paste URL</summary>
                  <input
                    type="url"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </details>
              </div>

              {/* Logo White Upload */}
              <div>
                <label className={labelClass}>Logo (White)</label>
                <input
                  ref={logoWhiteInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  aria-label="Upload white logo"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo_white_url');
                    e.target.value = '';
                  }}
                />

                {settings.logo_white_url ? (
                  <div className="relative group inline-block">
                    <img
                      src={settings.logo_white_url}
                      alt="White logo preview"
                      className="h-16 max-w-full object-contain bg-gray-800 rounded-lg border border-gray-200 p-2"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoWhiteInputRef.current?.click()}
                        className="px-2 py-1 bg-white text-gray-700 text-xs rounded hover:bg-gray-100"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logo_white_url: '' })}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoWhiteInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file, 'logo_white_url');
                    }}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      uploadingField === 'logo_white_url'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    {uploadingField === 'logo_white_url' ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-xs text-gray-500">Click or drag to upload</p>
                      </>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-400">Used on dark backgrounds (hero, footer)</p>
                <details className="mt-1">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or paste URL</summary>
                  <input
                    type="url"
                    value={settings.logo_white_url}
                    onChange={(e) => setSettings({ ...settings, logo_white_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </details>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className={labelClass}>Favicon</label>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                  aria-label="Upload favicon"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'favicon_url');
                    e.target.value = '';
                  }}
                />

                {settings.favicon_url ? (
                  <div className="relative group inline-block">
                    <img
                      src={settings.favicon_url}
                      alt="Favicon preview"
                      className="h-12 w-12 object-contain bg-gray-50 rounded-lg border border-gray-200 p-1"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="px-1.5 py-1 bg-white text-gray-700 text-[10px] rounded hover:bg-gray-100"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, favicon_url: '' })}
                        className="px-1.5 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-600"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => faviconInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file, 'favicon_url');
                    }}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      uploadingField === 'favicon_url'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    {uploadingField === 'favicon_url' ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-1 text-xs text-gray-500">ICO, PNG, SVG</p>
                      </>
                    )}
                  </div>
                )}
                <details className="mt-1.5">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Or paste URL</summary>
                  <input
                    type="url"
                    value={settings.favicon_url}
                    onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Contact & Address Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Contact & Address</h3>
              <p className="text-sm text-gray-500">Used in emails, footer, and event details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className={inputClass}
                  placeholder="(770) 962-2480"
                />
              </div>
              <div>
                <label className={labelClass}>Contact Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className={inputClass}
                  placeholder="info@gpsdentaltraining.com"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Physical Address</h4>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input
                    type="text"
                    value={settings.address_line_1}
                    onChange={(e) => setSettings({ ...settings, address_line_1: e.target.value })}
                    className={inputClass}
                    placeholder="6320 Sugarloaf Parkway"
                  />
                </div>
                <div>
                  <label className={labelClass}>Address Line 2</label>
                  <input
                    type="text"
                    value={settings.address_line_2}
                    onChange={(e) => setSettings({ ...settings, address_line_2: e.target.value })}
                    className={inputClass}
                    placeholder="Suite 100"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className={inputClass}
                      placeholder="Duluth"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      className={inputClass}
                      placeholder="GA"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ZIP Code</label>
                    <input
                      type="text"
                      value={settings.zip}
                      onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
                      className={inputClass}
                      placeholder="30097"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Social Media Links</h3>
              <p className="text-sm text-gray-500">Displayed in the footer and email templates</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'facebook_url' as const, label: 'Facebook', placeholder: 'https://www.facebook.com/gpsdentaltraining', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                { key: 'instagram_url' as const, label: 'Instagram', placeholder: 'https://www.instagram.com/gpsdentaltraining', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { key: 'linkedin_url' as const, label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/...', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { key: 'twitter_url' as const, label: 'X (Twitter)', placeholder: 'https://x.com/...', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { key: 'vimeo_url' as const, label: 'Vimeo', placeholder: 'https://vimeo.com/...', icon: 'M22.875 10.063c-2.442 5.217-8.337 12.319-12.063 12.319-3.672 0-4.203-7.831-6.208-13.043-.987-2.565-1.624-1.976-3.474-.681L0 7.197c3.466-3.04 6.94-6.573 9.117-6.769 2.188-.237 3.546 1.272 4.063 4.585.727 4.667 1.4 7.546 2.8 7.546 1.119 0 3.141-4.062 3.205-5.519.12-2.459-1.924-2.531-3.748-1.764 2.427-7.939 12.508-6.477 7.438 4.787z' },
                { key: 'youtube_url' as const, label: 'YouTube', placeholder: 'https://www.youtube.com/...', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z' },
              ].map(({ key, label, placeholder, icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d={icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="sr-only">{label}</label>
                    <input
                      type="url"
                      value={settings[key]}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                      className={inputClass}
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Admin Notifications</h3>
              <p className="text-sm text-gray-500">Configure who receives admin notifications and which events trigger them</p>
            </div>

            <div>
              <label className={labelClass}>Admin Email Recipients</label>
              <textarea
                value={settings.admin_emails}
                onChange={(e) => setSettings({ ...settings, admin_emails: e.target.value })}
                className={`${inputClass} h-24`}
                placeholder="info@gpsdentaltraining.com&#10;juliocastro@thewebminds.agency"
              />
              <p className="mt-1 text-xs text-gray-500">One email per line. These addresses receive admin notifications.</p>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Notification Triggers</h4>
              <div className="space-y-3">
                {[
                  { key: 'notification_order' as const, label: 'New Orders', desc: 'When a new ticket or seminar order is completed' },
                  { key: 'notification_registration' as const, label: 'Seminar Registrations', desc: 'When someone registers for a monthly seminar' },
                  { key: 'notification_waitlist' as const, label: 'Waitlist Entries', desc: 'When someone joins a waitlist' },
                  { key: 'notification_checkin' as const, label: 'Check-ins', desc: 'When an attendee is checked in to an event' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Business Settings Tab */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Settings</h3>
              <p className="text-sm text-gray-500">CE provider details and default values</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className={inputClass}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className={inputClass}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">CE Provider</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Provider Name</label>
                  <input
                    type="text"
                    value={settings.ce_provider_name}
                    onChange={(e) => setSettings({ ...settings, ce_provider_name: e.target.value })}
                    className={inputClass}
                    placeholder="GPS Dental Training"
                  />
                </div>
                <div>
                  <label className={labelClass}>PACE Provider ID</label>
                  <input
                    type="text"
                    value={settings.ce_provider_id}
                    onChange={(e) => setSettings({ ...settings, ce_provider_id: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., 12345"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Defaults</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Default Event Capacity</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.default_event_capacity}
                    onChange={(e) => setSettings({ ...settings, default_event_capacity: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className={labelClass}>Waitlist Expiration (hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.waitlist_expiration_hours}
                    onChange={(e) => setSettings({ ...settings, waitlist_expiration_hours: parseInt(e.target.value) || 48 })}
                    className={inputClass}
                    placeholder="48"
                  />
                  <p className="mt-1 text-xs text-gray-500">Hours before a waitlist notification expires</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#0B52AC] text-white text-sm font-medium rounded-lg hover:bg-[#094392] disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
