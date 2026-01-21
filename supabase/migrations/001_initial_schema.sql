-- GPS Dental Training - Initial Database Schema
-- This migration creates all tables needed for the headless platform
-- Based on the WordPress GPS Courses plugin schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (synced with Clerk)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- EVENTS TABLE (courses/events)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strapi_id INTEGER UNIQUE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    excerpt TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(255),
    address TEXT,
    ce_credits INTEGER DEFAULT 0,
    capacity INTEGER,
    schedule_topics JSONB,
    featured_image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);

-- ============================================================
-- TICKET TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(50) CHECK (ticket_type IN ('early_bird', 'general', 'vip', 'group')),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER, -- NULL = unlimited
    sale_start TIMESTAMP WITH TIME ZONE,
    sale_end TIMESTAMP WITH TIME ZONE,
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),
    manual_sold_out BOOLEAN DEFAULT FALSE,
    features TEXT[],
    internal_label VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_status ON ticket_types(status);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    billing_email VARCHAR(255) NOT NULL,
    billing_name VARCHAR(255),
    billing_phone VARCHAR(50),
    billing_address JSONB,
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partially_refunded', 'refunded')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_billing_email ON orders(billing_email);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    seminar_id UUID, -- Will reference seminars table
    item_type VARCHAR(50) DEFAULT 'ticket' CHECK (item_type IN ('ticket', 'seminar')),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_event ON order_items(event_id);

-- ============================================================
-- TICKETS TABLE (individual ticket instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    qr_code_data JSONB, -- Contains ticket_code, event_id, hash for verification
    qr_code_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_email ON tickets(attendee_email);
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_method VARCHAR(50) CHECK (check_in_method IN ('qr_scan', 'manual', 'search')),
    checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attendance_ticket ON attendance(ticket_id);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);

-- ============================================================
-- CE CREDITS LEDGER TABLE (immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS ce_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    seminar_id UUID, -- Will reference seminars table
    session_id UUID, -- Will reference seminar_sessions table
    credits DECIMAL(5,2) NOT NULL,
    source VARCHAR(100) CHECK (source IN ('course_attendance', 'seminar_session', 'manual', 'adjustment')),
    transaction_type VARCHAR(50) DEFAULT 'earned' CHECK (transaction_type IN ('earned', 'adjustment', 'revoked')),
    notes TEXT,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ce_ledger_user ON ce_ledger(user_id);
CREATE INDEX idx_ce_ledger_event ON ce_ledger(event_id);
CREATE INDEX idx_ce_ledger_awarded_at ON ce_ledger(awarded_at);

-- ============================================================
-- WAITLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    position INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'removed')),
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- 48h after notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_waitlist_ticket_type ON waitlist(ticket_type_id);
CREATE INDEX idx_waitlist_event ON waitlist(event_id);
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_position ON waitlist(position);

-- ============================================================
-- CERTIFICATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_code VARCHAR(50) UNIQUE NOT NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    seminar_id UUID, -- Will reference seminars table for seminar certificates
    attendee_name VARCHAR(255) NOT NULL,
    ce_credits DECIMAL(5,2),
    pdf_url VARCHAR(500),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_certificates_code ON certificates(certificate_code);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_event ON certificates(event_id);

-- ============================================================
-- SEMINARS TABLE (Monthly Seminars)
-- ============================================================
CREATE TABLE IF NOT EXISTS seminars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strapi_id INTEGER UNIQUE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 750.00,
    capacity INTEGER,
    total_sessions INTEGER DEFAULT 10,
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seminars_slug ON seminars(slug);
CREATE INDEX idx_seminars_year ON seminars(year);
CREATE INDEX idx_seminars_status ON seminars(status);

-- Add foreign key to order_items
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_seminar
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE SET NULL;

-- Add foreign keys to ce_ledger
ALTER TABLE ce_ledger ADD CONSTRAINT fk_ce_ledger_seminar
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE SET NULL;

-- Add foreign key to certificates
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_seminar
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE SET NULL;

-- ============================================================
-- SEMINAR SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seminar_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time_start TIME,
    session_time_end TIME,
    topic VARCHAR(500),
    description TEXT,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seminar_sessions_seminar ON seminar_sessions(seminar_id);
