/**
 * Event Data Loader - Hybrid Strapi/Supabase
 *
 * This loader fetches event content from Strapi (when available)
 * and transactional data (tickets, availability) from Supabase.
 *
 * Falls back to Supabase-only when Strapi is not configured.
 */

import { getEventBySlug as getStrapiEventBySlug, getEvents as getStrapiEvents } from '../strapi/client';
import {
  getEventWithSpeakers,
  getPublishedEvents,
  getUpcomingEvents,
  getEventAvailability,
} from '../supabase/queries';

const STRAPI_ENABLED = !!import.meta.env.PUBLIC_STRAPI_URL && import.meta.env.PUBLIC_STRAPI_URL !== 'http://localhost:1337';

export interface EventData {
  // Core content
  id: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt?: string | null;
  featuredImageUrl: string | null;
  galleryImages?: string[];
  videoUrl?: string | null;

  // Dates & Location
  startDate: string;
  endDate: string | null;
  venue: string | null;
  address: string | null;

  // Credits & Capacity
  ceCredits: number;
  capacity: number | null;

  // Content Sections
  scheduleTopics: ScheduleTopic[] | null;
  learningObjectives: string[] | null;

  // Relations
  speakers: SpeakerData[];
  category?: CategoryData | null;

  // SEO
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };

  // Status
  status: string;
}

