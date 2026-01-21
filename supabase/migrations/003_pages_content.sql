-- GPS Dental Training - Static Pages Content Migration
-- Creates tables for managing dynamic page content

-- ============================================================
-- PAGES TABLE (for static pages like About, Contact, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    hero_image_url VARCHAR(500),
    content JSONB, -- Flexible content structure
    meta_title VARCHAR(255),
    meta_description TEXT,
    og_image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);

-- ============================================================
-- TEAM MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255),
    credentials VARCHAR(255), -- DDS, FACP, etc.
    role VARCHAR(100), -- founder, instructor, lab_director, etc.
    bio TEXT,
    short_bio TEXT,
    photo_url VARCHAR(500),
    education TEXT[], -- Array of education credentials
    certifications TEXT[], -- Array of certifications
    social_links JSONB,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_members_slug ON team_members(slug);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_display_order ON team_members(display_order);

-- ============================================================
-- FACILITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    features TEXT[],
    images JSONB, -- Array of {url, alt, caption}
    display_order INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_facilities_slug ON facilities(slug);

-- ============================================================
-- TESTIMONIALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_name VARCHAR(255) NOT NULL,
    author_title VARCHAR(255),
    author_company VARCHAR(255),
    author_photo_url VARCHAR(500),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    seminar_id UUID REFERENCES seminars(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_status ON testimonials(status);

-- ============================================================
-- PARTNERS/ACCREDITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    description TEXT,
    partner_type VARCHAR(50) CHECK (partner_type IN ('accreditation', 'sponsor', 'partner', 'affiliate')),
    display_order INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partners_type ON partners(partner_type);

-- Update triggers
CREATE TRIGGER update_pages_timestamp
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_team_members_timestamp
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

-- RLS Policies
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are viewable" ON pages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Active team members are viewable" ON team_members
    FOR SELECT USING (status = 'active');

CREATE POLICY "Active facilities are viewable" ON facilities
    FOR SELECT USING (status = 'active');

CREATE POLICY "Active testimonials are viewable" ON testimonials
    FOR SELECT USING (status = 'active');

CREATE POLICY "Active partners are viewable" ON partners
    FOR SELECT USING (status = 'active');

COMMENT ON TABLE pages IS 'Static page content (About, Contact, etc.)';
COMMENT ON TABLE team_members IS 'Team members and instructors';
COMMENT ON TABLE facilities IS 'Training facility information';
COMMENT ON TABLE testimonials IS 'Student testimonials and reviews';
COMMENT ON TABLE partners IS 'Partners, sponsors, and accreditations';
