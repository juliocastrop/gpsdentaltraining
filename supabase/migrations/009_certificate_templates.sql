-- GPS Dental Training - Certificate Templates
-- Migration to add configurable certificate templates for courses and monthly seminars
-- Based on WordPress GPS Courses plugin class-certificate-settings.php

-- ============================================================
-- CERTIFICATE TEMPLATES TABLE
-- Stores configurable templates for PDF certificate generation
-- ============================================================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('course', 'seminar')),
    is_default BOOLEAN DEFAULT FALSE,

    -- Page settings
    page_orientation VARCHAR(20) DEFAULT 'L' CHECK (page_orientation IN ('L', 'P')), -- Landscape or Portrait
    page_format VARCHAR(20) DEFAULT 'LETTER', -- LETTER, A4, etc.

    -- Logo and branding
    logo_url VARCHAR(500),
    logo_width INTEGER DEFAULT 60,
    logo_height INTEGER DEFAULT 60,

    -- Header section
    header_title VARCHAR(255) DEFAULT 'GPS Dental Training',
    header_subtitle VARCHAR(255) DEFAULT 'Continuing Education',
    header_bg_color VARCHAR(7) DEFAULT '#0C2044',
    header_text_color VARCHAR(7) DEFAULT '#FFFFFF',

    -- Font sizes (in pt)
    header_title_size INTEGER DEFAULT 24,
    header_subtitle_size INTEGER DEFAULT 14,

    -- Main content section
    main_title VARCHAR(255) DEFAULT 'CERTIFICATE',
    main_subtitle VARCHAR(255) DEFAULT 'OF COMPLETION',
    main_title_size INTEGER DEFAULT 36,
    main_subtitle_size INTEGER DEFAULT 18,

    -- Colors
    primary_color VARCHAR(7) DEFAULT '#0C2044',
    secondary_color VARCHAR(7) DEFAULT '#666666',
    accent_color VARCHAR(7) DEFAULT '#DDC89D', -- Gold accent
    date_color VARCHAR(7) DEFAULT '#333333',
    code_bg_color VARCHAR(7) DEFAULT '#F5F5F5',

    -- Attendee name styling
    attendee_name_size INTEGER DEFAULT 28,
    attendee_name_color VARCHAR(7) DEFAULT '#0C2044',

    -- Event/course title styling
    event_title_size INTEGER DEFAULT 16,
    event_title_color VARCHAR(7) DEFAULT '#333333',

    -- Description and labels
    description_text TEXT DEFAULT 'has successfully completed',
    description_size INTEGER DEFAULT 14,

    -- Labels (customizable text)
    course_title_label VARCHAR(100) DEFAULT 'Course Title:',
    course_method_label VARCHAR(100) DEFAULT 'Course Method:',
    course_method_value VARCHAR(100) DEFAULT 'In-person / Live',
    location_label VARCHAR(100) DEFAULT 'Location:',
    location_value VARCHAR(255) DEFAULT 'Duluth, GA',
    date_label VARCHAR(100) DEFAULT 'Date:',
    ce_credits_label VARCHAR(100) DEFAULT 'CE Credits:',
    code_label VARCHAR(100) DEFAULT 'Certificate ID:',
    date_size INTEGER DEFAULT 12,

    -- Instructor/Signature section
    instructor_label VARCHAR(100) DEFAULT 'Program Director',
    instructor_name VARCHAR(255) DEFAULT 'Carlos Castro, DDS',
    signature_image_url VARCHAR(500),
    signature_width INTEGER DEFAULT 150,
    signature_height INTEGER DEFAULT 50,
    show_signature BOOLEAN DEFAULT TRUE,

    -- PACE Section (Accreditation)
    show_pace BOOLEAN DEFAULT TRUE,
    pace_logo_url VARCHAR(500),
    pace_logo_width INTEGER DEFAULT 80,
    pace_logo_height INTEGER DEFAULT 40,
    pace_text TEXT DEFAULT 'GPS Dental Training is an ADA CERP Recognized Provider. ADA CERP is a service of the American Dental Association to assist dental professionals in identifying quality providers of continuing dental education. ADA CERP does not approve or endorse individual courses or instructors, nor does it imply acceptance of credit hours by boards of dentistry.',
    pace_text_size INTEGER DEFAULT 8,
    program_provider TEXT DEFAULT 'GPS Dental Training is designated as an Approved PACE Program Provider by the Academy of General Dentistry. The formal continuing education programs of this program provider are accepted by AGD for Fellowship, Mastership, and membership maintenance credit.',

    -- QR Code section
    enable_qr_code BOOLEAN DEFAULT TRUE,
    qr_code_position VARCHAR(20) DEFAULT 'bottom-right' CHECK (qr_code_position IN ('bottom-left', 'bottom-right', 'top-left', 'top-right')),
    qr_code_size INTEGER DEFAULT 60,
    qr_code_label VARCHAR(100) DEFAULT 'Scan to verify',
    verification_url_base VARCHAR(255) DEFAULT 'https://gpsdentaltraining.com/certificate/',

    -- Footer
    footer_text TEXT,
    footer_size INTEGER DEFAULT 10,

    -- Seminar-specific fields (only used when template_type = 'seminar')
    seminar_period_label VARCHAR(100) DEFAULT 'Period:',
    seminar_sessions_label VARCHAR(100) DEFAULT 'Sessions Attended:',
    seminar_total_credits_label VARCHAR(100) DEFAULT 'Total CE Credits Earned:',

    -- Border and decoration
    show_border BOOLEAN DEFAULT TRUE,
    border_color VARCHAR(7) DEFAULT '#DDC89D',
    border_width INTEGER DEFAULT 2,
    border_margin INTEGER DEFAULT 10,

    -- Metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_certificate_templates_type ON certificate_templates(template_type);
