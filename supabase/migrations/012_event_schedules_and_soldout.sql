-- Migration 012: Event Schedules and Sold Out functionality
-- Adds schedule support for multi-day events and manual sold out toggle

-- Create event_schedules table for multi-day event agendas
CREATE TABLE IF NOT EXISTS event_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    tab_label VARCHAR(50), -- "Day 1", "Day 2", etc.
    topics JSONB DEFAULT '[]'::jsonb, -- Array of {name, start_time, end_time, speakers, location, description}
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(event_id, schedule_date)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_schedules_event_id ON event_schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_event_schedules_date ON event_schedules(schedule_date);

-- Add manual_sold_out to ticket_types for admin override
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS manual_sold_out BOOLEAN DEFAULT FALSE;

-- Add sold_count tracking to ticket_types
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Comments
COMMENT ON TABLE event_schedules IS 'Schedule/agenda for each day of an event';
COMMENT ON COLUMN event_schedules.topics IS 'JSON array: [{name, start_time, end_time, speakers: [], location, description}]';
COMMENT ON COLUMN ticket_types.manual_sold_out IS 'Admin can manually mark ticket as sold out regardless of quantity';
COMMENT ON COLUMN ticket_types.sold_count IS 'Number of tickets sold for this type';

-- Trigger to update sold_count on ticket_types when tickets are created
CREATE OR REPLACE FUNCTION update_ticket_type_sold_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ticket_types
        SET sold_count = (
            SELECT COUNT(*) FROM tickets
            WHERE ticket_type_id = NEW.ticket_type_id
            AND status = 'valid'
        )
        WHERE id = NEW.ticket_type_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update old ticket type count
        UPDATE ticket_types
        SET sold_count = (
            SELECT COUNT(*) FROM tickets
            WHERE ticket_type_id = OLD.ticket_type_id
            AND status = 'valid'
        )
        WHERE id = OLD.ticket_type_id;

        -- Update new ticket type count if changed
        IF NEW.ticket_type_id != OLD.ticket_type_id THEN
            UPDATE ticket_types
            SET sold_count = (
                SELECT COUNT(*) FROM tickets
                WHERE ticket_type_id = NEW.ticket_type_id
                AND status = 'valid'
            )
            WHERE id = NEW.ticket_type_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ticket_types
        SET sold_count = (
            SELECT COUNT(*) FROM tickets
            WHERE ticket_type_id = OLD.ticket_type_id
            AND status = 'valid'
        )
        WHERE id = OLD.ticket_type_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_ticket_type_sold_count ON tickets;
CREATE TRIGGER trigger_update_ticket_type_sold_count
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_type_sold_count();

-- RLS policies for event_schedules
ALTER TABLE event_schedules ENABLE ROW LEVEL SECURITY;

-- Public can read schedules
CREATE POLICY "event_schedules_public_read" ON event_schedules
    FOR SELECT USING (true);

-- Only authenticated admins can modify
CREATE POLICY "event_schedules_admin_all" ON event_schedules
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = auth.uid()::text
            AND role IN ('admin', 'staff')
        )
    );
