/**
 * GPS Dental Training - Direct Migration Executor
 * Uses postgres.js to connect directly to Supabase
 *
 * Requires DATABASE_URL in .env:
 * DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

// Build connection URL from Supabase URL
// Format: postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const supabaseUrl = env.SUPABASE_URL;
const dbPassword = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in .env');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

let databaseUrl = env.DATABASE_URL;

if (!databaseUrl && dbPassword) {
  // Construct the URL using pooler connection
  databaseUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`;
}

if (!databaseUrl) {
  console.log('\n📋 To run migrations directly, add one of these to your .env file:');
  console.log('\n   Option 1: Full connection URL');
  console.log(`   DATABASE_URL=postgresql://postgres.${projectRef}:[YOUR-DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`);
  console.log('\n   Option 2: Just the password');
  console.log('   SUPABASE_DB_PASSWORD=your-database-password');
  console.log('\n   Find your database password in Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.log('\n   Or run migrations manually via SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  process.exit(1);
}

console.log('🚀 GPS Dental Training - Direct Migration Executor');
console.log('─'.repeat(60));
console.log(`📡 Connecting to project: ${projectRef}`);

const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
});

async function runMigration(filename: string): Promise<boolean> {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    return false;
  }

  const migrationSql = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📦 Running migration: ${filename}`);
  console.log('─'.repeat(60));

  try {
    // Execute the entire migration file as a single transaction
    await sql.unsafe(migrationSql);
    console.log(`✅ Migration ${filename} completed successfully!`);
    return true;
  } catch (error) {
    const err = error as Error & { position?: string; detail?: string };
    console.error(`❌ Migration ${filename} failed:`);
    console.error(`   Error: ${err.message}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);

    // Try to identify which statement failed
    if (err.position) {
      const pos = parseInt(err.position);
      const context = migrationSql.substring(Math.max(0, pos - 50), pos + 100);
      console.error(`   Near: ...${context}...`);
    }

    return false;
  }
}

async function main(): Promise<void> {
  const migrations = process.argv.slice(2);

  if (migrations.length === 0) {
    console.log('\nUsage: npx tsx scripts/exec-migration.ts <file1.sql> [file2.sql ...]');
    console.log('\nAvailable migrations:');

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      files.forEach(f => console.log(`  - ${f}`));
    }

    await sql.end();
    process.exit(0);
  }

  // Test connection
  try {
    const result = await sql`SELECT current_database(), current_user`;
    console.log(`✓ Connected to database: ${result[0].current_database} as ${result[0].current_user}`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', (error as Error).message);
    await sql.end();
    process.exit(1);
  }

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) allSuccess = false;
  }

  await sql.end();

  if (allSuccess) {
    console.log('\n✅ All migrations completed successfully!');
  } else {
    console.log('\n⚠️ Some migrations failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('Unexpected error:', error);
  await sql.end();
  process.exit(1);
});
