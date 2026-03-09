/**
 * Page Editor Component - GPS Dental Training Admin
 * Block-based content editor for CMS pages
 * Supports: Rich Text, Hero, FAQ, CTA, Image+Text, Divider sections
 */
import { useState, useRef } from 'react';
import AdminShell from './AdminShell';

// ─── Types ───────────────────────────────────────────────────
interface Page {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  content: { sections?: Section[] } & Record<string, any>;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type SectionType = 'richtext' | 'hero' | 'faq' | 'cta' | 'image_text' | 'divider' | 'html';

interface Section {
  id: string;
  type: SectionType;
  data: Record<string, any>;
}

interface PageEditorProps {
  currentPath: string;
  user: { name: string; email: string };
  page: Page;
}

// ─── Section Type Definitions ────────────────────────────────
const sectionTypes: { type: SectionType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'richtext',
    label: 'Rich Text',
    description: 'Paragraphs, headings, lists, and formatted text',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>,
  },
  {
    type: 'hero',
    label: 'Hero Banner',
    description: 'Large heading with optional subtitle and background',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v13.5A1.5 1.5 0 0 0 3.75 21Z" /></svg>,
  },
  {
    type: 'image_text',
    label: 'Image + Text',
    description: 'Side-by-side image and text content',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>,
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Collapsible question and answer pairs',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>,
  },
  {
    type: 'cta',
    label: 'Call to Action',
    description: 'Highlighted section with buttons',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></svg>,
  },
  {
    type: 'html',
    label: 'Custom HTML',
    description: 'Raw HTML content for embeds or custom layouts',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator between sections',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>,
  },
];

