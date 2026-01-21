# Strapi Content Types - GPS Dental Training

## Arquitectura para Homepage 100% Dinámico

Este documento define todos los content types necesarios en Strapi para hacer el homepage completamente administrable.

---

## Single Types (Páginas Únicas)

### 1. Homepage (`homepage`)

```json
{
  "kind": "singleType",
  "collectionName": "homepage",
  "attributes": {
    "seo": {
      "type": "component",
      "component": "shared.seo"
    },
    "heroSlides": {
      "type": "component",
      "component": "homepage.hero-slide",
      "repeatable": true
    },
    "statsSection": {
      "type": "component",
      "component": "homepage.stats-section"
    },
    "coursesSection": {
      "type": "component",
      "component": "homepage.courses-section"
    },
    "whyChooseSection": {
      "type": "component",
      "component": "homepage.why-choose-section"
    },
    "ctaBanner": {
      "type": "component",
      "component": "homepage.cta-banner"
    },
    "speakersSection": {
      "type": "component",
      "component": "homepage.section-header"
    },
    "featuredSpeakers": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::speaker.speaker"
    },
    "calendarSection": {
      "type": "component",
      "component": "homepage.section-header"
    },
    "testimonialsSection": {
      "type": "component",
      "component": "homepage.testimonials-section"
    },
    "newsletterSection": {
      "type": "component",
      "component": "homepage.newsletter-section"
    },
    "sponsorsSection": {
      "type": "component",
      "component": "homepage.sponsors-section"
    },
    "contactSection": {
      "type": "component",
      "component": "homepage.contact-section"
    }
  }
}
```

### 2. Site Settings (`site-settings`)

**Note:** For SVG logo support, configure Strapi's upload plugin to allow `image/svg+xml` MIME type.

```json
{
  "kind": "singleType",
  "collectionName": "site_settings",
  "attributes": {
    "siteName": { "type": "string", "required": true },
    "siteDescription": { "type": "text" },
    "logo": {
      "type": "media",
      "allowedTypes": ["images", "files"],
      "description": "Main logo (supports PNG, JPG, SVG)"
    },
    "logoWhite": {
      "type": "media",
      "allowedTypes": ["images", "files"],
      "description": "White/light version for dark backgrounds (supports SVG)"
    },
    "logoMobile": {
      "type": "media",
      "allowedTypes": ["images", "files"],
      "description": "Optional smaller logo for mobile (supports SVG)"
    },
    "favicon": {
      "type": "media",
      "allowedTypes": ["images"],
      "description": "Site favicon (ICO, PNG, or SVG)"
    },
    "socialLinks": {
      "type": "component",
      "component": "shared.social-link",
      "repeatable": true
    },
    "contactInfo": {
      "type": "component",
      "component": "shared.contact-info"
    },
    "footerLinks": {
      "type": "component",
      "component": "shared.nav-link",
      "repeatable": true
    },
    "mainNavigation": {
      "type": "component",
      "component": "shared.nav-link",
      "repeatable": true
    }
  }
}
```

---

## Collection Types

### 3. Event (`event`)

```json
{
  "kind": "collectionType",
  "collectionName": "events",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "description": { "type": "richtext" },
    "excerpt": { "type": "text" },
    "featuredImage": { "type": "media", "allowedTypes": ["images"] },
    "gallery": { "type": "media", "allowedTypes": ["images"], "multiple": true },
    "startDate": { "type": "datetime", "required": true },
    "endDate": { "type": "datetime" },
    "venue": { "type": "string" },
    "address": { "type": "text" },
    "ceCredits": { "type": "decimal" },
    "capacity": { "type": "integer" },
    "status": {
      "type": "enumeration",
      "enum": ["draft", "published", "cancelled"],
      "default": "draft"
    },
    "speakers": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::speaker.speaker"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::event-category.event-category"
    },
    "scheduleTopics": {
      "type": "component",
      "component": "event.schedule-topic",
      "repeatable": true
    },
    "learningObjectives": {
      "type": "component",
      "component": "event.learning-objective",
      "repeatable": true
    },
    "seo": {
      "type": "component",
      "component": "shared.seo"
    }
  }
}
```

### 4. Speaker (`speaker`)

