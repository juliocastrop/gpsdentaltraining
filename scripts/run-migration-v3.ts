/**
 * Run migration to add learning_objectives column
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mstvdmedcwibnhsymljd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHZkbWVkY3dpYm5oc3ltbGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNzEzMiwiZXhwIjoyMDg0NDkzMTMyfQ.6raVkpyKEUHQ3yYtAzBtnuq8bP9bFfHVDnInUWogKq8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Adding learning_objectives column to events table...\n');

  // Use raw SQL query via the REST API
  const { data, error } = await supabase
    .from('events')
    .select('learning_objectives')
    .limit(1);

  if (error && error.message.includes('learning_objectives')) {
    console.log('Column does not exist, need to add it via Supabase Dashboard SQL Editor.');
    console.log('\nPlease run this SQL in your Supabase Dashboard:\n');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];');
    console.log('\nURL: https://supabase.com/dashboard/project/mstvdmedcwibnhsymljd/sql/new');
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Column already exists! Ready to seed data.');
  }
}

runMigration();
