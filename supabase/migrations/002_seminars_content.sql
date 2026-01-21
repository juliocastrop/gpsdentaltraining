-- GPS Dental Training - Seminars Content Fields Migration
-- Adds additional content fields for the Monthly Seminars page

-- Add content fields to seminars table for fully dynamic page content
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS featured_image_url VARCHAR(500);
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR(500);
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS program_description TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS membership_policy TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS refund_policy TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS makeup_policy TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS credits_per_session DECIMAL(5,2) DEFAULT 2.00;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS total_credits DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS session_duration VARCHAR(100) DEFAULT '2 hours';
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Agenda items for each session (meet & greet, main session, summary)
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS agenda_items JSONB DEFAULT '[
  {"time": "5:45 PM - 6:00 PM", "title": "Meet and Greet", "description": "Networking and introductions"},
  {"time": "6:00 PM - 7:45 PM", "title": "Main Session", "description": "Core content and discussions"},
  {"time": "7:45 PM - 8:00 PM", "title": "Summary & Conclusions", "description": "Key takeaways and Q&A"}
]'::JSONB;

-- Certificate distribution dates (June 30 and December 31)
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS certificate_dates JSONB DEFAULT '["June 30", "December 31"]'::JSONB;

-- Accreditation information
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS accreditation_text TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS accreditation_logo_url VARCHAR(500);

-- SEO fields
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500);

-- Create seminar_moderators junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS seminar_moderators (
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'moderator', -- moderator, guest_speaker, etc.
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (seminar_id, speaker_id)
);

CREATE INDEX idx_seminar_moderators_seminar ON seminar_moderators(seminar_id);
CREATE INDEX idx_seminar_moderators_speaker ON seminar_moderators(speaker_id);

-- Update types for database.ts
COMMENT ON COLUMN seminars.subtitle IS 'Subtitle displayed under the main title';
COMMENT ON COLUMN seminars.program_description IS 'Full HTML/Markdown description of the program';
COMMENT ON COLUMN seminars.benefits IS 'Array of program benefits/features';
COMMENT ON COLUMN seminars.membership_policy IS 'Membership policy text';
COMMENT ON COLUMN seminars.refund_policy IS 'Refund/cancellation policy';
COMMENT ON COLUMN seminars.makeup_policy IS 'Makeup session policy';
COMMENT ON COLUMN seminars.agenda_items IS 'JSON array of agenda items with time, title, description';
COMMENT ON COLUMN seminars.certificate_dates IS 'JSON array of certificate distribution dates';
COMMENT ON COLUMN seminars.accreditation_text IS 'PACE accreditation description';
COMMENT ON COLUMN seminars.accreditation_logo_url IS 'URL to PACE or accreditation logo';
