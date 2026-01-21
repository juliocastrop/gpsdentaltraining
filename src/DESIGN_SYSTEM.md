# GPS Dental Training - Design System

This document defines the unified design system for all pages in the GPS Dental Training headless application.

## Brand Colors

```css
/* Primary Navy Palette */
--gps-navy-darkest: #0C2044;  /* Darkest, used in gradients */
--gps-navy-dark: #13326A;      /* Dark navy, primary text/headers */
--gps-navy: #173D84;           /* Primary navy */
--gps-navy-medium: #0B52AC;    /* Medium blue, CTA buttons */
--gps-blue: #26ACF5;           /* Light blue accent */

/* Gold Accent */
--gps-gold: #DDC89D;           /* Primary gold, highlights */
--gps-gold-dark: #BFAC87;      /* Dark gold, hover states */

/* Neutrals */
--gps-bg: #F8F9FA;             /* Light gray background */
--gps-white: #FFFFFF;
--gps-text: #4E6E82;           /* Body text */

/* Status Colors */
--gps-success: #28A745;
--gps-warning: #FFC107;
--gps-danger: #DC3545;
```

## Typography

```css
/* Headings */
font-family: 'Montserrat', sans-serif;
font-weight: 700-800 (bold/extrabold);

/* Body */
font-family: 'Open Sans', sans-serif;
font-weight: 400-600;

/* Size Scale */
text-xs: 13px;
text-sm: 14px;
text-base: 16px;
text-lg: 18px;
text-xl: 24px;
text-2xl: 32px;
text-3xl: 42px;
```

---

## Layouts

### PageLayout

Use `PageLayout.astro` for all internal pages (About, Seminars, Speakers, Calendar, Contact).

```astro
---
import PageLayout from '../layouts/PageLayout.astro';
---

<PageLayout
  title="Page Title"
  description="Meta description for SEO"
  breadcrumbs={[{ label: 'Page Name' }]}
  heroTitle="Main Heading"
  heroTitleAccent="Accent Text in Gold"
  heroDescription="Subtitle or description text"
  heroBadge={{ icon: 'building', text: 'Badge Text' }}
  heroImage="/images/hero.jpg"  <!-- Optional: uses gradient if not provided -->
  heroStats={[
    { value: '15+', label: 'Years' },
    { value: '1,000+', label: 'Students', accent: true },
  ]}
>
  <!-- Page content goes here -->
</PageLayout>
```

**Available badge icons:** `building`, `calendar`, `users`, `certificate`, `phone`, `star`

---

## Components

### Section

Wrapper for page sections with consistent padding and backgrounds.

```astro
import Section from '../components/ui/Section.astro';

<Section bg="white" padding="lg">
  <!-- Section content -->
</Section>
```

**Props:**
- `bg`: `'white'` | `'gray'` | `'navy'` | `'gradient'`
- `padding`: `'sm'` | `'md'` | `'lg'` | `'xl'`
- `id`: Anchor ID for navigation
- `borderTop`: Boolean for top border

### SectionHeader

Consistent section titles with badge, heading, and description.

```astro
import SectionHeader from '../components/ui/SectionHeader.astro';

<SectionHeader
  badge="Our Team"
  title="Meet the Experts"
  description="Our instructors are internationally recognized..."
  align="center"
  dark={false}
/>
```

### Card

Flexible card component with multiple variants.

```astro
import Card from '../components/ui/Card.astro';

<Card variant="white" hover padding="md">
  <!-- Card content -->
</Card>
```

**Variants:**
- `white`: White background with shadow
- `gray`: Light gray background
- `navy`: Navy gradient background
- `outline`: White with border (hover: gold border)

### Badge

Small label/pill component.

```astro
import Badge from '../components/ui/Badge.astro';

<Badge variant="gold" size="md">15 CE Credits</Badge>
```

**Variants:** `gold`, `navy`, `white`, `outline`, `success`, `warning`, `danger`
**Sizes:** `sm`, `md`, `lg`

### IconBox

Styled container for icons in feature cards.

```astro
import IconBox from '../components/ui/IconBox.astro';

<IconBox variant="gold" size="lg">
  <svg>...</svg>
</IconBox>
```

**Variants:** `gold`, `navy`, `white`, `gray`
**Sizes:** `sm`, `md`, `lg`, `xl`

### CTASection

Call-to-action section with gradient background.

```astro
import CTASection from '../components/ui/CTASection.astro';

<CTASection
  title="Ready to Advance Your Skills?"
  description="Join our community..."
  primaryAction={{ label: "Explore Courses", href: "/courses" }}
  secondaryAction={{ label: "Monthly Seminars", href: "/monthly-seminars" }}
  tertiaryAction={{ label: "Contact Us", href: "/contact" }}
/>
```

### Button (React)

For interactive buttons in React islands.

```tsx
import Button from '../components/ui/Button';

<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

**Variants:** `primary`, `secondary`, `gold`, `outline`, `ghost`
**Sizes:** `sm`, `md`, `lg`

---

## Page Structure Pattern

Every internal page should follow this structure:

```astro
<PageLayout ...props>
  <!-- Section 1: Main content (white bg) -->
  <Section bg="white" padding="lg">
    <SectionHeader badge="..." title="..." />
    <div class="max-w-6xl mx-auto">
      <!-- Content grid/cards -->
    </div>
  </Section>

  <!-- Section 2: Alternating bg (gray) -->
  <Section bg="gray" padding="lg">
    <SectionHeader badge="..." title="..." />
    <!-- Content -->
  </Section>

  <!-- Continue alternating white/gray -->

  <!-- Final CTA Section -->
  <CTASection
    title="..."
    description="..."
    primaryAction={{ label: "...", href: "..." }}
  />
</PageLayout>
```

---

## Grid Patterns

### 3-Column Grid (Features, Team Cards)
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
```

### 2-Column Grid (Mission/Vision)
```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
```

### 4-Column Grid (Stats)
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
```

---

## Standard Classes

### Container
```html
<div class="container mx-auto px-4 lg:px-8 max-w-7xl">
```

### Section Padding
- Small: `py-8 lg:py-12`
- Medium: `py-12 lg:py-16`
- Large: `py-16 lg:py-20`
- XL: `py-20 lg:py-28`

### Text Colors
- Headings: `text-[#13326A]`
- Body: `text-[#4E6E82]`
- Light (on dark): `text-white/80`, `text-white/60`
- Accent: `text-[#DDC89D]`

### Hover Effects
- Cards: `hover:shadow-xl transition-all duration-300`
- Links: `hover:text-[#0B52AC] transition-colors`
- Icons: `group-hover:scale-110 transition-transform`

---

## Creating a New Page

1. Import PageLayout and components:
```astro
---
import PageLayout from '../layouts/PageLayout.astro';
import Section from '../components/ui/Section.astro';
import SectionHeader from '../components/ui/SectionHeader.astro';
import Card from '../components/ui/Card.astro';
import CTASection from '../components/ui/CTASection.astro';
---
```

2. Use PageLayout as the wrapper
3. Organize content in Section components
4. Use SectionHeader for titles
5. Use Card for content blocks
6. End with CTASection
7. Alternate white/gray backgrounds

This ensures visual consistency across all pages.
