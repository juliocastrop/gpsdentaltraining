-- Migration: 010_site_features.sql
-- Description: Create site_features table for "Why GPS" section and similar feature grids
-- Date: 2026-01-21

-- ============================================
-- HELPER FUNCTION (if not exists)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SITE FEATURES TABLE
-- ============================================
-- Stores feature cards that can be displayed in various sections
-- Like "Why GPS", "Our Benefits", etc.

CREATE TABLE IF NOT EXISTS site_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Feature content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'academic',  -- Key that maps to SVG icon

  -- Section assignment
  section VARCHAR(100) NOT NULL DEFAULT 'why-gps',  -- Which section this belongs to

  -- Display settings
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_site_features_section ON site_features(section);
CREATE INDEX idx_site_features_active ON site_features(is_active);
CREATE INDEX idx_site_features_sort ON site_features(section, sort_order);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_site_features_updated_at
  BEFORE UPDATE ON site_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA - Why GPS Features
-- ============================================

INSERT INTO site_features (title, description, icon, section, sort_order) VALUES
  ('Expert Faculty', 'Learn from world-renowned specialists and pioneers in dental education.', 'academic', 'why-gps', 1),
  ('Hands-On Training', 'Practical, skills-based learning with state-of-the-art equipment.', 'tools', 'why-gps', 2),
  ('CE Credits', 'AGD PACE-approved courses for FAGD/MAGD credit requirements.', 'certificate', 'why-gps', 3),
  ('Small Class Sizes', 'Personalized attention with limited enrollment for optimal learning.', 'users', 'why-gps', 4);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE site_features ENABLE ROW LEVEL SECURITY;

-- Public can read active features
CREATE POLICY "Public can view active features"
  ON site_features
  FOR SELECT
  USING (is_active = true);

-- Service role has full access
CREATE POLICY "Service role has full access to features"
  ON site_features
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE site_features IS 'Feature cards for homepage sections like "Why GPS"';
COMMENT ON COLUMN site_features.icon IS 'Icon key: academic, tools, certificate, users, star, check, globe, clock, etc.';
COMMENT ON COLUMN site_features.section IS 'Section identifier: why-gps, benefits, services, etc.';
