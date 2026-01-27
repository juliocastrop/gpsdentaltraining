/**
 * Creates the event_schedules table in Supabase via the service role key.
 * Uses raw SQL via the Supabase pg_net extension or direct REST approach.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Attempting to create event_schedules table...\n');

  // Approach: Use Supabase's built-in ability to create tables via REST
  // Actually, the REST API doesn't support DDL.
  // Let's try using the database's built-in pg functions via RPC.

  // First check if we already have the table
  const { error: checkError } = await supabase.from('event_schedules').select('id').limit(1);

  if (!checkError) {
    console.log('Table event_schedules already exists!');
    return;
  }

  if (!checkError.message.includes('Could not find')) {
    console.log('Unexpected error:', checkError.message);
    return;
  }

  console.log('Table does not exist. Attempting to create via database function...');

  // Try to execute SQL via a custom function
  // If that doesn't exist, we need to provide instructions

  // Method: Use the Supabase Management API (requires access token, not service role)
  // OR: Connect directly to PostgreSQL

  // Since we can't do DDL via PostgREST, let's try the Supabase Management API
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log(`Project ref: ${projectRef}`);

  // The Management API needs SUPABASE_ACCESS_TOKEN (from `supabase login`)
  // which we don't have. Let's provide the SQL and a curl command.

  const sql = `
-- Create event_schedules table
CREATE TABLE IF NOT EXISTS event_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    tab_label VARCHAR(50),
    topics JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, schedule_date)
);

CREATE INDEX IF NOT EXISTS idx_event_schedules_event_id ON event_schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_event_schedules_date ON event_schedules(schedule_date);

ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS manual_sold_out BOOLEAN DEFAULT FALSE;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

ALTER TABLE event_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_schedules_public_read" ON event_schedules
    FOR SELECT USING (true);

CREATE POLICY "event_schedules_admin_all" ON event_schedules
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = auth.uid()::text
            AND role IN ('admin', 'staff')
        )
    );
`;

  console.log('\n========================================');
  console.log('IMPORTANT: Cannot create tables via PostgREST API.');
  console.log('Please run the following SQL in the Supabase SQL Editor:');
  console.log(`\nGo to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('========================================\n');
  console.log(sql);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
