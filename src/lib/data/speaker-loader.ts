/**
 * Speaker Data Loader - Hybrid Strapi/Supabase
 */

import { getSpeakers as getStrapiSpeakers, getSpeakerBySlug as getStrapiSpeakerBySlug } from '../strapi/client';
import { getSpeakers as getSupabaseSpeakers, getSpeakerBySlug as getSupabaseSpeakerBySlug } from '../supabase/queries';

const STRAPI_ENABLED = !!import.meta.env.PUBLIC_STRAPI_URL && import.meta.env.PUBLIC_STRAPI_URL !== 'http://localhost:1337';

export interface SpeakerData {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  specialty?: string | null;
  bio: string | null;
  shortBio?: string | null;
  photoUrl: string | null;
  email?: string | null;
  socialLinks: Record<string, string>;
  featured: boolean;
}

/**
 * Load all speakers
 */
export async function loadSpeakers(options?: { featured?: boolean; limit?: number }): Promise<SpeakerData[]> {
  if (STRAPI_ENABLED) {
    try {
      const speakers = await getStrapiSpeakers(options);
      return speakers.map(transformStrapiSpeaker);
    } catch (error) {
      console.warn('Strapi fetch failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  const speakers = await getSupabaseSpeakers();
  let result = speakers.map(transformSupabaseSpeaker);

  if (options?.featured) {
    result = result.filter(s => s.featured);
  }

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

/**
 * Load speaker by slug
 */
export async function loadSpeakerBySlug(slug: string): Promise<SpeakerData | null> {
  if (STRAPI_ENABLED) {
    try {
      const speaker = await getStrapiSpeakerBySlug(slug);
      if (speaker) {
        return transformStrapiSpeaker(speaker);
      }
    } catch (error) {
      console.warn('Strapi fetch failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  try {
    const speaker = await getSupabaseSpeakerBySlug(slug);
    return speaker ? transformSupabaseSpeaker(speaker) : null;
  } catch {
    return null;
  }
}

function transformStrapiSpeaker(speaker: any): SpeakerData {
  const getMediaUrl = (media: any): string | null => {
    if (!media?.data?.attributes?.url) return null;
    const url = media.data.attributes.url;
    if (url.startsWith('/')) {
      return `${import.meta.env.PUBLIC_STRAPI_URL}${url}`;
    }
    return url;
  };

  return {
    id: String(speaker.id),
    name: speaker.name,
    slug: speaker.slug,
    title: speaker.title || null,
    specialty: speaker.specialty || null,
    bio: speaker.bio || null,
    shortBio: speaker.shortBio || null,
    photoUrl: getMediaUrl(speaker.photo),
    email: speaker.email || null,
    socialLinks: speaker.socialLinks?.reduce((acc: any, link: any) => {
      acc[link.platform.toLowerCase()] = link.url;
      return acc;
    }, {}) || {},
    featured: speaker.featured || false,
  };
}

function transformSupabaseSpeaker(speaker: any): SpeakerData {
  return {
    id: speaker.id,
    name: speaker.name,
    slug: speaker.slug,
    title: speaker.title || null,
    specialty: speaker.specialty || null,
    bio: speaker.bio || null,
    shortBio: speaker.short_bio || null,
    photoUrl: speaker.photo_url || null,
    email: speaker.email || null,
    socialLinks: speaker.social_links || {},
    featured: speaker.featured || false,
  };
}
