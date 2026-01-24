/**
 * Strapi Module
 * Export all Strapi utilities and functions
 */

// Client functions
export {
  getHomepage,
  getSiteSettings,
  getEvents,
  getEventBySlug,
  getUpcomingEventsFromStrapi,
  getSpeakers,
  getSpeakerBySlug,
  getTestimonials,
  getSponsors,
  getSeminars,
  getSeminarBySlug,
  getHeroSlides,
  getPages,
  getPageBySlug,
  getSiteFeatures,
  getEventCategories,
  getMediaUrl,
  getMediaUrls,
  STRAPI_URL,
} from './client';

// Types
export type {
  HomepageData,
  SiteSettings,
  Event,
  Speaker,
  Testimonial,
  Sponsor,
  Seminar,
  HeroSlide,
  Page,
  SiteFeature,
  EventCategory,
} from './client';

// Transformers
export {
  transformHeroSlides,
  transformStats,
  transformCoursesSectionConfig,
  transformEvents,
  transformWhyChooseSection,
  transformCTABanner,
  transformSpeakers,
  transformSpeakersSection,
  transformTestimonials,
  transformTestimonialsSection,
  transformNewsletterSection,
  transformSponsors,
  transformSponsorsSection,
  transformContactSection,
  transformCalendarSection,
  transformSEO,
} from './transformers';

// Transformer types
export type {
  HeroSlideProps,
  StatProps,
  CourseCardProps,
  FeatureProps,
  CTABannerProps,
  SpeakerCardProps,
  TestimonialCardProps,
  NewsletterSectionProps,
  SponsorCardProps,
  ContactSectionProps,
  SEOProps,
} from './transformers';

// Homepage Data Loader
export { loadHomepageData } from './homepage-loader';
export type { HomepageLoaderResult } from './homepage-loader';