```json
{
  "kind": "collectionType",
  "collectionName": "speakers",
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "title": { "type": "string" },
    "specialty": { "type": "string" },
    "bio": { "type": "richtext" },
    "shortBio": { "type": "text" },
    "photo": { "type": "media", "allowedTypes": ["images"] },
    "email": { "type": "email" },
    "socialLinks": {
      "type": "component",
      "component": "shared.social-link",
      "repeatable": true
    },
    "events": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::event.event",
      "inversedBy": "speakers"
    },
    "featured": { "type": "boolean", "default": false }
  }
}
```

### 5. Testimonial (`testimonial`)

```json
{
  "kind": "collectionType",
  "collectionName": "testimonials",
  "attributes": {
    "quote": { "type": "text", "required": true },
    "authorName": { "type": "string", "required": true },
    "authorTitle": { "type": "string" },
    "authorLocation": { "type": "string" },
    "authorPhoto": { "type": "media", "allowedTypes": ["images"] },
    "rating": { "type": "integer", "min": 1, "max": 5, "default": 5 },
    "event": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::event.event"
    },
    "featured": { "type": "boolean", "default": false },
    "publishedAt": { "type": "datetime" }
  }
}
```

### 6. Sponsor (`sponsor`)

```json
{
  "kind": "collectionType",
  "collectionName": "sponsors",
  "attributes": {
    "name": { "type": "string", "required": true },
    "logo": { "type": "media", "allowedTypes": ["images"], "required": true },
    "websiteUrl": { "type": "string" },
    "tier": {
      "type": "enumeration",
      "enum": ["platinum", "gold", "silver", "bronze", "partner"],
      "default": "partner"
    },
    "order": { "type": "integer", "default": 0 }
  }
}
```

### 7. Event Category (`event-category`)

```json
{
  "kind": "collectionType",
  "collectionName": "event_categories",
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "description": { "type": "text" },
    "color": { "type": "string" },
    "events": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::event.event",
      "mappedBy": "category"
    }
  }
}
```

### 8. Seminar (`seminar`)

```json
{
  "kind": "collectionType",
  "collectionName": "seminars",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "year": { "type": "integer", "required": true },
    "description": { "type": "richtext" },
    "featuredImage": { "type": "media", "allowedTypes": ["images"] },
    "price": { "type": "decimal", "default": 750 },
    "totalSessions": { "type": "integer", "default": 10 },
    "creditsPerSession": { "type": "decimal", "default": 2 },
    "moderator": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::speaker.speaker"
    },
    "sessions": {
      "type": "component",
      "component": "seminar.session",
      "repeatable": true
    },
    "status": {
      "type": "enumeration",
      "enum": ["upcoming", "active", "completed"],
      "default": "upcoming"
    }
  }
}
```

### 9. Page (`page`)

```json
{
  "kind": "collectionType",
  "collectionName": "pages",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "content": { "type": "richtext" },
    "featuredImage": { "type": "media", "allowedTypes": ["images"] },
    "template": {
      "type": "enumeration",
      "enum": ["default", "full-width", "sidebar", "landing"],
      "default": "default"
    },
    "seo": {
      "type": "component",
      "component": "shared.seo"
    },
    "sections": {
      "type": "dynamiczone",
      "components": [
        "sections.hero",
        "sections.text-block",
        "sections.image-text",
        "sections.gallery",
        "sections.cta",
        "sections.faq",
        "sections.team-grid",
        "sections.contact-form"
      ]
    }
  }
}
```

---

## Components

### Shared Components

#### `shared.seo`
```json
{
  "attributes": {
    "metaTitle": { "type": "string" },
    "metaDescription": { "type": "text" },
    "ogImage": { "type": "media", "allowedTypes": ["images"] },
    "noIndex": { "type": "boolean", "default": false }
  }
}
```

#### `shared.social-link`
```json
{
  "attributes": {
    "platform": {
      "type": "enumeration",
      "enum": ["facebook", "instagram", "linkedin", "twitter", "youtube", "vimeo"]
    },
    "url": { "type": "string", "required": true }
  }
}
```

#### `shared.nav-link`
```json
{
  "attributes": {
    "label": { "type": "string", "required": true },
    "url": { "type": "string", "required": true },
    "openInNewTab": { "type": "boolean", "default": false }
  }
}
```

#### `shared.contact-info`
```json
{
  "attributes": {
    "email": { "type": "email" },
    "phone": { "type": "string" },
    "address": { "type": "text" },
    "officeHours": { "type": "string" },
    "mapEmbedUrl": { "type": "text" }
  }
}
```

