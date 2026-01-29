-- GPS Dental Training - Seminar Makeup Requests
-- Migration to add makeup request tracking system

-- ============================================================
-- SEMINAR MAKEUP REQUESTS TABLE
-- ============================================================
-- Tracks user requests for makeup sessions
-- One makeup session allowed per registration

CREATE TABLE IF NOT EXISTS seminar_makeup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Links
    registration_id UUID NOT NULL REFERENCES seminar_registrations(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE RESTRICT,

    -- Session they missed
    missed_session_id UUID NOT NULL REFERENCES seminar_sessions(id) ON DELETE RESTRICT,

    -- Session they want to attend as makeup (optional - can be chosen later)
    requested_session_id UUID REFERENCES seminar_sessions(id) ON DELETE SET NULL,

    -- Request details
    reason TEXT,
    notes TEXT, -- Admin notes

    -- Status workflow: pending -> approved/denied -> completed/cancelled
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Waiting for admin review
        'approved',     -- Admin approved, waiting for attendance
        'denied',       -- Admin denied the request
        'completed',    -- User attended the makeup session
        'cancelled',    -- User cancelled the request
        'expired'       -- Request expired without completion
    )),

    -- Admin response
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    denial_reason TEXT,

    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_makeup_requests_registration ON seminar_makeup_requests(registration_id);
CREATE INDEX idx_makeup_requests_user ON seminar_makeup_requests(user_id);
CREATE INDEX idx_makeup_requests_seminar ON seminar_makeup_requests(seminar_id);
CREATE INDEX idx_makeup_requests_status ON seminar_makeup_requests(status);
CREATE INDEX idx_makeup_requests_missed_session ON seminar_makeup_requests(missed_session_id);
CREATE INDEX idx_makeup_requests_created ON seminar_makeup_requests(created_at DESC);

-- Ensure only one pending/approved request per registration
-- (completed requests don't count - user already used their makeup)
CREATE UNIQUE INDEX idx_makeup_requests_unique_active
ON seminar_makeup_requests(registration_id)
WHERE status IN ('pending', 'approved');

-- ============================================================
-- FUNCTION: Update timestamp trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_makeup_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_makeup_request_updated
    BEFORE UPDATE ON seminar_makeup_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_makeup_request_timestamp();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE seminar_makeup_requests IS 'Tracks requests for makeup sessions in monthly seminars';
COMMENT ON COLUMN seminar_makeup_requests.missed_session_id IS 'The session the user missed and wants to make up';
COMMENT ON COLUMN seminar_makeup_requests.requested_session_id IS 'The session user requests to attend as makeup (optional)';
COMMENT ON COLUMN seminar_makeup_requests.status IS 'Workflow: pending -> approved/denied -> completed/cancelled/expired';