export interface SpeakerData {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  socialLinks?: Record<string, string>;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface ScheduleTopic {
  day: number;
  time: string;
  topic: string;
  description?: string;
}

export interface AvailabilityData {
  isAvailable: boolean;
  totalQuantity: number;
  soldCount: number;
  availableCount: number;
  ticketTypes: TicketTypeData[];
}

export interface TicketTypeData {
  id: string;
  name: string;
  ticketType: string;
  price: number;
  quantity: number;
  available: number;
  saleStart: string | null;
  saleEnd: string | null;
  manualSoldOut: boolean;
  isAvailable: boolean;
}

/**
 * Load event by slug with full data
 * Tries Strapi first, falls back to Supabase
 */
export async function loadEventBySlug(slug: string): Promise<EventData | null> {
  if (STRAPI_ENABLED) {
    try {
      const strapiEvent = await getStrapiEventBySlug(slug);
      if (strapiEvent) {
        return transformStrapiEvent(strapiEvent);
      }
    } catch (error) {
      console.warn('Strapi fetch failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  try {
    const supabaseEvent = await getEventWithSpeakers(slug);
    return transformSupabaseEvent(supabaseEvent);
  } catch (error) {
    console.error('Failed to load event:', error);
    return null;
  }
}

/**
 * Load event availability and ticket types (always from Supabase)
 */
export async function loadEventAvailability(eventId: string): Promise<AvailabilityData> {
  const availability = await getEventAvailability(eventId);

  // Calculate totals from tickets
  const totalQuantity = availability.tickets.reduce((sum, tt) => sum + tt.stock.total, 0);
  const soldCount = availability.tickets.reduce((sum, tt) => sum + tt.stock.sold, 0);
  const availableCount = availability.tickets.reduce((sum, tt) => sum + tt.stock.available, 0);

  return {
    isAvailable: availability.is_available,
    totalQuantity,
    soldCount,
    availableCount,
    ticketTypes: availability.tickets.map((tt) => ({
      id: tt.id,
      name: tt.name,
      ticketType: 'general', // Default, actual type from availability info
      price: tt.price,
      quantity: tt.stock.total,
      available: tt.stock.available,
      saleStart: null,
      saleEnd: null,
      manualSoldOut: tt.is_manual_sold_out,
      isAvailable: !tt.is_sold_out && !tt.is_manual_sold_out && tt.stock.available > 0,
    })),
  };
}

/**
 * Load upcoming events list
 */
export async function loadUpcomingEvents(limit = 10): Promise<EventData[]> {
  if (STRAPI_ENABLED) {
    try {
      const { events } = await getStrapiEvents({
        status: 'published',
        upcoming: true,
        limit,
      });
      return events.map(transformStrapiEvent);
    } catch (error) {
      console.warn('Strapi fetch failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  const events = await getUpcomingEvents(limit);
  return events.map(transformSupabaseEvent);
}

/**
 * Load all published events
 */
export async function loadAllEvents(options?: { limit?: number; page?: number }): Promise<EventData[]> {
  if (STRAPI_ENABLED) {
    try {
      const { events } = await getStrapiEvents({
        status: 'published',
        limit: options?.limit,
        page: options?.page,
      });
      return events.map(transformStrapiEvent);
    } catch (error) {
      console.warn('Strapi fetch failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  const events = await getPublishedEvents();
  return events.map(transformSupabaseEvent);
}

// ============================================
// TRANSFORMERS
// ============================================

function transformStrapiEvent(strapiEvent: any): EventData {
  const getMediaUrl = (media: any): string | null => {
    if (!media?.data?.attributes?.url) return null;
    const url = media.data.attributes.url;
    if (url.startsWith('/')) {
      return `${import.meta.env.PUBLIC_STRAPI_URL}${url}`;
    }
    return url;
  };

  return {
    id: String(strapiEvent.id),
    title: strapiEvent.title,
    slug: strapiEvent.slug,
    description: strapiEvent.description || null,
    excerpt: strapiEvent.excerpt || null,
    featuredImageUrl: getMediaUrl(strapiEvent.featuredImage),
    galleryImages: strapiEvent.gallery?.data?.map((img: any) => getMediaUrl({ data: img })).filter(Boolean) || [],
    videoUrl: strapiEvent.videoUrl || null,
    startDate: strapiEvent.startDate,
    endDate: strapiEvent.endDate || null,
    venue: strapiEvent.venue || null,
    address: strapiEvent.address || null,
    ceCredits: strapiEvent.ceCredits || 0,
    capacity: strapiEvent.capacity || null,
    scheduleTopics: strapiEvent.scheduleTopics?.map((topic: any) => ({
      day: topic.day || 1,
      time: topic.time || '',
      topic: topic.title || topic.topic || '',
      description: topic.description,
    })) || null,
    learningObjectives: strapiEvent.learningObjectives?.map((obj: any) => obj.objective || obj.text) || null,
    speakers: strapiEvent.speakers?.data?.map((speaker: any) => ({
      id: String(speaker.id),
      name: speaker.attributes.name,
      slug: speaker.attributes.slug,
      title: speaker.attributes.title || null,
      bio: speaker.attributes.bio || null,
      photoUrl: getMediaUrl(speaker.attributes.photo),
      socialLinks: speaker.attributes.socialLinks?.reduce((acc: any, link: any) => {
        acc[link.platform.toLowerCase()] = link.url;
        return acc;
      }, {}) || {},
    })) || [],
    category: strapiEvent.category?.data ? {
      id: String(strapiEvent.category.data.id),
      name: strapiEvent.category.data.attributes.name,
      slug: strapiEvent.category.data.attributes.slug,
      color: strapiEvent.category.data.attributes.color,
    } : null,
    seo: strapiEvent.seo ? {
      metaTitle: strapiEvent.seo.metaTitle,
      metaDescription: strapiEvent.seo.metaDescription,
      ogImage: getMediaUrl(strapiEvent.seo.ogImage) ?? undefined,
    } : undefined,
    status: strapiEvent.status || 'published',
  };
}

function transformSupabaseEvent(supabaseEvent: any): EventData {
  return {
    id: supabaseEvent.id,
    title: supabaseEvent.title,
    slug: supabaseEvent.slug,
    description: supabaseEvent.description || null,
    excerpt: supabaseEvent.excerpt || null,
    featuredImageUrl: supabaseEvent.featured_image_url || null,
    galleryImages: supabaseEvent.gallery_images || [],
    videoUrl: supabaseEvent.video_url || null,
    startDate: supabaseEvent.start_date,
    endDate: supabaseEvent.end_date || null,
    venue: supabaseEvent.venue || null,
    address: supabaseEvent.address || null,
    ceCredits: supabaseEvent.ce_credits || 0,
    capacity: supabaseEvent.capacity || null,
    scheduleTopics: supabaseEvent.schedule_topics || null,
    learningObjectives: supabaseEvent.learning_objectives || null,
    speakers: supabaseEvent.speakers?.map((speaker: any) => ({
      id: speaker.id,
      name: speaker.name,
      slug: speaker.slug,
      title: speaker.title || null,
      bio: speaker.bio || null,
      photoUrl: speaker.photo_url || null,
      socialLinks: speaker.social_links || {},
    })) || [],
    category: supabaseEvent.category ? {
      id: supabaseEvent.category.id,
      name: supabaseEvent.category.name,
      slug: supabaseEvent.category.slug,
      color: supabaseEvent.category.color,
    } : null,
    seo: undefined,
    status: supabaseEvent.status || 'published',
  };
}
