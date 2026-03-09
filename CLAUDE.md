# GPS Headless - Project Documentation

## Project Overview

**Project Name:** GPS Dental Training - Headless Frontend
**Framework:** Astro with React components
**Backend:** Supabase
**Client:** GPS Dental Training (https://gpsdentaltraining.com)

## Supabase Configuration

- **Project ID:** `mstvdmedcwibnhsymljd`
- **Project URL:** `https://mstvdmedcwibnhsymljd.supabase.co`
- **Associated Account:** juliocastro@thewebminds.agency
- **Dashboard:** https://supabase.com/dashboard/project/mstvdmedcwibnhsymljd

## Key Features

- Course and event management
- Monthly seminars with session tracking
- Ticket sales with QR code generation
- Attendance check-in (QR scan and manual)
- CE credits management
- Certificate generation (PDF)
- Template system (Modern/Classic) for courses and seminars

## Template System

Both courses and seminars support two layout templates:
- `modern` (default) - Full-width hero, card-based sections, sticky sidebar
- `classic` - More traditional WordPress-style layout

Templates are selected via the `layout_template` column in the `events` and `seminars` tables.

## Directory Structure

```
src/
├── components/
│   ├── templates/
│   │   ├── courses/
│   │   │   ├── ModernCourseDetail.astro
│   │   │   └── ClassicCourseDetail.astro
│   │   └── seminars/
│   │       ├── ModernSeminarDetail.astro
│   │       └── ClassicSeminarDetail.astro
│   ├── layout/
│   ├── events/
│   ├── tickets/
│   └── certificates/
├── pages/
│   ├── courses/
│   │   ├── index.astro
│   │   └── [slug].astro (template router)
│   ├── monthly-seminars/
│   │   ├── index.astro
│   │   └── [slug].astro (template router)
│   ├── admin/
│   └── api/
├── lib/
│   ├── supabase/
│   ├── certificates/
│   ├── qrcode/
│   └── email/
└── layouts/
```

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `QR_CODE_SECRET`

## Development

```bash
npm install
npm run dev    # Starts on localhost:4321
npm run build  # Production build
```

## Support

**Developer:** WebMinds Agency
**Email:** juliocastro@thewebminds.agency
