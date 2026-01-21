/**
 * Homepage Data Loader
 * Loads homepage data from Strapi with fallback to static defaults
 */

import {
  getHomepage,
  getSiteSettings,
  getUpcomingEventsFromStrapi,
  getSpeakers,
  getTestimonials,
  getSponsors,
} from './client';

import {
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
  type HeroSlideProps,
  type CourseCardProps,
  type SpeakerCardProps,
  type TestimonialCardProps,
  type SponsorCardProps,
} from './transformers';

// ============================================
// DEFAULT DATA (Used when Strapi is unavailable)
// ============================================

const defaultHeroSlides: HeroSlideProps[] = [
  {
    id: '1',
    title: 'Comprehensive PRF Protocols',
    subtitle: 'With Dr. Joseph Choukroun',
    description: 'Master advanced platelet-rich fibrin techniques with hands-on training from the inventor of PRF technology.',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&h=900&fit=crop',
    ctaText: 'Register Now',
    ctaLink: '/courses/comprehensive-prf-protocols-handling-clinical-integration',
    ceCredits: 15,
  },
  {
    id: '2',
    title: 'Implant Surgery Fundamentals',
    subtitle: 'Hands-On Training',
    description: 'A comprehensive introduction to dental implant surgery for general dentists looking to expand their practice.',
    imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1600&h=900&fit=crop',
    ctaText: 'Learn More',
    ctaLink: '/courses/implant-surgery-fundamentals',
    ceCredits: 12,
  },
  {
    id: '3',
    title: 'GPS Monthly Seminars',
    subtitle: '2025 Program Now Open',
    description: 'Join our 10-session cycle of literature review, case discussions, and treatment planning seminars.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop',
    ctaText: 'Enroll Today',
    ctaLink: '/monthly-seminars/gps-monthly-seminars-2025',
    ceCredits: 20,
  },
];

const defaultSpeakers: SpeakerCardProps[] = [
  {
    id: '1',
    name: "Dr. Joseph Choukroun",
    title: "MD, PhD",
    specialty: "PRF & Regenerative Medicine",
    bio: "Inventor of PRF protocols, world-renowned researcher in platelet concentrates and tissue regeneration.",
    slug: "dr-joseph-choukroun"
  },
  {
    id: '2',
    name: "Dr. Carlos Castro",
    title: "DDS, Prosthodontist",
    specialty: "Implant Prosthodontics",
    bio: "Director of GPS Dental Training, specialist in complex implant rehabilitation and digital dentistry.",
    slug: "dr-carlos-castro"
  },
  {
    id: '3',
    name: "Dr. Maurice Salama",
    title: "DMD",
    specialty: "Periodontics & Implant Dentistry",
    bio: "Internationally recognized lecturer and pioneer in implant esthetics and soft tissue management.",
    slug: "dr-maurice-salama"
  },
  {
    id: '4',
    name: "Dr. Rodrigo Neiva",
    title: "DDS, MS",
    specialty: "Periodontics",
    bio: "Expert in guided bone regeneration, minimally invasive surgery, and dental implant therapy.",
    slug: "dr-rodrigo-neiva"
  }
];

const defaultTestimonials: TestimonialCardProps[] = [
  {
    id: '1',
    quote: "The PRF course completely transformed my practice. Dr. Choukroun's hands-on approach and the detailed protocols have allowed me to offer advanced regenerative procedures with confidence.",
    author: "Dr. Sarah Mitchell",
    title: "DDS, Periodontist",
    location: "Atlanta, GA",
    rating: 5
  },
  {
    id: '2',
    quote: "GPS Monthly Seminars have been invaluable for my continuing education. The case discussions and literature reviews keep me at the forefront of implant dentistry.",
    author: "Dr. Michael Rodriguez",
    title: "DMD, Prosthodontist",
    location: "Miami, FL",
    rating: 5
  },
  {
    id: '3',
    quote: "The level of expertise and the quality of hands-on training at GPS is unmatched. I've attended courses worldwide, and GPS consistently delivers exceptional education.",
    author: "Dr. Jennifer Park",
    title: "DDS, Oral Surgeon",
    location: "Houston, TX",
    rating: 5
  }
];