// ─── Default data per section type ───────────────────────────
function getDefaultData(type: SectionType): Record<string, any> {
  switch (type) {
    case 'richtext': return { heading: '', body: '' };
    case 'hero': return { heading: '', subtitle: '', bg_color: '#13326A', text_color: '#ffffff', image_url: '' };
    case 'image_text': return { heading: '', body: '', image_url: '', image_alt: '', layout: 'image-left' };
    case 'faq': return { heading: 'Frequently Asked Questions', items: [{ question: '', answer: '' }] };
    case 'cta': return { heading: '', description: '', primary_label: '', primary_href: '', secondary_label: '', secondary_href: '', bg_color: '#13326A' };
    case 'html': return { code: '' };
    case 'divider': return { style: 'line' };
    default: return {};
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ─── System Pages (have dedicated Astro layouts) ─────────────
const SYSTEM_PAGES: Record<string, { label: string; description: string }> = {
  about: { label: 'About Us', description: 'Mission, vision, facilities, stats, and team section' },
  contact: { label: 'Contact', description: 'Address, phone, email, hours, and social links' },
};

// ─── System Page Editors ─────────────────────────────────────
function AboutPageEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const location = content.location || { address: '', city: '', state: '', zip: '', description: '' };
  const stats = content.stats || [
    { value: '15+', label: 'Years of Excellence' },
    { value: '1,000+', label: 'Professionals Trained', accent: true },
    { value: '100+', label: 'Courses Delivered' },
    { value: '10,000+', label: 'CE Credits Awarded' },
  ];
  const facilities = content.facilities || [
    { name: 'Clinical Settings', description: '', icon: 'clinical' },
    { name: 'Prostho Dental Lab', description: '', icon: 'lab' },
    { name: 'Digital Technology', description: '', icon: 'digital' },
  ];

  return (
    <div className="space-y-8">
      {/* Mission & Vision */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mission & Vision</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mission Statement</label>
            <textarea value={content.mission || ''} onChange={(e) => update('mission', e.target.value)} rows={4} placeholder="Our mission is..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vision Statement</label>
            <textarea value={content.vision || ''} onChange={(e) => update('vision', e.target.value)} rows={4} placeholder="Our vision is..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hero Stats</h3>
        <div className="space-y-3">
          {stats.map((stat: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3">
              <input type="text" value={stat.value} onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], value: e.target.value }; update('stats', s); }} placeholder="15+" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold" />
              <input type="text" value={stat.label} onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], label: e.target.value }; update('stats', s); }} placeholder="Years of Excellence" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={!!stat.accent} onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], accent: e.target.checked }; update('stats', s); }} className="rounded border-gray-300" />
                Gold
              </label>
              <button type="button" onClick={() => { const s = stats.filter((_: any, i: number) => i !== idx); update('stats', s); }} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => update('stats', [...stats, { value: '', label: '' }])} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Stat
          </button>
        </div>
      </div>

      {/* Facilities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Facilities</h3>
        <div className="space-y-4">
          {facilities.map((fac: any, idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" value={fac.name} onChange={(e) => { const f = [...facilities]; f[idx] = { ...f[idx], name: e.target.value }; update('facilities', f); }} placeholder="Facility name" className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium" />
                <select value={fac.icon} onChange={(e) => { const f = [...facilities]; f[idx] = { ...f[idx], icon: e.target.value }; update('facilities', f); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="clinical">Clinical</option>
                  <option value="lab">Laboratory</option>
                  <option value="digital">Digital</option>
                </select>
                <button type="button" onClick={() => update('facilities', facilities.filter((_: any, i: number) => i !== idx))} className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">Remove</button>
              </div>
              <textarea value={fac.description} onChange={(e) => { const f = [...facilities]; f[idx] = { ...f[idx], description: e.target.value }; update('facilities', f); }} rows={2} placeholder="Facility description..." className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <button type="button" onClick={() => update('facilities', [...facilities, { name: '', description: '', icon: 'clinical' }])} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Facility
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={location.address} onChange={(e) => update('location', { ...location, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={location.city} onChange={(e) => update('location', { ...location, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={location.state} onChange={(e) => update('location', { ...location, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input type="text" value={location.zip} onChange={(e) => update('location', { ...location, zip: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Description</label>
          <input type="text" value={location.description} onChange={(e) => update('location', { ...location, description: e.target.value })} placeholder="Easy access via I-85..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

function ContactPageEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const address = content.address || { line1: '', city: '', state: '', zip: '', country: 'United States' };
  const hours = content.hours || { weekdays: 'Monday - Friday: 8:00 AM - 5:00 PM EST', weekend: 'Saturday - Sunday: Closed' };
  const social = content.social || { facebook: '', instagram: '', linkedin: '', youtube: '' };

  return (
    <div className="space-y-8">
      {/* Contact Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={content.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="(770) 232-0240" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={content.email || ''} onChange={(e) => update('email', e.target.value)} placeholder="info@gpsdentaltraining.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Address</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" value={address.line1} onChange={(e) => update('address', { ...address, line1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={address.city} onChange={(e) => update('address', { ...address, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={address.state} onChange={(e) => update('address', { ...address, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input type="text" value={address.zip} onChange={(e) => update('address', { ...address, zip: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Business Hours</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekdays</label>
            <input type="text" value={hours.weekdays} onChange={(e) => update('hours', { ...hours, weekdays: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekend</label>
            <input type="text" value={hours.weekend} onChange={(e) => update('hours', { ...hours, weekend: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['facebook', 'instagram', 'linkedin', 'youtube'].map(platform => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{platform}</label>
              <input type="url" value={social[platform] || ''} onChange={(e) => update('social', { ...social, [platform]: e.target.value })} placeholder={`https://${platform}.com/...`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor Component ───────────────────────────────────
export default function PageEditor({ currentPath, user, page: initialPage }: PageEditorProps) {
  const [page, setPage] = useState<Page>(initialPage);
  const [sections, setSections] = useState<Section[]>(initialPage.content?.sections || []);
  const [pageContent, setPageContent] = useState<Record<string, any>>(initialPage.content || {});
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(
    (initialPage.content?.sections || []).map((s: Section) => s.id)
  ));
  const heroImageRef = useRef<HTMLInputElement>(null);

  const isSystemPage = page.slug in SYSTEM_PAGES;

  // ─── Save ──────────────────────────────────────────────────
  const handleSave = async (publishAction?: 'publish' | 'draft') => {
    setIsSaving(true);
    setMessage(null);

    try {
      const savedContent = isSystemPage
        ? pageContent
        : { ...pageContent, sections };

      const payload: Record<string, any> = {
        title: page.title,
        slug: page.slug,
        subtitle: page.subtitle,
        hero_image_url: page.hero_image_url,
        content: savedContent,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        og_image_url: page.og_image_url,
      };

      if (publishAction) {
        payload.status = publishAction === 'publish' ? 'published' : 'draft';
      }

      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save');

      setPage(prev => ({ ...prev, ...result.data }));
      setMessage({ type: 'success', text: publishAction ? `Page ${publishAction === 'publish' ? 'published' : 'unpublished'} successfully` : 'Page saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Image Upload ──────────────────────────────────────────
  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field', 'page_image');

    try {
      const response = await fetch('/api/admin/upload/site-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      callback(result.url);
    } catch {
      setMessage({ type: 'error', text: 'Image upload failed' });
    }
  };

  // ─── Section Management ────────────────────────────────────
  const addSection = (type: SectionType) => {
    const newSection: Section = { id: generateId(), type, data: getDefaultData(type) };
    setSections(prev => {
      if (insertIndex !== null) {
        const updated = [...prev];
        updated.splice(insertIndex, 0, newSection);
        return updated;
      }
      return [...prev, newSection];
    });
    setExpandedSections(prev => new Set([...prev, newSection.id]));
    setShowAddBlock(false);
    setInsertIndex(null);
  };

  const removeSection = (id: string) => {
    if (!confirm('Remove this section?')) return;
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const updated = [...prev];
      const target = direction === 'up' ? idx - 1 : idx + 1;
      [updated[idx], updated[target]] = [updated[target], updated[idx]];
      return updated;
    });
  };

  const updateSectionData = (id: string, data: Record<string, any>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data: { ...s.data, ...data } } : s));
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const duplicateSection = (id: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const clone: Section = { ...prev[idx], id: generateId(), data: JSON.parse(JSON.stringify(prev[idx].data)) };
      const updated = [...prev];
      updated.splice(idx + 1, 0, clone);
      return updated;
    });
  };

  // ─── Section Editors ───────────────────────────────────────
  const renderSectionEditor = (section: Section) => {
    const { type, data } = section;
    const update = (d: Record<string, any>) => updateSectionData(section.id, d);

    switch (type) {
      case 'richtext':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading (optional)</label>
              <input
                type="text"
                value={data.heading || ''}
                onChange={(e) => update({ heading: e.target.value })}
                placeholder="Section heading..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-gray-400 font-normal">(supports Markdown: **bold**, *italic*, ## heading, - lists, [links](url))</span>
              </label>
              <textarea
                value={data.body || ''}
                onChange={(e) => update({ body: e.target.value })}
                rows={12}
                placeholder="Write your content here using Markdown formatting..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              />
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                <input type="text" value={data.heading || ''} onChange={(e) => update({ heading: e.target.value })} placeholder="Main heading..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input type="text" value={data.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} placeholder="Optional subtitle..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
              <input type="text" value={data.image_url || ''} onChange={(e) => update({ image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.bg_color || '#13326A'} onChange={(e) => update({ bg_color: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                  <input type="text" value={data.bg_color || '#13326A'} onChange={(e) => update({ bg_color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.text_color || '#ffffff'} onChange={(e) => update({ text_color: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                  <input type="text" value={data.text_color || '#ffffff'} onChange={(e) => update({ text_color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'image_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
              <select value={data.layout || 'image-left'} onChange={(e) => update({ layout: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option value="image-left">Image Left, Text Right</option>
                <option value="image-right">Image Right, Text Left</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="text" value={data.image_url || ''} onChange={(e) => update({ image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Alt Text</label>
              <input type="text" value={data.image_alt || ''} onChange={(e) => update({ image_alt: e.target.value })} placeholder="Describe the image..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input type="text" value={data.heading || ''} onChange={(e) => update({ heading: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
              <textarea value={data.body || ''} onChange={(e) => update({ body: e.target.value })} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono" />
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
              <input type="text" value={data.heading || ''} onChange={(e) => update({ heading: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div className="space-y-3">
              {(data.items || []).map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-400 mt-2">Q{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const items = [...(data.items || [])];
                          items[idx] = { ...items[idx], question: e.target.value };
                          update({ items });
                        }}
                        placeholder="Question..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                      />
                      <textarea
                        value={item.answer}
                        onChange={(e) => {
                          const items = [...(data.items || [])];
                          items[idx] = { ...items[idx], answer: e.target.value };
                          update({ items });
                        }}
                        rows={3}
                        placeholder="Answer (supports Markdown)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const items = [...(data.items || [])];
                        items.splice(idx, 1);
                        update({ items });
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ items: [...(data.items || []), { question: '', answer: '' }] })}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Question
              </button>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input type="text" value={data.heading || ''} onChange={(e) => update({ heading: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={data.description || ''} onChange={(e) => update({ description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Label</label>
                <input type="text" value={data.primary_label || ''} onChange={(e) => update({ primary_label: e.target.value })} placeholder="e.g., Get Started" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Link</label>
                <input type="text" value={data.primary_href || ''} onChange={(e) => update({ primary_href: e.target.value })} placeholder="/courses" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Label</label>
                <input type="text" value={data.secondary_label || ''} onChange={(e) => update({ secondary_label: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Link</label>
                <input type="text" value={data.secondary_href || ''} onChange={(e) => update({ secondary_href: e.target.value })} placeholder="/contact" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.bg_color || '#13326A'} onChange={(e) => update({ bg_color: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={data.bg_color || '#13326A'} onChange={(e) => update({ bg_color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        );

      case 'html':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HTML Code</label>
            <textarea
              value={data.code || ''}
              onChange={(e) => update({ code: e.target.value })}
              rows={12}
              placeholder="<div>Your custom HTML...</div>"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />
            <p className="text-xs text-amber-600 mt-1">
              Be careful with custom HTML. Scripts will not execute for security reasons.
            </p>
          </div>
        );

      case 'divider':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Divider Style</label>
            <select value={data.style || 'line'} onChange={(e) => update({ style: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="line">Line</option>
              <option value="dots">Dots</option>
              <option value="space">Space Only</option>
            </select>
          </div>
        );

      default:
        return <p className="text-gray-500 text-sm">Unknown section type: {type}</p>;
    }
  };

  // ─── Render ────────────────────────────────────────────────
  const sectionLabel = (type: SectionType) => sectionTypes.find(s => s.type === type)?.label || type;
  const sectionIcon = (type: SectionType) => sectionTypes.find(s => s.type === type)?.icon;

  return (
    <AdminShell currentPath={currentPath} user={user} title="Edit Page">
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin/pages" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{page.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>/{page.slug}</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  page.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {page.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {page.status === 'published' && (
              <a href={`/${page.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                View Page
              </a>
            )}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(page.status === 'published' ? 'draft' : 'publish')}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                page.status === 'published'
                  ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
                  : 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
              }`}
            >
              {page.status === 'published' ? 'Unpublish' : 'Save & Publish'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {(['content', 'settings', 'seo'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'content' ? 'Content' : tab === 'settings' ? 'Page Settings' : 'SEO'}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── Content Tab ──────────────────────────────────── */}
        {activeTab === 'content' && isSystemPage && page.slug === 'about' && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              This is a system page with a dedicated layout. Edit the structured content fields below.
            </div>
            <AboutPageEditor content={pageContent} onChange={setPageContent} />
          </div>
        )}

        {activeTab === 'content' && isSystemPage && page.slug === 'contact' && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              This is a system page with a dedicated layout. Edit the structured content fields below.
            </div>
            <ContactPageEditor content={pageContent} onChange={setPageContent} />
          </div>
        )}

        {activeTab === 'content' && !isSystemPage && (
          <div className="space-y-4">
            {/* Sections */}
            {sections.map((section, idx) => (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Section header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="text-gray-400">{sectionIcon(section.type)}</span>
                  <span className="text-sm font-semibold text-gray-700 flex-1">
                    {sectionLabel(section.type)}
                    {section.data?.heading && (
                      <span className="font-normal text-gray-400 ml-2">— {section.data.heading}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded" title="Move up">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded" title="Move down">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button type="button" onClick={() => duplicateSection(section.id)} className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Duplicate">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button type="button" onClick={() => removeSection(section.id)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Remove">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has(section.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Section content */}
                {expandedSections.has(section.id) && (
                  <div className="p-5">
                    {renderSectionEditor(section)}
                  </div>
                )}
              </div>
            ))}

            {/* Add Section Button */}
            <button
              type="button"
              onClick={() => { setShowAddBlock(true); setInsertIndex(null); }}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>
          </div>
        )}

        {/* ─── Settings Tab ─────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title *</label>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => setPage(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/</span>
                  <input
                    type="text"
                    value={page.slug}
                    onChange={(e) => setPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
              <input
                type="text"
                value={page.subtitle || ''}
                onChange={(e) => setPage(p => ({ ...p, subtitle: e.target.value }))}
                placeholder="Optional subtitle or tagline"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Image URL</label>
              <input
                type="text"
                value={page.hero_image_url || ''}
                onChange={(e) => setPage(p => ({ ...p, hero_image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={page.status}
                onChange={(e) => setPage(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}

        {/* ─── SEO Tab ──────────────────────────────────────── */}
        {activeTab === 'seo' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
              <input
                type="text"
                value={page.meta_title || ''}
                onChange={(e) => setPage(p => ({ ...p, meta_title: e.target.value }))}
                placeholder={page.title}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{(page.meta_title || page.title).length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
              <textarea
                value={page.meta_description || ''}
                onChange={(e) => setPage(p => ({ ...p, meta_description: e.target.value }))}
                rows={3}
                placeholder="Brief description for search engines..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{(page.meta_description || '').length}/160 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Open Graph Image URL</label>
              <input
                type="text"
                value={page.og_image_url || ''}
                onChange={(e) => setPage(p => ({ ...p, og_image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* SEO Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-3">Search Engine Preview</p>
              <div className="text-blue-700 text-lg font-medium hover:underline cursor-default">
                {page.meta_title || page.title} | GPS Dental Training
              </div>
              <div className="text-green-700 text-sm">
                gpsdentaltraining.com/{page.slug}
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                {page.meta_description || 'No description set. Add a meta description to improve search visibility.'}
              </div>
            </div>
          </div>
        )}

        {/* ─── Add Block Modal ──────────────────────────────── */}
        {showAddBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Add Section</h2>
                <button type="button" title="Close" onClick={() => setShowAddBlock(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {sectionTypes.map(st => (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => addSection(st.type)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 text-gray-500">{st.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{st.label}</div>
                      <div className="text-xs text-gray-500">{st.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