CREATE INDEX idx_seminar_sessions_date ON seminar_sessions(session_date);

-- Add foreign key to ce_ledger for session
ALTER TABLE ce_ledger ADD CONSTRAINT fk_ce_ledger_session
    FOREIGN KEY (session_id) REFERENCES seminar_sessions(id) ON DELETE SET NULL;

-- ============================================================
-- SEMINAR REGISTRATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seminar_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    start_session_date DATE,
    sessions_completed INTEGER DEFAULT 0,
    sessions_remaining INTEGER DEFAULT 10,
    makeup_used BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    qr_code VARCHAR(100),
    qr_code_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seminar_registrations_user ON seminar_registrations(user_id);
CREATE INDEX idx_seminar_registrations_seminar ON seminar_registrations(seminar_id);
CREATE INDEX idx_seminar_registrations_order ON seminar_registrations(order_id);
CREATE INDEX idx_seminar_registrations_status ON seminar_registrations(status);

-- Ensure unique registration per user per seminar
CREATE UNIQUE INDEX idx_seminar_registrations_unique ON seminar_registrations(user_id, seminar_id)
    WHERE status != 'cancelled';

-- ============================================================
-- SEMINAR ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seminar_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES seminar_registrations(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES seminar_sessions(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE RESTRICT,
    is_makeup BOOLEAN DEFAULT FALSE,
    credits_awarded DECIMAL(5,2) DEFAULT 2.00,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);

CREATE INDEX idx_seminar_attendance_registration ON seminar_attendance(registration_id);
CREATE INDEX idx_seminar_attendance_session ON seminar_attendance(session_id);
CREATE INDEX idx_seminar_attendance_user ON seminar_attendance(user_id);

-- Ensure unique attendance per registration per session
CREATE UNIQUE INDEX idx_seminar_attendance_unique ON seminar_attendance(registration_id, session_id);

-- ============================================================
-- SPEAKERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strapi_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    photo_url VARCHAR(500),
    social_links JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_speakers_slug ON speakers(slug);

-- ============================================================
-- EVENT SPEAKERS (junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_speakers (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (event_id, speaker_id)
);

-- ============================================================
-- USER MIGRATION MAP (temporary, for WordPress migration)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_migration_map (
    wp_user_id INTEGER PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE,
    supabase_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_number := 'GPS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number);
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique order number';
        END IF;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_code := 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_code = new_code);
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique ticket code';
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique certificate code
CREATE OR REPLACE FUNCTION generate_certificate_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_code := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM certificates WHERE certificate_code = new_code);
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique certificate code';
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next waitlist position
CREATE OR REPLACE FUNCTION get_next_waitlist_position(p_ticket_type_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_position INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), 0) INTO max_position
    FROM waitlist
    WHERE ticket_type_id = p_ticket_type_id
    AND status IN ('waiting', 'notified');

    RETURN max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get ticket stock
CREATE OR REPLACE FUNCTION get_ticket_stock(p_ticket_type_id UUID)
RETURNS TABLE (
    total INTEGER,
    sold INTEGER,
    available INTEGER,
    unlimited BOOLEAN
) AS $$
DECLARE
    v_quantity INTEGER;
    v_sold INTEGER;
BEGIN
    -- Get the total quantity (NULL = unlimited)
    SELECT tt.quantity INTO v_quantity
    FROM ticket_types tt
    WHERE tt.id = p_ticket_type_id;

    -- Count sold tickets from completed orders
    SELECT COUNT(*) INTO v_sold
    FROM tickets t
    JOIN orders o ON t.order_id = o.id
    WHERE t.ticket_type_id = p_ticket_type_id
    AND o.status = 'completed';

    RETURN QUERY SELECT
        COALESCE(v_quantity, 0) AS total,
        v_sold AS sold,
        CASE
            WHEN v_quantity IS NULL THEN 999999
            ELSE GREATEST(0, v_quantity - v_sold)
        END AS available,
        v_quantity IS NULL AS unlimited;
END;
$$ LANGUAGE plpgsql;

