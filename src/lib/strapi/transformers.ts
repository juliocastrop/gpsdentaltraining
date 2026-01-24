/**
 * Strapi Data Transformers
 * Transform Strapi data to component props format
 */

import {
  getMediaUrl,
  type HomepageData,
  type Event,
  type Speaker,
  type Testimonial,
  type Sponsor,
} from './client';

// ============================================
// HERO SLIDER TRANSFORMER
// ============================================

export interface HeroSlideProps {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  ceCredits?: number;
}

export function transformHeroSlides(
  slides: HomepageData['heroSlides']
): HeroSlideProps[] {
  if (!slides || !Array.isArray(slides)) return [];

  return slides
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((slide) => ({
      id: String(slide.id),
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      imageUrl: getMediaUrl(slide.backgroundImage) || '/placeholder-hero.jpg',
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      ceCredits: slide.ceCredits,
    }));
}

// ============================================
// STATS TRANSFORMER
// ============================================

export interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  icon?: string;
}

export function transformStats(
  statsSection: HomepageData['statsSection']
): { enabled: boolean; variant: 'overlay' | 'cards' | 'default'; stats: StatProps[] } {
  if (!statsSection) {
    return {
      enabled: true,
      variant: 'overlay',
      stats: [],
    };
  }

  return {
    enabled: statsSection.enabled,
    variant: statsSection.variant || 'overlay',
    stats: (statsSection.stats || []).map((stat) => ({
      value: stat.value,
      suffix: stat.suffix,
      label: stat.label,
      icon: stat.icon,
    })),
  };
}

// ============================================
// COURSES SECTION TRANSFORMER
// ============================================

export interface CourseCardProps {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  ceCredits?: number;
  featuredImage?: string;
  price?: number;
}

export function transformCoursesSectionConfig(
  coursesSection: HomepageData['coursesSection']
): {
  enabled: boolean;
  title: string;
  subtitle?: string;
  autoplay: boolean;
  autoplaySpeed: number;
  slidesToShow: number;
  showAllLink: boolean;
  allCoursesLinkText: string;
  displayMode: 'featured' | 'upcoming' | 'all';
  maxCourses: number;
} {
  if (!coursesSection) {
    return {
      enabled: true,
      title: 'Upcoming Courses',
      subtitle: "Don't Miss Out",
      autoplay: true,
      autoplaySpeed: 5000,
      slidesToShow: 3,
      showAllLink: true,
      allCoursesLinkText: 'View All Courses',
      displayMode: 'upcoming',
      maxCourses: 6,
    };
  }

  return {
    enabled: coursesSection.enabled,
    title: coursesSection.title || 'Upcoming Courses',
    subtitle: coursesSection.subtitle,
    autoplay: coursesSection.autoplay,
    autoplaySpeed: coursesSection.autoplaySpeed || 5000,
    slidesToShow: coursesSection.slidesToShow || 3,
    showAllLink: coursesSection.showAllLink,
    allCoursesLinkText: coursesSection.allCoursesLinkText || 'View All Courses',
    displayMode: coursesSection.displayMode || 'upcoming',
    maxCourses: coursesSection.maxCourses || 6,
  };
}

export function transformEvents(events: Event[]): CourseCardProps[] {
  return events.map((event) => ({
    id: String(event.id),
    title: event.title,
    slug: event.slug,
    description: event.shortDescription || event.description?.substring(0, 150),
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    ceCredits: event.ceCredits,
    featuredImage: getMediaUrl(event.featuredImage) || undefined,
    price: undefined, // Would come from ticket_types
  }));
}

// ============================================
// WHY CHOOSE SECTION TRANSFORMER
// ============================================