CREATE INDEX idx_certificate_templates_default ON certificate_templates(is_default);
CREATE INDEX idx_certificate_templates_status ON certificate_templates(status);

-- ============================================================
-- UPDATE CERTIFICATES TABLE
-- Add reference to template used
-- ============================================================
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL;

-- ============================================================
-- INSERT DEFAULT TEMPLATES
-- ============================================================

-- Default Course Certificate Template
INSERT INTO certificate_templates (
    name,
    slug,
    template_type,
    is_default,
    header_title,
    header_subtitle,
    main_title,
    main_subtitle,
    description_text,
    instructor_name,
    instructor_label,
    pace_text,
    program_provider
) VALUES (
    'Default Course Certificate',
    'default-course',
    'course',
    TRUE,
    'GPS Dental Training',
    'Continuing Education',
    'CERTIFICATE',
    'OF COMPLETION',
    'has successfully completed the following continuing education course:',
    'Carlos Castro, DDS',
    'Program Director',
    'GPS Dental Training is an ADA CERP Recognized Provider. ADA CERP is a service of the American Dental Association to assist dental professionals in identifying quality providers of continuing dental education. ADA CERP does not approve or endorse individual courses or instructors, nor does it imply acceptance of credit hours by boards of dentistry.',
    'GPS Dental Training is designated as an Approved PACE Program Provider by the Academy of General Dentistry. The formal continuing education programs of this program provider are accepted by AGD for Fellowship, Mastership, and membership maintenance credit.'
);

-- Default Monthly Seminar Certificate Template
INSERT INTO certificate_templates (
    name,
    slug,
    template_type,
    is_default,
    header_title,
    header_subtitle,
    main_title,
    main_subtitle,
    description_text,
    instructor_name,
    instructor_label,
    seminar_period_label,
    seminar_sessions_label,
    seminar_total_credits_label,
    pace_text,
    program_provider
) VALUES (
    'Default Monthly Seminar Certificate',
    'default-seminar',
    'seminar',
    TRUE,
    'GPS Dental Training',
    'Monthly Seminars Program',
    'CERTIFICATE',
    'OF PARTICIPATION',
    'has successfully participated in the GPS Monthly Seminars Program',
    'Carlos Castro, DDS',
    'Program Director / Moderator',
    'Period:',
    'Sessions Attended:',
    'Total CE Credits Earned:',
    'GPS Dental Training is an ADA CERP Recognized Provider. ADA CERP is a service of the American Dental Association to assist dental professionals in identifying quality providers of continuing dental education. ADA CERP does not approve or endorse individual courses or instructors, nor does it imply acceptance of credit hours by boards of dentistry.',
    'GPS Dental Training is designated as an Approved PACE Program Provider by the Academy of General Dentistry. The formal continuing education programs of this program provider are accepted by AGD for Fellowship, Mastership, and membership maintenance credit.'
);

-- ============================================================
-- FUNCTION: Get default template by type
-- ============================================================
CREATE OR REPLACE FUNCTION get_default_certificate_template(p_template_type VARCHAR)
RETURNS certificate_templates AS $$
    SELECT * FROM certificate_templates
    WHERE template_type = p_template_type
    AND is_default = TRUE
    AND status = 'active'
    LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================
-- TRIGGER: Ensure only one default per type
-- ============================================================
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE certificate_templates
        SET is_default = FALSE
        WHERE template_type = NEW.template_type
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_default_template
    BEFORE INSERT OR UPDATE ON certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_template();

-- ============================================================
-- TRIGGER: Update timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_certificate_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_certificate_template_timestamp
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_template_timestamp();
