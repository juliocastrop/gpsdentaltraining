-- Migration: Waitlist by event_id support
-- Allows waitlist to work with event_id when ticket_type_id is not specified

-- Function to calculate next waitlist position by event_id
CREATE OR REPLACE FUNCTION get_next_waitlist_position_by_event(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_position INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), 0) INTO max_position
    FROM waitlist
    WHERE event_id = p_event_id
    AND status IN ('waiting', 'notified');

    RETURN max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- Make ticket_type_id nullable in waitlist table if it isn't already
ALTER TABLE waitlist ALTER COLUMN ticket_type_id DROP NOT NULL;
