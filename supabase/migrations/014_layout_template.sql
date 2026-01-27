-- Add layout_template column to events and seminars tables
-- Allows per-event/seminar selection of frontend template (modern or classic)

ALTER TABLE events ADD COLUMN IF NOT EXISTS layout_template VARCHAR(50) DEFAULT 'modern';
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS layout_template VARCHAR(50) DEFAULT 'modern';

-- Add a comment to document the allowed values
COMMENT ON COLUMN events.layout_template IS 'Frontend display template: modern (default) or classic';
COMMENT ON COLUMN seminars.layout_template IS 'Frontend display template: modern (default) or classic';
