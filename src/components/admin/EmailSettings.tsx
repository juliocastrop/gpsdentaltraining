/**
 * Email Settings Component - GPS Dental Training Admin
 * Configure email templates, branding, and test emails
 */
import { useState } from 'react';
import AdminShell from './AdminShell';

interface EmailSettingsData {
  logo_url: string;
  company_name: string;
  from_name: string;
  reply_to_email: string;
  primary_color: string;
  secondary_color: string;
  header_bg_color: string;
  header_text_color: string;
  footer_text: string;
  support_email: string;
  support_phone: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
}

interface EmailSettingsProps {
  currentPath: string;
  user: { name: string; email: string };
  settings: EmailSettingsData;
}

export default function EmailSettings({
  currentPath,
  user,
  settings: initialSettings,
}: EmailSettingsProps) {
  const [settings, setSettings] = useState<EmailSettingsData>(initialSettings);
  const [activeTab, setActiveTab] = useState('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState(user.email);
  const [testType, setTestType] = useState('ticket');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (field: keyof EmailSettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          type: testType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setMessage({ type: 'success', text: `Test email sent to ${testEmail}!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email. Please try again.' });
    } finally {
      setIsTesting(false);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding' },
    { id: 'colors', label: 'Colors' },
    { id: 'content', label: 'Content' },
    { id: 'social', label: 'Social Links' },
    { id: 'test', label: 'Test Email' },
  ];

  return (
    <AdminShell currentPath={currentPath} user={user} title="Email Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
            <p className="text-gray-600">Configure email templates and branding</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Branding Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    URL to your company logo (recommended: 200x60px)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.from_name}
                    onChange={(e) => handleChange('from_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Display name for outgoing emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={settings.reply_to_email}
                    onChange={(e) => handleChange('reply_to_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Color Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.header_bg_color}
                      onChange={(e) => handleChange('header_bg_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.header_bg_color}
                      onChange={(e) => handleChange('header_bg_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.header_text_color}
                      onChange={(e) => handleChange('header_text_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.header_text_color}
                      onChange={(e) => handleChange('header_text_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ maxWidth: '400px' }}
                >
                  <div
                    style={{
                      backgroundColor: settings.header_bg_color,
                      color: settings.header_text_color,
                      padding: '20px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                      {settings.company_name}
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      Email Header Preview
                    </div>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: '#fff' }}>
                    <div style={{ color: settings.primary_color, fontWeight: 'bold', marginBottom: '10px' }}>
                      Primary Color Text
                    </div>
                    <button
                      style={{
                        backgroundColor: settings.primary_color,
                        color: '#fff',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      style={{
                        backgroundColor: settings.secondary_color,
                        color: '#000',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginLeft: '10px',
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Content Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Text
                  </label>
                  <textarea
                    value={settings.footer_text}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Displayed at the bottom of all emails
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => handleChange('support_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Phone
                    </label>
                    <input
                      type="text"
                      value={settings.support_phone}
                      onChange={(e) => handleChange('support_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
              <p className="text-sm text-gray-600">
                Add social media links to display in email footers. Leave blank to hide.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={settings.facebook_url}
                    onChange={(e) => handleChange('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) => handleChange('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={settings.linkedin_url}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter/X URL
                  </label>
                  <input
                    type="url"
                    value={settings.twitter_url}
                    onChange={(e) => handleChange('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Send Test Email</h3>
              <p className="text-sm text-gray-600">
                Send a test email to verify your settings are working correctly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Type
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ticket">Ticket Confirmation</option>
                    <option value="seminar_registration">Seminar Registration</option>
                    <option value="session_reminder">Session Reminder</option>
                    <option value="certificate">Certificate</option>
                    <option value="waitlist">Waitlist Notification</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSendTestEmail}
                disabled={isTesting || !testEmail}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Email Provider</h4>
          <p className="text-sm text-blue-700">
            Emails are sent via Resend. The sender email address is configured via the RESEND_FROM_EMAIL
            environment variable. These settings control the branding and content of your email templates.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
