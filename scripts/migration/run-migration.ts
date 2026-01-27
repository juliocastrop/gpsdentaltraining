#!/usr/bin/env npx tsx
/**
 * GPS Dental Training - Full Migration Script
 *
 * Orchestrates the complete migration from WordPress to the headless stack.
 * Runs all migration scripts in the correct order with dependency handling.
 *
 * Usage:
 *   npx tsx scripts/migration/run-migration.ts [options]
 *
 * Options:
 *   --dry-run         Run without making changes
 *   --step=<step>     Run only a specific step (users, events, seminars, orders, credits)
 *   --from=<step>     Start from a specific step
 *   --export-only     Only export data, don't migrate
 *   --help            Show help
 *
 * Examples:
 *   npx tsx scripts/migration/run-migration.ts --dry-run
 *   npx tsx scripts/migration/run-migration.ts --step=users
 *   npx tsx scripts/migration/run-migration.ts --from=orders
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { migrationSettings, log, loadMappingsFromFile } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration steps in order
const MIGRATION_STEPS = [
  {
    name: 'users',
    script: 'migrate-users.ts',
    description: 'Migrate WordPress users to Clerk and Supabase',
    dependsOn: [],
  },
  {
    name: 'events',
    script: 'migrate-events.ts',
    description: 'Migrate events, speakers, and ticket types to Strapi and Supabase',
    dependsOn: ['users'],
  },
  {
    name: 'event-schedules',
    script: 'migrate-event-schedules.ts',
    description: 'Migrate event schedules/agenda from gps_schedule CPT',
    dependsOn: ['events'],
  },
  {
    name: 'seminars',
    script: 'migrate-seminars.ts',
    description: 'Migrate seminars, sessions, registrations, and attendance',
    dependsOn: ['users'],
  },
  {
    name: 'orders',
    script: 'migrate-orders.ts',
    description: 'Migrate WooCommerce orders, tickets, and attendance',
    dependsOn: ['users', 'events'],
  },
  {
    name: 'credits',
    script: 'migrate-credits.ts',
    description: 'Migrate CE credits, certificates, and waitlist',
    dependsOn: ['users', 'events', 'orders'],
  },
];

// Parse command line arguments
function parseArgs(): {
  dryRun: boolean;
  step: string | null;
  from: string | null;
  exportOnly: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const stepArg = args.find(a => a.startsWith('--step='));
  const fromArg = args.find(a => a.startsWith('--from='));

  return {
    dryRun: args.includes('--dry-run'),
    step: stepArg ? stepArg.split('=')[1] : null,
    from: fromArg ? fromArg.split('=')[1] : null,
    exportOnly: args.includes('--export-only'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

// Run a migration script
async function runMigrationScript(
  scriptName: string,
  extraArgs: string[] = []
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, scriptName);
    const args = ['tsx', scriptPath, ...extraArgs];

    log.info(`Running: npx ${args.join(' ')}`);

    const proc = spawn('npx', args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput,
      });
    });

    proc.on('error', (error) => {
      resolve({
        success: false,
        output: error.message,
      });
    });
  });
}

// Show help
function showHelp(): void {
  console.log(`
GPS Dental Training - WordPress to Headless Migration

Usage:
  npx tsx scripts/migration/run-migration.ts [options]

Options:
  --dry-run         Run without making changes (exports data for review)
  --step=<step>     Run only a specific step
  --from=<step>     Start from a specific step (skip earlier steps)
  --export-only     Only export data, don't migrate
  --help, -h        Show this help message

Available Steps (in order):
${MIGRATION_STEPS.map((s, i) => `  ${i + 1}. ${s.name.padEnd(12)} - ${s.description}`).join('\n')}

Examples:
  # Full dry run (recommended first step)
  npx tsx scripts/migration/run-migration.ts --dry-run

  # Migrate only users
  npx tsx scripts/migration/run-migration.ts --step=users

  # Start from orders (skip users, events, seminars)
  npx tsx scripts/migration/run-migration.ts --from=orders

  # Export all data for review
  npx tsx scripts/migration/run-migration.ts --export-only

Environment Variables Required:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Supabase service role key
  WP_DB_HOST                WordPress database host
  WP_DB_USER                WordPress database user
  WP_DB_PASSWORD            WordPress database password
  WP_DB_NAME                WordPress database name
  WP_TABLE_PREFIX           WordPress table prefix (default: wp_)
  STRAPI_URL                Strapi API URL
  STRAPI_API_TOKEN          Strapi API token
  CLERK_SECRET_KEY          Clerk secret key (for user migration)

Migration Order:
  1. Users must be migrated first (creates ID mappings)
  2. Events can run after users (speakers linked to events)
  3. Seminars can run after users
  4. Orders depend on users and events (ticket types needed)
  5. Credits depend on users, events, and orders

Output:
  - Migration reports saved to: scripts/migration/output/
  - ID mappings saved to: scripts/migration/output/id-mappings.json
  - Export files saved to: scripts/migration/output/
  `);
}

// Check environment variables
function checkEnvironment(): boolean {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WP_DB_HOST',
    'WP_DB_USER',
    'WP_DB_NAME',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    log.error('Missing required environment variables:');
    for (const key of missing) {
      log.error(`  - ${key}`);
    }
    log.info('\nCreate a .env file with these variables or set them in your environment.');
    return false;
  }

  return true;
}

// Main migration function
async function runMigration(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     GPS Dental Training - WordPress to Headless Migration    ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Ensure output directory exists
  await fs.mkdir(migrationSettings.outputDir, { recursive: true });

  // Determine which steps to run
  let stepsToRun = [...MIGRATION_STEPS];

  if (options.step) {
    const step = MIGRATION_STEPS.find(s => s.name === options.step);
    if (!step) {
      log.error(`Unknown step: ${options.step}`);
      log.info(`Available steps: ${MIGRATION_STEPS.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    stepsToRun = [step];
    log.info(`Running single step: ${options.step}`);
  } else if (options.from) {
    const fromIndex = MIGRATION_STEPS.findIndex(s => s.name === options.from);
    if (fromIndex === -1) {
      log.error(`Unknown step: ${options.from}`);
      log.info(`Available steps: ${MIGRATION_STEPS.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    stepsToRun = MIGRATION_STEPS.slice(fromIndex);
    log.info(`Starting from step: ${options.from}`);
  }

  if (options.dryRun) {
    log.info('DRY RUN MODE - No changes will be made');
  }

  if (options.exportOnly) {
    log.info('EXPORT ONLY MODE - Data will be exported for review');
  }

  // Load existing mappings if continuing
  if (options.from) {
    await loadMappingsFromFile();
  }

  // Run migrations
  const results: { step: string; success: boolean; duration: number }[] = [];

  for (const step of stepsToRun) {
    console.log(`
┌──────────────────────────────────────────────────────────────┐
│ Step: ${step.name.padEnd(54)} │
│ ${step.description.padEnd(60)} │
└──────────────────────────────────────────────────────────────┘
    `);

    const startTime = Date.now();

    // Build arguments
    const args: string[] = [];
    if (options.dryRun) args.push('--dry-run');
    if (options.exportOnly && step.name === 'users') args.push('--export-only');

    // Run the script
    const result = await runMigrationScript(step.script, args);
    const duration = (Date.now() - startTime) / 1000;

    results.push({
      step: step.name,
      success: result.success,
      duration,
    });

    if (!result.success) {
      log.error(`Step "${step.name}" failed!`);

      // In full run mode, ask whether to continue
      if (stepsToRun.length > 1) {
        log.warn('Continuing with remaining steps may cause issues due to missing ID mappings.');
        log.info('Consider fixing the issue and running again with --from=' + step.name);
      }
      break;
    }

    log.success(`Step "${step.name}" completed in ${duration.toFixed(1)}s`);
  }

  // Summary
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      MIGRATION SUMMARY                       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  for (const result of results) {
    const status = result.success ? '✓' : '✗';
    const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${statusColor}${status}\x1b[0m ${result.step.padEnd(12)} (${result.duration.toFixed(1)}s)`);
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const allSuccess = results.every(r => r.success);

  console.log(`
  ────────────────────────────────────────────────────────────
  Total time: ${totalDuration.toFixed(1)}s
  Status: ${allSuccess ? '\x1b[32mSUCCESS\x1b[0m' : '\x1b[31mFAILED\x1b[0m'}
  `);

  console.log(`
  Output files saved to: ${migrationSettings.outputDir}
  `);

  process.exit(allSuccess ? 0 : 1);
}

// Run
runMigration().catch(error => {
  log.error('Migration failed:', error);
  process.exit(1);
});