### Homepage Components

#### `homepage.hero-slide`
```json
{
  "attributes": {
    "title": { "type": "string", "required": true },
    "subtitle": { "type": "string" },
    "description": { "type": "text" },
    "backgroundImage": { "type": "media", "allowedTypes": ["images"], "required": true },
    "ctaText": { "type": "string" },
    "ctaLink": { "type": "string" },
    "ceCredits": { "type": "integer" },
    "order": { "type": "integer", "default": 0 }
  }
}
```

#### `homepage.stats-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "variant": {
      "type": "enumeration",
      "enum": ["overlay", "cards", "default"],
      "default": "overlay"
    },
    "stats": {
      "type": "component",
      "component": "homepage.stat-item",
      "repeatable": true
    }
  }
}
```

#### `homepage.stat-item`
```json
{
  "attributes": {
    "value": { "type": "integer", "required": true },
    "suffix": { "type": "string" },
    "label": { "type": "string", "required": true },
    "icon": { "type": "string" }
  }
}
```

#### `homepage.section-header`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string", "required": true },
    "subtitle": { "type": "string" },
    "description": { "type": "text" }
  }
}
```

#### `homepage.courses-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string", "default": "Upcoming Courses" },
    "subtitle": { "type": "string", "default": "Don't Miss Out" },
    "autoplay": { "type": "boolean", "default": true },
    "autoplaySpeed": { "type": "integer", "default": 5000 },
    "slidesToShow": { "type": "integer", "default": 3, "min": 1, "max": 4 },
    "showAllLink": { "type": "boolean", "default": true },
    "allCoursesLinkText": { "type": "string", "default": "View All Courses" },
    "featuredCourses": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::event.event"
    },
    "displayMode": {
      "type": "enumeration",
      "enum": ["featured", "upcoming", "all"],
      "default": "upcoming",
      "description": "featured: show only selected courses, upcoming: auto-fetch next courses, all: show all published"
    },
    "maxCourses": { "type": "integer", "default": 6, "min": 3, "max": 12 }
  }
}
```

#### `homepage.why-choose-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string" },
    "subtitle": { "type": "string" },
    "features": {
      "type": "component",
      "component": "homepage.feature-item",
      "repeatable": true
    }
  }
}
```

#### `homepage.feature-item`
```json
{
  "attributes": {
    "title": { "type": "string", "required": true },
    "description": { "type": "text", "required": true },
    "icon": { "type": "string" }
  }
}
```

#### `homepage.cta-banner`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string", "required": true },
    "subtitle": { "type": "string" },
    "description": { "type": "text" },
    "ctaText": { "type": "string" },
    "ctaLink": { "type": "string" },
    "variant": {
      "type": "enumeration",
      "enum": ["default", "gold", "dark", "darkest"],
      "default": "default"
    },
    "backgroundImage": { "type": "media", "allowedTypes": ["images"] }
  }
}
```