-- Function to check if ticket is sold out
CREATE OR REPLACE FUNCTION is_ticket_sold_out(p_ticket_type_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_manual_sold_out BOOLEAN;
    v_stock RECORD;
BEGIN
    -- Check manual sold out flag
    SELECT manual_sold_out INTO v_manual_sold_out
    FROM ticket_types
    WHERE id = p_ticket_type_id;

    IF v_manual_sold_out THEN
        RETURN TRUE;
    END IF;

    -- Check actual stock
    SELECT * INTO v_stock FROM get_ticket_stock(p_ticket_type_id);

    RETURN NOT v_stock.unlimited AND v_stock.available = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get user total CE credits
CREATE OR REPLACE FUNCTION get_user_total_credits(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN transaction_type = 'earned' THEN credits
            WHEN transaction_type = 'adjustment' THEN credits
            WHEN transaction_type = 'revoked' THEN -credits
            ELSE 0
        END
    ), 0) INTO total
    FROM ce_ledger
    WHERE user_id = p_user_id;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION trigger_set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_order_number();

-- Trigger to auto-generate ticket code
CREATE OR REPLACE FUNCTION trigger_set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_code
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_ticket_code();

-- Trigger to auto-generate certificate code
CREATE OR REPLACE FUNCTION trigger_set_certificate_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certificate_code IS NULL OR NEW.certificate_code = '' THEN
        NEW.certificate_code := generate_certificate_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_certificate_code
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_certificate_code();

-- Trigger to update timestamp on users table
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_events_timestamp
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_speakers_timestamp
    BEFORE UPDATE ON speakers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

-- Trigger to update seminar registration progress after attendance
CREATE OR REPLACE FUNCTION trigger_update_seminar_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE seminar_registrations
    SET
        sessions_completed = (
            SELECT COUNT(*)
            FROM seminar_attendance
            WHERE registration_id = NEW.registration_id
        ),
        sessions_remaining = total_sessions - (
            SELECT COUNT(*)
            FROM seminar_attendance
            WHERE registration_id = NEW.registration_id
        ),
        status = CASE
            WHEN sessions_remaining <= 0 THEN 'completed'
            ELSE status
        END
    FROM seminars s
    WHERE seminar_registrations.id = NEW.registration_id
    AND seminar_registrations.seminar_id = s.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seminar_progress
    AFTER INSERT ON seminar_attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_seminar_progress();

-- Trigger to mark ticket as used after attendance
CREATE OR REPLACE FUNCTION trigger_mark_ticket_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tickets
    SET status = 'used'
    WHERE id = NEW.ticket_id
    AND status = 'valid';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_ticket_used
    AFTER INSERT ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_mark_ticket_used();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ce_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public events are viewable" ON events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Active tickets are viewable" ON ticket_types
    FOR SELECT USING (status = 'active');

CREATE POLICY "Published seminars are viewable" ON seminars
    FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Seminar sessions are viewable" ON seminar_sessions
    FOR SELECT USING (TRUE);

CREATE POLICY "Speakers are viewable" ON speakers
    FOR SELECT USING (TRUE);

-- User-specific policies (will be refined when Clerk is integrated)
-- For now, service role bypasses RLS

-- Service role policies (full access for server-side operations)
-- These are automatically applied when using supabaseAdmin client

COMMENT ON TABLE users IS 'User accounts synced with Clerk';
COMMENT ON TABLE events IS 'Courses and events';
COMMENT ON TABLE ticket_types IS 'Ticket types available for events';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE tickets IS 'Individual ticket instances';
COMMENT ON TABLE attendance IS 'Check-in records for events';
COMMENT ON TABLE ce_ledger IS 'Immutable CE credits transaction log';
COMMENT ON TABLE waitlist IS 'Waitlist for sold-out tickets';
COMMENT ON TABLE certificates IS 'Generated certificates';
COMMENT ON TABLE seminars IS 'Monthly seminar programs';
COMMENT ON TABLE seminar_sessions IS 'Individual seminar sessions';
COMMENT ON TABLE seminar_registrations IS 'User registrations for seminars';
COMMENT ON TABLE seminar_attendance IS 'Attendance records for seminar sessions';
