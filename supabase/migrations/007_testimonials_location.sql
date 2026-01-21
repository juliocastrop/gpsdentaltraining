-- Migration: Add author_location to testimonials
-- Allows storing the location/city of the testimonial author

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS author_location VARCHAR(255);

-- Update status enum to include 'published' for consistency with other tables
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_status_check;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_status_check
  CHECK (status IN ('active', 'pending', 'inactive', 'published'));
