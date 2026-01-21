/**
 * Run database migration via Supabase API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mstvdmedcwibnhsymljd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHZkbWVkY3dpYm5oc3ltbGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNzEzMiwiZXhwIjoyMDg0NDkzMTMyfQ.6raVkpyKEUHQ3yYtAzBtnuq8bP9bFfHVDnInUWogKq8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration to add new columns to events table...\n');

  const alterStatements = [
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[]`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[]`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS includes TEXT[]`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites TEXT[]`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience TEXT[]`,
  ];

  for (const sql of alterStatements) {
    console.log(`Executing: ${sql.substring(0, 60)}...`);

    // Use raw SQL via the REST API
    const { error } = await supabase.from('events').select('id').limit(0);

    // We need to use the admin API or direct PostgreSQL connection
    // For now, let's use the pg_catalog trick
  }

  // Alternative: Use direct postgres connection if available
  // For Supabase, we can use the SQL Editor API or pooler

  console.log('\nMigration requires direct database access.');
  console.log('Please run this SQL in the Supabase SQL Editor:\n');
  console.log('='.repeat(60));
  console.log(`
ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS includes TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience TEXT[];

COMMENT ON COLUMN events.learning_objectives IS 'Array of learning objectives for the course';
COMMENT ON COLUMN events.excerpt IS 'Short excerpt/summary for cards and SEO';
COMMENT ON COLUMN events.gallery_images IS 'Array of image URLs for course gallery';
COMMENT ON COLUMN events.video_url IS 'YouTube or Vimeo video URL for course intro';
COMMENT ON COLUMN events.includes IS 'What is included (materials, lunch, certificate, etc.)';
COMMENT ON COLUMN events.prerequisites IS 'Prerequisites for attending';
COMMENT ON COLUMN events.target_audience IS 'Who should attend this course';
  `);
  console.log('='.repeat(60));
  console.log('\nAfter running the SQL, execute:');
  console.log('  npx tsx scripts/seed-complete-test-data.ts');
}

runMigration();