const defaultSponsors: SponsorCardProps[] = [
  {
    id: 'pace',
    name: 'PACE',
    logoUrl: 'https://via.placeholder.com/200x80/173D84/ffffff?text=PACE',
    websiteUrl: 'https://www.agd.org/pace',
  },
  {
    id: 'nobel',
    name: 'Nobel Biocare',
    logoUrl: 'https://via.placeholder.com/200x80/0C2044/ffffff?text=Nobel+Biocare',
    websiteUrl: 'https://www.nobelbiocare.com',
  },
  {
    id: 'biohorizons',
    name: 'BioHorizons',
    logoUrl: 'https://via.placeholder.com/200x80/173D84/ffffff?text=BioHorizons',
    websiteUrl: 'https://www.biohorizons.com',
  },
  {
    id: 'straumann',
    name: 'Straumann',
    logoUrl: 'https://via.placeholder.com/200x80/0C2044/ffffff?text=Straumann',
    websiteUrl: 'https://www.straumann.com',
  },
  {
    id: 'zimmer',
    name: 'Zimmer Biomet',
    logoUrl: 'https://via.placeholder.com/200x80/173D84/ffffff?text=Zimmer+Biomet',
    websiteUrl: 'https://www.zimmerbiomet.com',
  },
];

// ============================================
// HOMEPAGE DATA LOADER
// ============================================

export interface HomepageLoaderResult {
  seo: {
    title: string;
    description: string;
    ogImage?: string;
  };
  heroSlides: HeroSlideProps[];
  statsSection: {
    enabled: boolean;
    variant: 'overlay' | 'cards' | 'default';
    stats: Array<{ value: number; suffix?: string; label: string }>;
  };
  coursesSection: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    autoplay: boolean;
    autoplaySpeed: number;
    slidesToShow: number;
    courses: CourseCardProps[];
  };
  whyChooseSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    features: Array<{ id: string; title: string; description: string }>;
  };
  ctaBanner: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    variant: 'default' | 'gold' | 'dark' | 'darkest';
  };
  speakersSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    speakers: SpeakerCardProps[];
  };
  calendarSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
  };
  testimonialsSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    showRatings: boolean;
    autoplay: boolean;
    testimonials: TestimonialCardProps[];
  };
  newsletterSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    variant: 'default' | 'inline' | 'dark';
  };
  sponsorsSection: {
    enabled: boolean;
    title: string;
    showTitle: boolean;
    sponsors: SponsorCardProps[];
  };
  contactSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    showMap: boolean;
    showContactForm: boolean;
  };
  dataSource: 'strapi' | 'static';
}

/**
 * Load all homepage data from Strapi with fallback to static defaults
 */