#### `homepage.testimonials-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string" },
    "subtitle": { "type": "string" },
    "showRatings": { "type": "boolean", "default": true },
    "autoplay": { "type": "boolean", "default": true },
    "testimonials": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::testimonial.testimonial"
    }
  }
}
```

#### `homepage.newsletter-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string" },
    "subtitle": { "type": "string" },
    "description": { "type": "text" },
    "variant": {
      "type": "enumeration",
      "enum": ["default", "inline", "dark"],
      "default": "default"
    }
  }
}
```

#### `homepage.sponsors-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string" },
    "showTitle": { "type": "boolean", "default": true },
    "sponsors": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::sponsor.sponsor"
    }
  }
}
```

#### `homepage.contact-section`
```json
{
  "attributes": {
    "enabled": { "type": "boolean", "default": true },
    "title": { "type": "string" },
    "subtitle": { "type": "string" },
    "showMap": { "type": "boolean", "default": true },
    "showContactForm": { "type": "boolean", "default": false }
  }
}
```

### Event Components

#### `event.schedule-topic`
```json
{
  "attributes": {
    "day": { "type": "integer", "default": 1 },
    "time": { "type": "string" },
    "title": { "type": "string", "required": true },
    "description": { "type": "text" },
    "speaker": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::speaker.speaker"
    }
  }
}
```

#### `event.learning-objective`
```json
{
  "attributes": {
    "objective": { "type": "text", "required": true }
  }
}
```

### Seminar Components

#### `seminar.session`
```json
{
  "attributes": {
    "sessionNumber": { "type": "integer", "required": true },
    "date": { "type": "date", "required": true },
    "startTime": { "type": "time" },
    "endTime": { "type": "time" },
    "topic": { "type": "string" },
    "description": { "type": "text" }
  }
}
```

### Dynamic Zone Sections (for flexible pages)

#### `sections.hero`
```json
{
  "attributes": {
    "title": { "type": "string", "required": true },
    "subtitle": { "type": "string" },
    "backgroundImage": { "type": "media", "allowedTypes": ["images"] },
    "ctaText": { "type": "string" },
    "ctaLink": { "type": "string" }
  }
}
```

#### `sections.text-block`
```json
{
  "attributes": {
    "content": { "type": "richtext", "required": true },
    "alignment": {
      "type": "enumeration",
      "enum": ["left", "center", "right"],
      "default": "left"
    }
  }
}
```

#### `sections.image-text`
```json
{
  "attributes": {
    "image": { "type": "media", "allowedTypes": ["images"], "required": true },
    "title": { "type": "string" },
    "content": { "type": "richtext" },
    "imagePosition": {
      "type": "enumeration",
      "enum": ["left", "right"],
      "default": "left"
    },
    "ctaText": { "type": "string" },
    "ctaLink": { "type": "string" }
  }
}
```

#### `sections.gallery`
```json
{
  "attributes": {
    "title": { "type": "string" },
    "images": { "type": "media", "allowedTypes": ["images"], "multiple": true },
    "columns": { "type": "integer", "default": 3, "min": 2, "max": 4 }
  }
}
```

#### `sections.cta`
```json
{
  "attributes": {
    "title": { "type": "string", "required": true },
    "description": { "type": "text" },
    "ctaText": { "type": "string" },
    "ctaLink": { "type": "string" },
    "variant": {
      "type": "enumeration",
      "enum": ["default", "gold", "dark"],
      "default": "default"
    }
  }
}
```

#### `sections.faq`
```json
{
  "attributes": {
    "title": { "type": "string" },
    "items": {
      "type": "component",
      "component": "sections.faq-item",
      "repeatable": true
    }
  }
}
```

#### `sections.faq-item`
```json
{
  "attributes": {
    "question": { "type": "string", "required": true },
    "answer": { "type": "richtext", "required": true }
  }
}
```

---

## API Endpoints (Auto-generated by Strapi)

### Single Types
- `GET /api/homepage?populate=deep` - Get homepage with all relations
- `GET /api/site-settings?populate=deep` - Get site settings

### Collection Types
- `GET /api/events?populate=*` - List all events
- `GET /api/events/:id?populate=deep` - Get single event
- `GET /api/events?filters[slug][$eq]=:slug` - Get event by slug
- `GET /api/speakers?populate=*` - List all speakers
- `GET /api/testimonials?filters[featured][$eq]=true` - Get featured testimonials
- `GET /api/sponsors?sort=order:asc` - Get sponsors sorted
- `GET /api/seminars?filters[status][$eq]=active` - Get active seminars

---

## Strapi Plugins Recomendados

1. **@strapi/plugin-seo** - SEO management
2. **strapi-plugin-populate-deep** - Deep population of relations
3. **@strapi/plugin-upload** - Media management (included)
4. **strapi-plugin-slugify** - Auto-generate slugs

---

## Environment Variables (Strapi)

```env
# .env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database (PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_HOST=your-supabase-host
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_SSL=true

