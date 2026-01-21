import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📦 Running migration: ${filename}`);
  console.log('─'.repeat(50));
  
  // Split by semicolons, handling multi-line statements
  const statements = sql
    .split(/;(?=\s*(?:--|CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|COMMENT|$))/gi)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase.from('_temp').select().limit(0);
        throw new Error(error.message);
      }
      
      successCount++;
      const shortStatement = statement.substring(0, 60).replace(/\n/g, ' ');
      console.log(`  ✓ ${shortStatement}...`);
    } catch (err) {
      // Some errors are expected (IF NOT EXISTS, etc)
      const msg = err.message || String(err);
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`  ⚠ Skipped (already exists): ${statement.substring(0, 40)}...`);
        successCount++;
      } else {
        console.error(`  ✗ Error: ${msg}`);
        console.error(`    Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);
  return errorCount === 0;
}

async function main() {
  const migrations = process.argv.slice(2);
  
  if (migrations.length === 0) {
    console.error('Usage: node run-migration.js <migration-file.sql> [migration-file2.sql ...]');
    process.exit(1);
  }
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) allSuccess = false;
  }
  
  process.exit(allSuccess ? 0 : 1);
}

main();
