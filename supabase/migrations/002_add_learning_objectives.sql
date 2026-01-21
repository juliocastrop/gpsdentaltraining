-- Add learning objectives column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- Add excerpt if not exists
ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Add gallery images
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Add video URL for intro/promo video
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Add what's included in the course
ALTER TABLE events ADD COLUMN IF NOT EXISTS includes TEXT[];

-- Add prerequisites
ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites TEXT[];

-- Add target audience
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience TEXT[];

COMMENT ON COLUMN events.learning_objectives IS 'Array of learning objectives for the course';
COMMENT ON COLUMN events.excerpt IS 'Short excerpt/summary for cards and SEO';
COMMENT ON COLUMN events.gallery_images IS 'Array of image URLs for course gallery';
COMMENT ON COLUMN events.video_url IS 'YouTube or Vimeo video URL for course intro';
COMMENT ON COLUMN events.includes IS 'What is included (materials, lunch, certificate, etc.)';
COMMENT ON COLUMN events.prerequisites IS 'Prerequisites for attending';
COMMENT ON COLUMN events.target_audience IS 'Who should attend this course';
