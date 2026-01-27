-- Add missing columns to events table
-- These columns are used by the admin EventDetail edit form
-- but were not present in the original schema

ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS includes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb;