# Cloudinary (for media)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret
```

---

## Webhooks Configuration

Configure webhooks in Strapi to trigger Astro rebuilds:

1. **On Publish/Update Homepage** → Trigger Vercel deploy hook
2. **On Publish/Update Event** → Trigger Vercel deploy hook
3. **On Publish/Update Speaker** → Trigger Vercel deploy hook

```
Webhook URL: https://api.vercel.com/v1/integrations/deploy/your-deploy-hook
```

---

## SVG Logo Support Configuration

To enable SVG uploads in Strapi, update the `config/plugins.js` file:

```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024, // 5MB
      mimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml', // Enable SVG
        'image/x-icon',
        'image/vnd.microsoft.icon',
      ],
    },
  },
});
```

---

## Admin Dashboard Architecture

### Overview

The Admin Dashboard provides a complete backend for managing courses, tickets, attendance, certificates, and more. It's split between:

1. **Strapi CMS** - Content management (events, speakers, pages, homepage)
2. **Custom Admin Dashboard** - Business logic (tickets, orders, attendance, credits)

### Custom Admin Pages (Astro + React)

```
src/pages/admin/
├── index.astro                    # Dashboard home with stats
├── events/
│   ├── index.astro               # List all events with filters
│   ├── [id].astro                # Event details/edit
│   └── create.astro              # Create new event
├── tickets/
│   ├── index.astro               # All ticket types
│   ├── [eventId].astro           # Tickets for specific event
│   └── create.astro              # Create ticket type
├── orders/
│   ├── index.astro               # All orders with search/filter
│   └── [id].astro                # Order details
├── attendance/
│   ├── index.astro               # QR Scanner + manual check-in
│   ├── [eventId].astro           # Attendance list for event
│   └── report.astro              # Attendance reports
├── certificates/
│   ├── index.astro               # Certificate management
│   ├── generate.astro            # Bulk generate certificates
│   └── templates.astro           # Certificate templates
├── credits/
│   ├── index.astro               # CE Credits overview
│   ├── ledger.astro              # Full credit ledger
│   └── award.astro               # Manual credit award
├── waitlist/
│   ├── index.astro               # Waitlist management
│   └── [eventId].astro           # Event-specific waitlist
├── seminars/
│   ├── index.astro               # Seminar management
│   ├── [id].astro                # Seminar details
│   ├── sessions.astro            # Session management
│   └── registrations.astro       # Seminar registrations
├── users/
│   ├── index.astro               # User management
│   └── [id].astro                # User details + history
├── reports/
│   ├── index.astro               # Reports dashboard
│   ├── sales.astro               # Sales reports
│   ├── attendance.astro          # Attendance reports
│   └── credits.astro             # CE Credits reports
└── settings/
    ├── index.astro               # Admin settings
    ├── email.astro               # Email templates
    └── integrations.astro        # Third-party integrations
```

### Admin API Endpoints

```
# Events Management
GET    /api/admin/events                    # List events with pagination
POST   /api/admin/events                    # Create event (syncs with Strapi)
PUT    /api/admin/events/[id]               # Update event
DELETE /api/admin/events/[id]               # Delete event

# Ticket Types
GET    /api/admin/tickets                   # All ticket types
GET    /api/admin/tickets/event/[id]        # Tickets for event
POST   /api/admin/tickets                   # Create ticket type
PUT    /api/admin/tickets/[id]              # Update ticket
DELETE /api/admin/tickets/[id]              # Delete ticket
POST   /api/admin/tickets/[id]/sold-out     # Toggle manual sold out

# Orders
GET    /api/admin/orders                    # List orders
GET    /api/admin/orders/[id]               # Order details
PUT    /api/admin/orders/[id]/status        # Update order status
POST   /api/admin/orders/[id]/refund        # Process refund

# Attendance
GET    /api/admin/attendance/event/[id]     # Get attendance for event
POST   /api/admin/attendance/check-in       # Check-in attendee
DELETE /api/admin/attendance/[id]           # Undo check-in

# Certificates
GET    /api/admin/certificates/event/[id]   # Certificates for event
POST   /api/admin/certificates/generate     # Generate certificate
POST   /api/admin/certificates/bulk         # Bulk generate
POST   /api/admin/certificates/send         # Send via email

# CE Credits
GET    /api/admin/credits                   # Credits overview
GET    /api/admin/credits/user/[id]         # User credit history
POST   /api/admin/credits/award             # Manual award
POST   /api/admin/credits/revoke            # Revoke credits

# Waitlist
GET    /api/admin/waitlist/event/[id]       # Waitlist for event
POST   /api/admin/waitlist/notify           # Notify next in line
DELETE /api/admin/waitlist/[id]             # Remove from waitlist

# Seminars
GET    /api/admin/seminars                  # List seminars
GET    /api/admin/seminars/[id]/sessions    # Sessions for seminar
GET    /api/admin/seminars/[id]/registrations # Registrations
POST   /api/admin/seminars/check-in         # Session check-in

