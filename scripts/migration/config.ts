/**
 * Migration Configuration
 *
 * This file contains configuration for migrating data from WordPress
 * to the new headless stack (Supabase + Strapi + Clerk)
 */

import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// WORDPRESS DATABASE CONFIGURATION
// ============================================================

export const wpDbConfig = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT || '3306'),
  user: process.env.WP_DB_USER || 'root',
  password: process.env.WP_DB_PASSWORD || '',
  database: process.env.WP_DB_NAME || 'gpsdentaltraining',
};

export const wpTablePrefix = process.env.WP_TABLE_PREFIX || 'wpiy_';

let wpConnection: mysql.Connection | null = null;

export async function getWpConnection(): Promise<mysql.Connection> {
  if (!wpConnection) {
    wpConnection = await mysql.createConnection(wpDbConfig);
  }
  return wpConnection;
}

export async function closeWpConnection(): Promise<void> {
  if (wpConnection) {
    await wpConnection.end();
    wpConnection = null;
  }
}

// ============================================================
// STRAPI CONFIGURATION
// ============================================================

export const strapiConfig = {
  url: process.env.STRAPI_URL || 'http://localhost:1337',
  apiToken: process.env.STRAPI_API_TOKEN || '',
};

// ============================================================
// CLERK CONFIGURATION
// ============================================================

export const clerkConfig = {
  secretKey: process.env.CLERK_SECRET_KEY || '',
  publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY || '',
};

// ============================================================
// MIGRATION SETTINGS
// ============================================================

export const migrationSettings = {
  // Batch size for bulk operations
  batchSize: 100,

  // Whether to run in dry-run mode (no actual writes)
  dryRun: process.env.MIGRATION_DRY_RUN === 'true',

  // Whether to skip existing records
  skipExisting: true,

  // Log level: 'debug', 'info', 'warn', 'error'
  logLevel: process.env.MIGRATION_LOG_LEVEL || 'info',

  // Output directory for migration reports
  outputDir: path.resolve(process.cwd(), 'scripts/migration/output'),
};

// ============================================================
// LOGGING UTILITIES
// ============================================================

const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = logLevels[migrationSettings.logLevel as keyof typeof logLevels] || 1;

export const log = {
  debug: (...args: unknown[]) => {
    if (currentLogLevel <= 0) console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (currentLogLevel <= 1) console.log('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (currentLogLevel <= 2) console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    if (currentLogLevel <= 3) console.error('[ERROR]', ...args);
  },
  success: (...args: unknown[]) => {
    if (currentLogLevel <= 1) console.log('[SUCCESS]', ...args);
  },
  progress: (current: number, total: number, label: string) => {
    const percent = Math.round((current / total) * 100);
    process.stdout.write(`\r[PROGRESS] ${label}: ${current}/${total} (${percent}%)`);
    if (current === total) console.log();
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse WordPress serialized PHP array
 */
export function unserialize(data: string): unknown {
  if (!data || data === '') return null;

  try {
    // Try JSON first (some WP data is stored as JSON)
    return JSON.parse(data);
  } catch {
    // Fall back to basic PHP unserialize for simple arrays
    // Note: This is a simplified parser that handles common cases
    if (data.startsWith('a:')) {
      const matches = data.match(/s:\d+:"([^"]+)"/g);
      if (matches) {
        return matches.map(m => m.replace(/s:\d+:"([^"]+)"/, '$1'));
      }
    }
    return data;
  }
}

/**
 * Format WordPress date to ISO string
 */
export function formatWpDate(date: string | Date | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Format WordPress time (HH:MM or HH:MM:SS) to standard format
 */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}:00`;
  }
  return null;
}

/**
 * Create a WordPress to Supabase ID mapping record
 */
export interface IdMapping {
  wpId: number;
  supabaseId: string;
  type: 'user' | 'event' | 'seminar' | 'speaker' | 'ticket_type' | 'order' | 'ticket';
}

const idMappings: Map<string, IdMapping> = new Map();

export function addIdMapping(mapping: IdMapping): void {
  const key = `${mapping.type}:${mapping.wpId}`;
  idMappings.set(key, mapping);
}

export function getSupabaseId(wpId: number, type: IdMapping['type']): string | null {
  const key = `${type}:${wpId}`;
  const mapping = idMappings.get(key);
  return mapping?.supabaseId || null;
}

export function getAllMappings(): IdMapping[] {
  return Array.from(idMappings.values());
}

/**
 * Save mappings to file for later reference
 */
export async function saveMappingsToFile(): Promise<void> {
  const fs = await import('fs/promises');
  const outputPath = path.join(migrationSettings.outputDir, 'id-mappings.json');

  await fs.mkdir(migrationSettings.outputDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(getAllMappings(), null, 2)
  );

  log.info(`ID mappings saved to ${outputPath}`);
}

/**
 * Load mappings from file
 */
export async function loadMappingsFromFile(): Promise<void> {
  const fs = await import('fs/promises');
  const outputPath = path.join(migrationSettings.outputDir, 'id-mappings.json');

  try {
    const data = await fs.readFile(outputPath, 'utf-8');
    const mappings: IdMapping[] = JSON.parse(data);

    for (const mapping of mappings) {
      addIdMapping(mapping);
    }

    log.info(`Loaded ${mappings.length} ID mappings from file`);
  } catch (error) {
    log.warn('No existing ID mappings file found');
  }
}

// ============================================================
// MIGRATION RESULT TRACKING
// ============================================================

export interface MigrationResult {
  entity: string;
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ id: number | string; error: string }>;
  startTime: Date;
  endTime?: Date;
}

export function createMigrationResult(entity: string): MigrationResult {
  return {
    entity,
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    startTime: new Date(),
  };
}

export function finishMigrationResult(result: MigrationResult): MigrationResult {
  result.endTime = new Date();
  return result;
}

export async function saveMigrationReport(results: MigrationResult[]): Promise<void> {
  const fs = await import('fs/promises');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(migrationSettings.outputDir, `migration-report-${timestamp}.json`);

  await fs.mkdir(migrationSettings.outputDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    dryRun: migrationSettings.dryRun,
    results,
    summary: {
      totalMigrated: results.reduce((sum, r) => sum + r.migrated, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
    },
  };

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  log.success(`Migration report saved to ${outputPath}`);
}
