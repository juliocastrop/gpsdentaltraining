-- Add sponsors and accreditation JSONB columns to events table
-- sponsors: array of { name, logo_url, website_url }
-- accreditation: array of { name, logo_url, text }

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS sponsors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS accreditation JSONB DEFAULT '[]'::jsonb;

-- Also ensure site_settings table exists for general settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
