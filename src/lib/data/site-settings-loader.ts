/**
 * Site Settings Loader
 * Fetches general settings (logo, favicon, footer, etc.) from site_settings table
 * Used by layouts to render dynamic logo, favicon, footer content
 */
import { supabaseAdmin } from '../supabase/client';

export interface FooterLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  // Branding
  logo_url: string;
  logo_white_url: string;
  favicon_url: string;
  company_name: string;

  // Contact
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;

  // Social Media
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
  vimeo_url: string;
  youtube_url: string;

  // Footer
  footer_description: string;
  footer_links: FooterLink[];
  footer_copyright: string;
  footer_show_pace: boolean;
  footer_pace_image_url: string;
  footer_pace_text: string;
  footer_bottom_links: FooterLink[];
}

const defaults: SiteSettings = {
  logo_url: '/logo.svg',
  logo_white_url: '/logo-white.svg',
  favicon_url: '/favicon.svg',
  company_name: 'GPS Dental Training',

  email: 'gpsdentaltraining@gaprostho.com',
  phone: '',
  address_line_1: '6320 Sugarloaf Parkway',
  address_line_2: '',
  city: 'Duluth',
  state: 'GA',
  zip: '30097',

  facebook_url: 'https://facebook.com/gpsdentaltraining',
  instagram_url: 'https://instagram.com/gpsdentaltraining',
  linkedin_url: 'https://linkedin.com/company/gpsdentaltraining',
  twitter_url: '',
  vimeo_url: 'https://vimeo.com/gpsdentaltraining',
  youtube_url: '',

  footer_description: 'Advanced Education in Implant, Restorative and Digital dentistry',
  footer_links: [
    { label: 'Events', href: '/courses' },
    { label: 'Monthly Seminars', href: '/monthly-seminars' },
    { label: 'Verify Certificate', href: '/certificate' },
    { label: 'Refer to a Prostho', href: '/refer' },
    { label: 'Contact', href: '/contact' },
    { label: 'Terms and Conditions', href: '/terms' },
  ],
  footer_copyright: '© {year} GPS Dental Training. All rights reserved.',
  footer_show_pace: true,
  footer_pace_image_url: '',
  footer_pace_text: 'Academy of General Dentistry\nProgram Approval for Continuing Education',
  footer_bottom_links: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

/** Build props object for the Footer component from SiteSettings */
export function getFooterProps(s: SiteSettings) {
  return {
    logo: s.logo_white_url || s.logo_url,
    companyName: s.company_name,
    description: s.footer_description,
    email: s.email,
    phone: s.phone,
    addressLine1: s.address_line_1,
    addressLine2: s.address_line_2,
    city: s.city,
    state: s.state,
    zip: s.zip,
    facebookUrl: s.facebook_url,
    instagramUrl: s.instagram_url,
    linkedinUrl: s.linkedin_url,
    twitterUrl: s.twitter_url,
    vimeoUrl: s.vimeo_url,
    youtubeUrl: s.youtube_url,
    footerLinks: s.footer_links,
    copyright: s.footer_copyright,
    showPace: s.footer_show_pace,
    paceImageUrl: s.footer_pace_image_url,
    paceText: s.footer_pace_text,
    bottomLinks: s.footer_bottom_links,
  };
}

let cached: SiteSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

/** Invalidate the cache so next getSiteSettings() call fetches fresh data */
export function invalidateSiteSettingsCache() {
  cached = null;
  cacheTime = 0;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_TTL) {
    return cached;
  }

  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'general_settings')
      .single();

    if (data?.value) {
      const val = data.value as Record<string, any>;
      cached = {
        // Branding
        logo_url: val.logo_url || defaults.logo_url,
        logo_white_url: val.logo_white_url || defaults.logo_white_url,
        favicon_url: val.favicon_url || defaults.favicon_url,
        company_name: val.company_name || defaults.company_name,

        // Contact
        email: val.email || defaults.email,
        phone: val.phone || defaults.phone,
        address_line_1: val.address_line_1 || defaults.address_line_1,
        address_line_2: val.address_line_2 || defaults.address_line_2,
        city: val.city || defaults.city,
        state: val.state || defaults.state,
        zip: val.zip || defaults.zip,

        // Social
        facebook_url: val.facebook_url || defaults.facebook_url,
        instagram_url: val.instagram_url || defaults.instagram_url,
        linkedin_url: val.linkedin_url || defaults.linkedin_url,
        twitter_url: val.twitter_url || defaults.twitter_url,
        vimeo_url: val.vimeo_url || defaults.vimeo_url,
        youtube_url: val.youtube_url || defaults.youtube_url,

        // Footer
        footer_description: val.footer_description ?? defaults.footer_description,
        footer_links: Array.isArray(val.footer_links) ? val.footer_links : defaults.footer_links,
        footer_copyright: val.footer_copyright || defaults.footer_copyright,
        footer_show_pace: val.footer_show_pace ?? defaults.footer_show_pace,
        footer_pace_image_url: val.footer_pace_image_url || defaults.footer_pace_image_url,
        footer_pace_text: val.footer_pace_text ?? defaults.footer_pace_text,
        footer_bottom_links: Array.isArray(val.footer_bottom_links) ? val.footer_bottom_links : defaults.footer_bottom_links,
      };
    } else {
      cached = { ...defaults };
    }
  } catch {
    cached = { ...defaults };
  }

  cacheTime = now;
  return cached;
}