export async function loadHomepageData(): Promise<HomepageLoaderResult> {
  let dataSource: 'strapi' | 'static' = 'static';

  // Try to load from Strapi
  const homepageData = await getHomepage();

  if (homepageData) {
    dataSource = 'strapi';

    // Load related data
    const [events, speakers, testimonials, sponsors] = await Promise.all([
      getUpcomingEventsFromStrapi(homepageData.coursesSection?.maxCourses || 6),
      getSpeakers({ featured: true }),
      getTestimonials({ featured: true }),
      getSponsors(),
    ]);

    const heroSlides = transformHeroSlides(homepageData.heroSlides);
    const statsConfig = transformStats(homepageData.statsSection);
    const coursesConfig = transformCoursesSectionConfig(homepageData.coursesSection);
    const whyChooseConfig = transformWhyChooseSection(homepageData.whyChooseSection);
    const ctaBannerConfig = transformCTABanner(homepageData.ctaBanner);
    const speakersSectionConfig = transformSpeakersSection(homepageData.speakersSection);
    const calendarConfig = transformCalendarSection(homepageData.calendarSection);
    const testimonialsConfig = transformTestimonialsSection(homepageData.testimonialsSection);
    const newsletterConfig = transformNewsletterSection(homepageData.newsletterSection);
    const sponsorsConfig = transformSponsorsSection(homepageData.sponsorsSection);
    const contactConfig = transformContactSection(homepageData.contactSection);
    const seoConfig = transformSEO(homepageData.seo, {
      title: 'GPS Dental Training - Advanced Continuing Education for Dental Professionals',
      description: 'GPS Dental Training provides world-class continuing education courses for dental professionals. Earn CE credits with hands-on training from industry leaders.',
    });

    return {
      seo: seoConfig,
      heroSlides: heroSlides.length > 0 ? heroSlides : defaultHeroSlides,
      statsSection: statsConfig,
      coursesSection: {
        ...coursesConfig,
        courses: transformEvents(events),
      },
      whyChooseSection: whyChooseConfig,
      ctaBanner: ctaBannerConfig,
      speakersSection: {
        ...speakersSectionConfig,
        speakers: speakers.length > 0 ? transformSpeakers(speakers) : defaultSpeakers,
      },
      calendarSection: calendarConfig,
      testimonialsSection: {
        ...testimonialsConfig,
        testimonials: testimonials.length > 0 ? transformTestimonials(testimonials) : defaultTestimonials,
      },
      newsletterSection: newsletterConfig,
      sponsorsSection: {
        ...sponsorsConfig,
        sponsors: sponsors.length > 0 ? transformSponsors(sponsors) : defaultSponsors,
      },
      contactSection: contactConfig,
      dataSource,
    };
  }

  // Return static defaults if Strapi is unavailable
  return {
    seo: {
      title: 'GPS Dental Training - Advanced Continuing Education for Dental Professionals',
      description: 'GPS Dental Training provides world-class continuing education courses for dental professionals. Earn CE credits with hands-on training from industry leaders.',
    },
    heroSlides: defaultHeroSlides,
    statsSection: {
      enabled: true,
      variant: 'overlay',
      stats: [
        { value: 5000, suffix: '+', label: 'Dental Professionals Trained' },
        { value: 150, suffix: '+', label: 'Courses Delivered' },
        { value: 98, suffix: '%', label: 'Satisfaction Rate' },
        { value: 15, suffix: '+', label: 'Years of Excellence' },
      ],
    },
    coursesSection: {
      enabled: true,
      title: 'Upcoming Courses',
      subtitle: "Don't Miss Out",
      autoplay: true,
      autoplaySpeed: 5000,
      slidesToShow: 3,
      courses: [], // Will be loaded from Supabase in the page
    },
    whyChooseSection: {
      enabled: true,
      title: 'Why Choose GPS Dental Training?',
      subtitle: 'Excellence in Education',
      features: [], // Uses component defaults
    },
    ctaBanner: {
      enabled: true,
      title: 'GPS Monthly Seminars 2025',
      subtitle: '10-Session Program',
      description: 'Join our collaborative learning environment with monthly sessions covering literature review, case presentations, and treatment planning. Earn up to 20 CE credits.',
      ctaText: 'Learn More & Enroll',
      ctaLink: '/monthly-seminars/gps-monthly-seminars-2025',
      variant: 'gold',
    },
    speakersSection: {
      enabled: true,
      title: 'Learn from World-Class Experts',
      subtitle: 'Our Faculty',
      speakers: defaultSpeakers,
    },
    calendarSection: {
      enabled: true,
      title: 'Course Calendar',
      subtitle: 'Plan Ahead',
    },
    testimonialsSection: {
      enabled: true,
      title: 'What Our Students Say',
      subtitle: 'Success Stories',
      showRatings: true,
      autoplay: true,
      testimonials: defaultTestimonials,
    },
    newsletterSection: {
      enabled: true,
      title: 'Stay Updated',
      subtitle: 'Join Our Newsletter',
      description: 'Get notified about new courses, special offers, and the latest in dental education. Join thousands of dental professionals who trust GPS.',
      variant: 'default',
    },
    sponsorsSection: {
      enabled: true,
      title: 'Accreditation & Partners',
      showTitle: true,
      sponsors: defaultSponsors,
    },
    contactSection: {
      enabled: true,
      title: 'Visit Our Training Center',
      subtitle: 'Get In Touch',
      showMap: true,
      showContactForm: false,
    },
    dataSource,
  };
}