export interface FeatureProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function transformWhyChooseSection(
  section: HomepageData['whyChooseSection']
): {
  enabled: boolean;
  title: string;
  subtitle: string;
  features: FeatureProps[];
} {
  if (!section) {
    return {
      enabled: true,
      title: 'Why Choose GPS Dental Training?',
      subtitle: 'Excellence in Education',
      features: [],
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Why Choose GPS Dental Training?',
    subtitle: section.subtitle || 'Excellence in Education',
    features: (section.features || []).map((feature, index) => ({
      id: `feature-${index}`,
      title: feature.title,
      description: feature.description,
      icon: undefined, // Icons would need to be mapped from string identifiers
    })),
  };
}

// ============================================
// CTA BANNER TRANSFORMER
// ============================================

export interface CTABannerProps {
  enabled: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  variant: 'default' | 'gold' | 'dark' | 'darkest';
  backgroundImage?: string;
}

export function transformCTABanner(
  banner: HomepageData['ctaBanner']
): CTABannerProps {
  if (!banner) {
    return {
      enabled: false,
      title: '',
      variant: 'default',
    };
  }

  return {
    enabled: banner.enabled,
    title: banner.title,
    subtitle: banner.subtitle,
    description: banner.description,
    ctaText: banner.ctaText,
    ctaLink: banner.ctaLink,
    variant: banner.variant || 'default',
    backgroundImage: getMediaUrl(banner.backgroundImage) || undefined,
  };
}

// ============================================
// SPEAKERS TRANSFORMER
// ============================================

export interface SpeakerCardProps {
  id: string;
  name: string;
  title?: string;
  specialty?: string;
  bio?: string;
  image?: string;
  slug?: string;
}

export function transformSpeakers(speakers: Speaker[]): SpeakerCardProps[] {
  return speakers.map((speaker) => ({
    id: String(speaker.id),
    name: speaker.name,
    title: speaker.title,
    specialty: speaker.credentials || (speaker.specialties?.[0] ?? undefined),
    bio: speaker.shortBio || speaker.bio?.substring(0, 200),
    image: getMediaUrl(speaker.photo) || undefined,
    slug: speaker.slug,
  }));
}

export function transformSpeakersSection(
  section: HomepageData['speakersSection']
): {
  enabled: boolean;
  title: string;
  subtitle: string;
} {
  if (!section) {
    return {
      enabled: true,
      title: 'Learn from World-Class Experts',
      subtitle: 'Our Faculty',
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Learn from World-Class Experts',
    subtitle: section.subtitle || 'Our Faculty',
  };
}

// ============================================
// TESTIMONIALS TRANSFORMER
// ============================================

export interface TestimonialCardProps {
  id: string;
  quote: string;
  author: string;
  title?: string;
  location?: string;
  image?: string;
  rating: number;
}

export function transformTestimonials(
  testimonials: Testimonial[]
): TestimonialCardProps[] {
  return testimonials.map((testimonial) => ({
    id: String(testimonial.id),
    quote: testimonial.quote,
    author: testimonial.author,
    title: testimonial.title,
    location: testimonial.location,
    image: getMediaUrl(testimonial.image) || undefined,
    rating: testimonial.rating || 5,
  }));
}

export function transformTestimonialsSection(
  section: HomepageData['testimonialsSection']
): {
  enabled: boolean;
  title: string;
  subtitle: string;
  showRatings: boolean;
  autoplay: boolean;
} {
  if (!section) {
    return {
      enabled: true,
      title: 'What Our Students Say',
      subtitle: 'Success Stories',
      showRatings: true,
      autoplay: true,
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'What Our Students Say',
    subtitle: section.subtitle || 'Success Stories',
    showRatings: section.showRatings,
    autoplay: section.autoplay,
  };
}

// ============================================
// NEWSLETTER TRANSFORMER
// ============================================

export interface NewsletterSectionProps {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  variant: 'default' | 'inline' | 'dark';
}

export function transformNewsletterSection(
  section: HomepageData['newsletterSection']
): NewsletterSectionProps {
  if (!section) {
    return {
      enabled: true,
      title: 'Stay Updated',
      subtitle: 'Join Our Newsletter',
      description: 'Get notified about new courses, special offers, and the latest in dental education.',
      variant: 'default',
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Stay Updated',
    subtitle: section.subtitle || 'Join Our Newsletter',
    description: section.description || 'Get notified about new courses, special offers, and the latest in dental education.',
    variant: section.variant || 'default',
  };
}

// ============================================
// SPONSORS TRANSFORMER
// ============================================

export interface SponsorCardProps {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
}

export function transformSponsors(sponsors: Sponsor[]): SponsorCardProps[] {
  return sponsors.map((sponsor) => ({
    id: String(sponsor.id),
    name: sponsor.name,
    logoUrl: getMediaUrl(sponsor.logo) || '/placeholder-logo.png',
    websiteUrl: sponsor.websiteUrl,
  }));
}

export function transformSponsorsSection(
  section: HomepageData['sponsorsSection']
): {
  enabled: boolean;
  title: string;
  showTitle: boolean;
} {
  if (!section) {
    return {
      enabled: true,
      title: 'Accreditation & Partners',
      showTitle: true,
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Accreditation & Partners',
    showTitle: section.showTitle,
  };
}

// ============================================
// CONTACT SECTION TRANSFORMER
// ============================================

export interface ContactSectionProps {
  enabled: boolean;
  title: string;
  subtitle: string;
  showMap: boolean;
  showContactForm: boolean;
}

export function transformContactSection(
  section: HomepageData['contactSection']
): ContactSectionProps {
  if (!section) {
    return {
      enabled: true,
      title: 'Visit Our Training Center',
      subtitle: 'Get In Touch',
      showMap: true,
      showContactForm: false,
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Visit Our Training Center',
    subtitle: section.subtitle || 'Get In Touch',
    showMap: section.showMap,
    showContactForm: section.showContactForm,
  };
}

// ============================================
// CALENDAR SECTION TRANSFORMER
// ============================================

export function transformCalendarSection(
  section: HomepageData['calendarSection']
): {
  enabled: boolean;
  title: string;
  subtitle: string;
} {
  if (!section) {
    return {
      enabled: true,
      title: 'Course Calendar',
      subtitle: 'Plan Ahead',
    };
  }

  return {
    enabled: section.enabled,
    title: section.title || 'Course Calendar',
    subtitle: section.subtitle || 'Plan Ahead',
  };
}

// ============================================
// SEO TRANSFORMER
// ============================================

export interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function transformSEO(
  seo: HomepageData['seo'],
  defaults: { title: string; description: string }
): SEOProps {
  return {
    title: seo?.metaTitle || defaults.title,
    description: seo?.metaDescription || defaults.description,
    ogImage: getMediaUrl(seo?.ogImage) || undefined,
    noIndex: false,
  };
}