# Reports
GET    /api/admin/reports/sales             # Sales data
GET    /api/admin/reports/attendance        # Attendance stats
GET    /api/admin/reports/credits           # Credits summary
GET    /api/admin/reports/export            # Export to CSV
```

### Admin React Components

```
src/components/admin/
├── layout/
│   ├── AdminLayout.tsx           # Admin page wrapper
│   ├── AdminSidebar.tsx          # Navigation sidebar
│   ├── AdminHeader.tsx           # Top bar with user info
│   └── AdminBreadcrumbs.tsx      # Breadcrumb navigation
├── dashboard/
│   ├── StatsCards.tsx            # Overview statistics
│   ├── RecentOrders.tsx          # Recent orders widget
│   ├── UpcomingEvents.tsx        # Upcoming events widget
│   └── QuickActions.tsx          # Quick action buttons
├── events/
│   ├── EventList.tsx             # Events data table
│   ├── EventForm.tsx             # Create/edit form
│   ├── EventCard.tsx             # Event summary card
│   └── EventFilters.tsx          # Filter controls
├── tickets/
│   ├── TicketTypeList.tsx        # Ticket types table
│   ├── TicketTypeForm.tsx        # Create/edit form
│   ├── TicketAvailability.tsx    # Stock indicator
│   └── SoldOutToggle.tsx         # Manual sold out switch
├── orders/
│   ├── OrderList.tsx             # Orders data table
│   ├── OrderDetails.tsx          # Order detail view
│   ├── OrderTimeline.tsx         # Order history
│   └── RefundModal.tsx           # Refund dialog
├── attendance/
│   ├── QRScanner.tsx             # Camera QR scanner
│   ├── ManualCheckIn.tsx         # Manual entry form
│   ├── AttendeeSearch.tsx        # Search attendees
│   ├── AttendanceList.tsx        # Attendance table
│   └── CheckInSuccess.tsx        # Success feedback
├── certificates/
│   ├── CertificateList.tsx       # Certificates table
│   ├── CertificatePreview.tsx    # PDF preview
│   ├── BulkGenerator.tsx         # Bulk generation
│   └── EmailSender.tsx           # Send certificates
├── credits/
│   ├── CreditLedger.tsx          # Credits table
│   ├── AwardCreditsForm.tsx      # Manual award form
│   └── CreditsSummary.tsx        # User credit summary
├── waitlist/
│   ├── WaitlistTable.tsx         # Waitlist management
│   ├── NotifyButton.tsx          # Notify action
│   └── WaitlistPosition.tsx      # Position indicator
├── seminars/
│   ├── SeminarList.tsx           # Seminars table
│   ├── SessionManager.tsx        # Manage sessions
│   ├── RegistrationList.tsx      # Registrations
│   └── SessionCheckIn.tsx        # Session attendance
├── users/
│   ├── UserList.tsx              # Users table
│   ├── UserProfile.tsx           # User details
│   └── UserHistory.tsx           # User activity
├── reports/
│   ├── SalesChart.tsx            # Sales visualization
│   ├── AttendanceChart.tsx       # Attendance trends
│   ├── ExportButton.tsx          # CSV export
│   └── DateRangePicker.tsx       # Date filter
└── shared/
    ├── DataTable.tsx             # Reusable data table
    ├── StatusBadge.tsx           # Status indicator
    ├── ConfirmDialog.tsx         # Confirmation modal
    ├── LoadingSpinner.tsx        # Loading state
    └── Pagination.tsx            # Table pagination
```

### Admin Authentication

Admin access is controlled through Clerk roles:

```typescript
// Middleware to protect admin routes
export async function adminMiddleware(request: Request) {
  const { userId } = await auth();
  if (!userId) return redirectToSignIn();

  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata.role;

  if (role !== 'admin' && role !== 'super_admin') {
    return new Response('Forbidden', { status: 403 });
  }

  return null; // Continue to route
}
```

### Role Permissions

| Feature | Admin | Super Admin |
|---------|-------|-------------|
| View events | ✅ | ✅ |
| Create/edit events | ✅ | ✅ |
| Delete events | ❌ | ✅ |
| Check-in attendees | ✅ | ✅ |
| Generate certificates | ✅ | ✅ |
| Award CE credits | ✅ | ✅ |
| Revoke CE credits | ❌ | ✅ |
| Process refunds | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| View reports | ✅ | ✅ |
| Export data | ✅ | ✅ |
| Admin settings | ❌ | ✅ |
