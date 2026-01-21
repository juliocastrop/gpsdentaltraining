/**
 * Strapi API Client
 * Handles all communication with Strapi CMS
 */

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN;

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiSingleResponse<T> {
  data: {
    id: number;
    attributes: T;
  };
  meta?: object;
}

interface StrapiCollectionResponse<T> {
  data: Array<{
    id: number;
    attributes: T;
  }>;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface FetchOptions {
  populate?: string | string[] | object;
  filters?: object;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  fields?: string[];
}

/**
 * Build query string from options
 */
function buildQueryString(options: FetchOptions): string {
  const params = new URLSearchParams();

  // Handle populate
  if (options.populate) {
    if (typeof options.populate === 'string') {
      params.append('populate', options.populate);
    } else if (Array.isArray(options.populate)) {
      options.populate.forEach((p, i) => {
        params.append(`populate[${i}]`, p);
      });
    } else {
      // Deep populate object
      params.append('populate', 'deep');
    }
  }

  // Handle filters
  if (options.filters) {
    const flattenFilters = (obj: object, prefix = 'filters'): void => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = `${prefix}[${key}]`;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenFilters(value, newKey);
        } else {
          params.append(newKey, String(value));
        }
      });
    };
    flattenFilters(options.filters);
  }

  // Handle sort
  if (options.sort) {
    if (Array.isArray(options.sort)) {
      options.sort.forEach((s, i) => {
        params.append(`sort[${i}]`, s);
      });
    } else {
      params.append('sort', options.sort);
    }
  }

  // Handle pagination
  if (options.pagination) {
    if (options.pagination.page) {
      params.append('pagination[page]', String(options.pagination.page));
    }
    if (options.pagination.pageSize) {
      params.append('pagination[pageSize]', String(options.pagination.pageSize));
    }
  }

  // Handle fields
  if (options.fields) {
    options.fields.forEach((f, i) => {
      params.append(`fields[${i}]`, f);
    });
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch from Strapi API
 */
async function fetchStrapi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const queryString = buildQueryString(options);
  const url = `${STRAPI_URL}/api${endpoint}${queryString}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (STRAPI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching from Strapi: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Transform Strapi response to flat object
 */
function flattenAttributes<T>(data: { id: number; attributes: T }): T & { id: number } {
  return {
    id: data.id,
    ...data.attributes,
  };
}

/**
 * Transform Strapi media to URL
 */
function getMediaUrl(media: any): string | null {
  if (!media?.data?.attributes?.url) return null;
  const url = media.data.attributes.url;
  // If it's a relative URL, prepend Strapi URL
  if (url.startsWith('/')) {
    return `${STRAPI_URL}${url}`;
  }
  return url;
}

/**
 * Transform multiple media items to URLs
 */
function getMediaUrls(media: any): string[] {
  if (!media?.data) return [];
  if (!Array.isArray(media.data)) {
    const url = getMediaUrl({ data: media.data });
    return url ? [url] : [];
  }
  return media.data
    .map((item: any) => getMediaUrl({ data: item }))
    .filter(Boolean) as string[];
}

// ============================================
// SINGLE TYPE FETCHERS
// ============================================

export interface HomepageData {
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: any;
  };
  heroSlides: Array<{
    id: number;
    title: string;
    subtitle?: string;
    description?: string;
    backgroundImage: any;
    ctaText?: string;
    ctaLink?: string;
    ceCredits?: number;
    order?: number;
  }>;
  statsSection?: {
    enabled: boolean;
    variant: 'overlay' | 'cards' | 'default';
    stats: Array<{
      value: number;
      suffix?: string;
      label: string;
      icon?: string;
    }>;
  };
  coursesSection?: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    autoplay: boolean;
    autoplaySpeed: number;
    slidesToShow: number;
    showAllLink: boolean;
    allCoursesLinkText?: string;
    featuredCourses?: any;
    displayMode: 'featured' | 'upcoming' | 'all';
    maxCourses: number;
  };
  whyChooseSection?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    features: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
  ctaBanner?: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    variant: 'default' | 'gold' | 'dark' | 'darkest';
    backgroundImage?: any;
  };
  speakersSection?: {
    enabled: boolean;
    title: string;
    subtitle?: string;
  };
  featuredSpeakers?: any;
  calendarSection?: {
    enabled: boolean;
    title: string;
    subtitle?: string;
  };
  testimonialsSection?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    showRatings: boolean;
    autoplay: boolean;
    testimonials?: any;
  };
  newsletterSection?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    description?: string;
    variant: 'default' | 'inline' | 'dark';
  };
  sponsorsSection?: {
    enabled: boolean;
    title?: string;
    showTitle: boolean;
    sponsors?: any;
  };
  contactSection?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    showMap: boolean;
    showContactForm: boolean;
  };
}

export async function getHomepage(): Promise<HomepageData | null> {
  try {
    const response = await fetchStrapi<StrapiSingleResponse<HomepageData>>('/homepage', {
      populate: 'deep',
    });
    return response.data?.attributes || null;
  } catch (error) {
    console.error('Error fetching homepage:', error);
    return null;
  }
}

export interface SiteSettings {
  siteName: string;
  siteDescription?: string;
  logo?: any;
  logoWhite?: any;
  favicon?: any;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    officeHours?: string;
    mapEmbedUrl?: string;
  };
  footerLinks?: Array<{
    label: string;
    url: string;
    openInNewTab?: boolean;
  }>;
  mainNavigation?: Array<{
    label: string;
    url: string;
    openInNewTab?: boolean;
  }>;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await fetchStrapi<StrapiSingleResponse<SiteSettings>>('/site-setting', {
      populate: 'deep',
    });
    return response.data?.attributes || null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

// ============================================
// COLLECTION TYPE FETCHERS
// ============================================

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  featuredImage?: any;
  gallery?: any;
  startDate: string;
  endDate?: string;
  venue?: string;
  address?: string;
  ceCredits?: number;
  capacity?: number;
  status: 'draft' | 'published' | 'cancelled';
  speakers?: any;
  category?: any;
  scheduleTopics?: Array<{
    day: number;
    time?: string;
    title: string;
    description?: string;
    speaker?: any;
  }>;
  learningObjectives?: Array<{
    objective: string;
  }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: any;
  };
}

export async function getEvents(options?: {
  status?: 'draft' | 'published' | 'cancelled';
  upcoming?: boolean;
  limit?: number;
  page?: number;
}): Promise<{ events: Event[]; pagination?: any }> {
  try {
    const filters: any = {};

    if (options?.status) {
      filters.status = { $eq: options.status };
    }

    if (options?.upcoming) {
      filters.startDate = { $gte: new Date().toISOString().split('T')[0] };
    }

    const response = await fetchStrapi<StrapiCollectionResponse<Event>>('/events', {
      populate: 'deep',
      filters,
      sort: 'startDate:asc',
      pagination: {
        page: options?.page || 1,
        pageSize: options?.limit || 25,
      },
    });

    const events = response.data?.map(flattenAttributes) || [];
    return { events, pagination: response.meta?.pagination };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { events: [] };
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const response = await fetchStrapi<StrapiCollectionResponse<Event>>('/events', {
      populate: 'deep',
      filters: {
        slug: { $eq: slug },
      },
    });

    if (response.data?.length > 0) {
      return flattenAttributes(response.data[0]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return null;
  }
}

export async function getUpcomingEventsFromStrapi(limit = 6): Promise<Event[]> {
  const { events } = await getEvents({
    status: 'published',
    upcoming: true,
    limit,
  });
  return events;
}

export interface Speaker {
  id: number;
  name: string;
  slug: string;
  title?: string;
  specialty?: string;
  bio?: string;
  shortBio?: string;
  photo?: any;
  email?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  featured?: boolean;
}

export async function getSpeakers(options?: {
  featured?: boolean;
  limit?: number;
}): Promise<Speaker[]> {
  try {
    const filters: any = {};

    if (options?.featured) {
      filters.featured = { $eq: true };
    }

    const response = await fetchStrapi<StrapiCollectionResponse<Speaker>>('/speakers', {
      populate: '*',
      filters,
      pagination: {
        pageSize: options?.limit || 100,
      },
    });

    return response.data?.map(flattenAttributes) || [];
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return [];
  }
}

export async function getSpeakerBySlug(slug: string): Promise<Speaker | null> {
  try {
    const response = await fetchStrapi<StrapiCollectionResponse<Speaker>>('/speakers', {
      populate: 'deep',
      filters: {
        slug: { $eq: slug },
      },
    });

    if (response.data?.length > 0) {
      return flattenAttributes(response.data[0]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching speaker by slug:', error);
    return null;
  }
}

export interface Testimonial {
  id: number;
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorLocation?: string;
  authorPhoto?: any;
  rating: number;
  featured?: boolean;
}

export async function getTestimonials(options?: {
  featured?: boolean;
  limit?: number;
}): Promise<Testimonial[]> {
  try {
    const filters: any = {};

    if (options?.featured) {
      filters.featured = { $eq: true };
    }

    const response = await fetchStrapi<StrapiCollectionResponse<Testimonial>>('/testimonials', {
      populate: '*',
      filters,
      sort: 'publishedAt:desc',
      pagination: {
        pageSize: options?.limit || 10,
      },
    });

    return response.data?.map(flattenAttributes) || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export interface Sponsor {
  id: number;
  name: string;
  logo: any;
  websiteUrl?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
  order: number;
}

export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const response = await fetchStrapi<StrapiCollectionResponse<Sponsor>>('/sponsors', {
      populate: '*',
      sort: 'order:asc',
    });

    return response.data?.map(flattenAttributes) || [];
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return [];
  }
}

export interface Seminar {
  id: number;
  title: string;
  slug: string;
  year: number;
  description?: string;
  featuredImage?: any;
  price: number;
  totalSessions: number;
  creditsPerSession: number;
  moderator?: any;
  sessions?: Array<{
    sessionNumber: number;
    date: string;
    startTime?: string;
    endTime?: string;
    topic?: string;
    description?: string;
  }>;
  status: 'upcoming' | 'active' | 'completed';
}

export async function getSeminars(options?: {
  status?: 'upcoming' | 'active' | 'completed';
}): Promise<Seminar[]> {
  try {
    const filters: any = {};

    if (options?.status) {
      filters.status = { $eq: options.status };
    }

    const response = await fetchStrapi<StrapiCollectionResponse<Seminar>>('/seminars', {
      populate: 'deep',
      filters,
      sort: 'year:desc',
    });

    return response.data?.map(flattenAttributes) || [];
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

export async function getSeminarBySlug(slug: string): Promise<Seminar | null> {
  try {
    const response = await fetchStrapi<StrapiCollectionResponse<Seminar>>('/seminars', {
      populate: 'deep',
      filters: {
        slug: { $eq: slug },
      },
    });

    if (response.data?.length > 0) {
      return flattenAttributes(response.data[0]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching seminar by slug:', error);
    return null;
  }
}

// ============================================
// UTILITY EXPORTS
// ============================================

export { getMediaUrl, getMediaUrls, STRAPI_URL };
