/**
 * Site Settings Loader
 * Fetches general settings (logo, favicon, etc.) from site_settings table
 * Used by layouts to render dynamic logo and favicon
 */
import { supabaseAdmin } from '../supabase/client';

export interface SiteSettings {
  logo_url: string;
  logo_white_url: string;
  favicon_url: string;
  company_name: string;
}

const defaults: SiteSettings = {
  logo_url: '/logo.svg',
  logo_white_url: '/logo-white.svg',
  favicon_url: '/favicon.svg',
  company_name: 'GPS Dental Training',
};

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
        logo_url: val.logo_url || defaults.logo_url,
        logo_white_url: val.logo_white_url || defaults.logo_white_url,
        favicon_url: val.favicon_url || defaults.favicon_url,
        company_name: val.company_name || defaults.company_name,
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
