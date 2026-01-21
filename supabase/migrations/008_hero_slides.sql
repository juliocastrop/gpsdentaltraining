-- Migration: Hero Slides for Homepage
-- Allows full administration of homepage hero slider from backend

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,

  -- Media
  image_url TEXT,
  video_url TEXT,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.50,

  -- Call to Action (Primary)
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),

  -- Call to Action (Secondary)
  cta_secondary_text VARCHAR(100),
  cta_secondary_link VARCHAR(500),

  -- Optional: Link to existing event/seminar
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  linked_seminar_id UUID REFERENCES seminars(id) ON DELETE SET NULL,

  -- Display Settings
  ce_credits INTEGER,
  badge_text VARCHAR(50),
  badge_variant VARCHAR(20) DEFAULT 'gold',

  -- Ordering & Status
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Schedule (optional)
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active slides ordered by display_order
CREATE INDEX idx_hero_slides_active ON hero_slides(is_active, display_order) WHERE is_active = true;

-- Create index for scheduled slides
CREATE INDEX idx_hero_slides_schedule ON hero_slides(start_date, end_date) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can read active slides
CREATE POLICY "Anyone can read active hero slides"
  ON hero_slides FOR SELECT
  USING (is_active = true);

-- Admins can manage all slides (you'll need to create an admin check function)
-- For now, allow all authenticated users to manage (adjust based on your auth setup)
CREATE POLICY "Authenticated users can manage hero slides"
  ON hero_slides FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_slides_updated_at();

-- Insert sample hero slides
INSERT INTO hero_slides (title, subtitle, description, image_url, cta_text, cta_link, ce_credits, badge_text, display_order, is_active) VALUES
(
  'Advanced Dental Training',
  'World-Class Education',
  'Master cutting-edge techniques with hands-on training from industry-leading experts in implantology, prosthodontics, and regenerative dentistry.',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&h=900&fit=crop',
  'View Courses',
  '/courses',
  15,
  'Featured',
  1,
  true
),
(
  'GPS Monthly Seminars',
  '2025 Program Now Open',
  'Join our 10-session cycle of literature review, case discussions, and treatment planning seminars. Earn up to 20 CE credits with one enrollment.',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop',
  'Enroll Today',
  '/monthly-seminars',
  20,
  '10 Sessions',
  2,
  true
),
(
  'PRF Protocols Masterclass',
  'With Dr. Joseph Choukroun',
  'Learn advanced platelet-rich fibrin techniques directly from the inventor of PRF technology. Limited seats available.',
  'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1600&h=900&fit=crop',
  'Register Now',
  '/courses/comprehensive-prf-protocols-handling-clinical-integration',
  15,
  'Hands-On',
  3,
  true
);

COMMENT ON TABLE hero_slides IS 'Administrable hero slider content for homepage';
COMMENT ON COLUMN hero_slides.linked_event_id IS 'Optional link to an event - will auto-populate data if set';
COMMENT ON COLUMN hero_slides.linked_seminar_id IS 'Optional link to a seminar - will auto-populate data if set';
COMMENT ON COLUMN hero_slides.overlay_opacity IS 'Darkness of image overlay (0.0 to 1.0)';
COMMENT ON COLUMN hero_slides.start_date IS 'If set, slide only shows after this date';
COMMENT ON COLUMN hero_slides.end_date IS 'If set, slide stops showing after this date';
