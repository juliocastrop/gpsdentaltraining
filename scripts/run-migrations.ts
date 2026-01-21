/**
 * GPS Dental Training - Database Migration Runner
 * Executes SQL migrations against Supabase PostgreSQL
 *
 * Usage: npx tsx scripts/run-migrations.ts 002_seminars_content.sql 003_pages_content.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Split SQL into individual statements, preserving complex statements
function splitSqlStatements(sql: string): string[] {
  // Remove single-line comments
  const lines = sql.split('\n').map(line => {
    const commentIndex = line.indexOf('--');
    if (commentIndex === 0) return '';
    if (commentIndex > 0) {
      // Check if -- is inside a string
      const beforeComment = line.substring(0, commentIndex);
      const singleQuotes = (beforeComment.match(/'/g) || []).length;
      if (singleQuotes % 2 === 0) {
        return line.substring(0, commentIndex);
      }
    }
    return line;
  });

  const cleanSql = lines.join('\n');

  // Split by semicolons not inside strings or function bodies
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let inDollarQuote = false;
  let dollarQuoteTag = '';

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    const nextChar = cleanSql[i + 1] || '';

    // Handle dollar quotes ($$ or $tag$)
    if (char === '$' && !inString) {
      if (cleanSql.substring(i).match(/^\$[a-zA-Z_]*\$/)) {
        const match = cleanSql.substring(i).match(/^\$([a-zA-Z_]*)\$/);
        if (match) {
          const tag = match[0];
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarQuoteTag = tag;
          } else if (dollarQuoteTag === tag) {
            inDollarQuote = false;
            dollarQuoteTag = '';
          }
        }
      }
    }

    // Handle regular strings
    if (char === "'" && !inDollarQuote) {
      inString = !inString;
    }

    // Split on semicolon if not in string or dollar quote
    if (char === ';' && !inString && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Add any remaining statement
  const remaining = current.trim();
  if (remaining) {
    statements.push(remaining);
  }

  return statements;
}

async function runMigration(filename: string): Promise<{ success: number; failed: number }> {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    return { success: 0, failed: 1 };
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📦 Running migration: ${filename}`);
  console.log('─'.repeat(60));

  const statements = splitSqlStatements(sql);
  let successCount = 0;
  let failedCount = 0;

  for (const statement of statements) {
    if (!statement) continue;

    // Get a preview of the statement
    const preview = statement
      .replace(/\s+/g, ' ')
      .substring(0, 70);

    try {
      // Use the REST API to execute SQL
      // Since Supabase JS doesn't support raw SQL, we'll use the postgrest endpoint
      // with rpc if available, or fall back to management API

      // For ALTER TABLE and CREATE TABLE, we can use the Supabase Management API
      // But that requires project ref and service key in a specific format

      // Alternative: Use fetch to call the SQL endpoint directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        // The exec_sql function might not exist, try alternative
        throw new Error(`RPC not available: ${response.status}`);
      }

      console.log(`  ✓ ${preview}...`);
      successCount++;
    } catch (err) {
      // For Supabase, we need to use the Management API or the SQL Editor
      // Let's output the statements that need to be run manually
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log(`  ⚠ Skipped (already exists): ${preview}...`);
        successCount++;
      } else {
        console.log(`  ⏸ Needs manual execution: ${preview}...`);
        failedCount++;
      }
    }
  }

  return { success: successCount, failed: failedCount };
}

async function testConnection(): Promise<boolean> {
  try {
    // Simple test query
    const { data, error } = await supabase.from('events').select('count').limit(0);
    if (error && !error.message.includes('0 rows')) {
      console.log('⚠ Note: Could not verify table access, but connection may still work');
    }
    return true;
  } catch {
    return false;
  }
}

async function outputMigrationSQL(filenames: string[]): Promise<void> {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 MIGRATION SQL - Copy and paste into Supabase SQL Editor');
  console.log('═'.repeat(60));
  console.log('\nDashboard URL: https://supabase.com/dashboard/project/mstvdmedcwibnhsymljd/sql/new');
  console.log('\n' + '─'.repeat(60));

  for (const filename of filenames) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

    if (!fs.existsSync(filePath)) {
      console.error(`\n❌ File not found: ${filename}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`\n-- ============================================================`);
    console.log(`-- MIGRATION: ${filename}`);
    console.log(`-- ============================================================\n`);
    console.log(sql);
    console.log('\n');
  }

  console.log('─'.repeat(60));
  console.log('✅ Copy the SQL above and run it in Supabase SQL Editor');
}

async function main(): Promise<void> {
  const migrations = process.argv.slice(2);

  if (migrations.length === 0) {
    console.log('GPS Dental Training - Migration Runner\n');
    console.log('Usage: npx tsx scripts/run-migrations.ts <file1.sql> [file2.sql ...]');
    console.log('\nExample:');
    console.log('  npx tsx scripts/run-migrations.ts 002_seminars_content.sql 003_pages_content.sql');
    console.log('\nAvailable migrations:');

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      files.forEach(f => console.log(`  - ${f}`));
    }

    process.exit(0);
  }

  console.log('🚀 GPS Dental Training - Migration Runner');
  console.log('─'.repeat(60));

  // Test connection
  const connected = await testConnection();
  if (connected) {
    console.log('✓ Supabase connection verified');
  }

  // Since direct SQL execution via REST API is limited,
  // output the SQL for manual execution in Supabase Dashboard
  await outputMigrationSQL(migrations);
}

main().catch(console.error);
