/**
 * User Migration Script
 *
 * Migrates WordPress users to Clerk and creates corresponding Supabase user records.
 *
 * Flow:
 * 1. Export users from WordPress (wp_users + wp_usermeta)
 * 2. Create users in Clerk (or generate import file for Clerk)
 * 3. Create user records in Supabase with Clerk ID mapping
 * 4. Store migration mapping for ticket/order linking
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-users.ts [--dry-run] [--export-only]
 */

import { Clerk } from '@clerk/clerk-sdk-node';
import {
  supabase,
  getWpConnection,
  closeWpConnection,
  wpTablePrefix,
  clerkConfig,
  migrationSettings,
  log,
  slugify,
  addIdMapping,
  saveMappingsToFile,
  loadMappingsFromFile,
  createMigrationResult,
  finishMigrationResult,
  saveMigrationReport,
  formatWpDate,
} from './config';
import path from 'path';
import fs from 'fs/promises';

// Initialize Clerk
const clerk = Clerk({ secretKey: clerkConfig.secretKey });

// ============================================================
// TYPES
// ============================================================

interface WpUser {
  ID: number;
  user_login: string;
  user_pass: string;
  user_nicename: string;
  user_email: string;
  user_url: string;
  user_registered: Date;
  user_status: number;
  display_name: string;
}

interface WpUserMeta {
  user_id: number;
  meta_key: string;
  meta_value: string;
}

interface UserData {
  wpId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  displayName: string;
  role: 'customer' | 'admin' | 'staff';
  registeredAt: string;
  passwordHash: string;
  metadata: Record<string, string>;
}

// ============================================================
// FETCH WORDPRESS USERS
// ============================================================

async function fetchWpUsers(): Promise<UserData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress users...');

  // Get all users
  const [users] = await conn.execute<WpUser[]>(`
    SELECT
      ID, user_login, user_pass, user_nicename, user_email,
      user_url, user_registered, user_status, display_name
    FROM ${wpTablePrefix}users
    WHERE user_email != ''
    ORDER BY ID ASC
  `);

  log.info(`Found ${users.length} users`);

  // Get all user meta
  const userIds = users.map(u => u.ID);
  if (userIds.length === 0) return [];

  const [metaRows] = await conn.execute<WpUserMeta[]>(`
    SELECT user_id, meta_key, meta_value
    FROM ${wpTablePrefix}usermeta
    WHERE user_id IN (${userIds.join(',')})
    AND meta_key IN (
      'first_name', 'last_name', 'billing_phone', 'shipping_phone',
      'billing_first_name', 'billing_last_name',
      '${wpTablePrefix}capabilities', 'wp_capabilities'
    )
  `);

  // Group meta by user
  const metaByUser = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaByUser.has(meta.user_id)) {
      metaByUser.set(meta.user_id, {});
    }
    metaByUser.get(meta.user_id)![meta.meta_key] = meta.meta_value;
  }

  // Transform users
  const userData: UserData[] = users.map(user => {
    const meta = metaByUser.get(user.ID) || {};

    // Determine role from capabilities
    const caps = meta[`${wpTablePrefix}capabilities`] || meta['wp_capabilities'] || '';
    let role: 'customer' | 'admin' | 'staff' = 'customer';
    if (caps.includes('administrator')) {
      role = 'admin';
    } else if (caps.includes('shop_manager') || caps.includes('editor')) {
      role = 'staff';
    }

    // Get name
    const firstName = meta['first_name'] || meta['billing_first_name'] || '';
    const lastName = meta['last_name'] || meta['billing_last_name'] || '';

    // Get phone
    const phone = meta['billing_phone'] || meta['shipping_phone'] || null;

    return {
      wpId: user.ID,
      email: user.user_email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : null,
      displayName: user.display_name,
      role,
      registeredAt: formatWpDate(user.user_registered) || new Date().toISOString(),
      passwordHash: user.user_pass,
      metadata: meta,
    };
  });

  return userData;
}

// ============================================================
// EXPORT FOR CLERK IMPORT
// ============================================================

async function exportForClerkImport(users: UserData[]): Promise<void> {
  const outputPath = path.join(migrationSettings.outputDir, 'clerk-import.json');
  await fs.mkdir(migrationSettings.outputDir, { recursive: true });

  // Clerk bulk import format
  const clerkUsers = users.map(user => ({
    external_id: `wp_${user.wpId}`,
    email_addresses: [
      {
        email_address: user.email,
        verified: true,
      },
    ],
    first_name: user.firstName || undefined,
    last_name: user.lastName || undefined,
    phone_numbers: user.phone
      ? [{ phone_number: user.phone, verified: false }]
      : undefined,
    public_metadata: {
      role: user.role,
      wp_user_id: user.wpId,
      migrated_from_wordpress: true,
    },
    created_at: new Date(user.registeredAt).getTime(),
    // Note: Password migration requires contacting Clerk support
    // for WordPress PHPass hash format support
    password_hasher: 'phpass',
    password_digest: user.passwordHash,
  }));

  await fs.writeFile(outputPath, JSON.stringify(clerkUsers, null, 2));
  log.success(`Exported ${users.length} users for Clerk import to ${outputPath}`);

  // Also create a CSV for manual review
  const csvPath = path.join(migrationSettings.outputDir, 'users-review.csv');
  const csvHeader = 'WP_ID,Email,First Name,Last Name,Phone,Role,Registered At\n';
  const csvRows = users
    .map(
      u =>
        `${u.wpId},"${u.email}","${u.firstName}","${u.lastName}","${u.phone || ''}","${u.role}","${u.registeredAt}"`
    )
    .join('\n');
  await fs.writeFile(csvPath, csvHeader + csvRows);
  log.success(`User review CSV saved to ${csvPath}`);
}

// ============================================================
// CREATE USERS IN CLERK (Interactive mode)
// ============================================================

async function createClerkUser(user: UserData): Promise<string | null> {
  try {
    // Check if user already exists by email
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [user.email],
    });

    // getUserList returns an array directly (not an object with .data)
    const usersList = Array.isArray(existingUsers) ? existingUsers : (existingUsers as { data?: unknown[] }).data || [];

    if (usersList.length > 0) {
      const existingUser = usersList[0] as { id: string; publicMetadata?: Record<string, unknown> };
      log.debug(`User already exists in Clerk: ${user.email} -> ${existingUser.id}`);

      // Update public metadata if needed
      await clerk.users.updateUser(existingUser.id, {
        publicMetadata: {
          ...existingUser.publicMetadata,
          role: user.role,
          wp_user_id: user.wpId,
          migrated_from_wordpress: true,
        },
      });

      return existingUser.id;
    }

    // Create new user in Clerk
    // Note: Password migration might require password reset flow
    const clerkUser = await clerk.users.createUser({
      emailAddress: [user.email],
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      publicMetadata: {
        role: user.role,
        wp_user_id: user.wpId,
        migrated_from_wordpress: true,
      },
      skipPasswordRequirement: true, // User will need to reset password
    });

    log.debug(`Created Clerk user: ${user.email} -> ${clerkUser.id}`);
    return clerkUser.id;
  } catch (error) {
    log.error(`Failed to create Clerk user ${user.email}:`, error);
    return null;
  }
}

// ============================================================
// CREATE USER IN SUPABASE
// ============================================================

async function createSupabaseUser(
  user: UserData,
  clerkId: string
): Promise<string | null> {
  try {
    // Check if user already exists by email or clerk_id
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${user.email},clerk_id.eq.${clerkId}`)
      .single();

    if (existing) {
      log.debug(`User already exists in Supabase: ${user.email} -> ${existing.id}`);
      return existing.id;
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email: user.email,
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        phone: user.phone,
        role: user.role,
        created_at: user.registeredAt,
      })
      .select('id')
      .single();

    if (error) throw error;

    log.debug(`Created Supabase user: ${user.email} -> ${data.id}`);
    return data.id;
  } catch (error) {
    log.error(`Failed to create Supabase user ${user.email}:`, error);
    return null;
  }
}

// ============================================================
// CREATE USER MIGRATION MAP ENTRY
// ============================================================

async function createMigrationMapEntry(
  wpUserId: number,
  clerkId: string,
  supabaseId: string,
  email: string
): Promise<void> {
  try {
    await supabase.from('user_migration_map').upsert(
      {
        wp_user_id: wpUserId,
        clerk_user_id: clerkId,
        supabase_user_id: supabaseId,
        email,
        migrated_at: new Date().toISOString(),
      },
      {
        onConflict: 'wp_user_id',
      }
    );
  } catch (error) {
    log.error(`Failed to create migration map entry for WP user ${wpUserId}:`, error);
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateUsers(options: {
  dryRun?: boolean;
  exportOnly?: boolean;
}): Promise<void> {
  const result = createMigrationResult('users');

  try {
    await loadMappingsFromFile();

    // Fetch WordPress users
    const users = await fetchWpUsers();
    result.total = users.length;

    // Export only mode
    if (options.exportOnly) {
      await exportForClerkImport(users);
      log.success('Export completed. Use the generated files for Clerk import.');
      return;
    }

    // Dry run mode
    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      await exportForClerkImport(users);
      log.info(`Would migrate ${users.length} users`);
      return;
    }

    // Process users
    log.info(`Starting migration of ${users.length} users...`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      log.progress(i + 1, users.length, 'Users');

      try {
        // Create in Clerk
        const clerkId = await createClerkUser(user);
        if (!clerkId) {
          result.failed++;
          result.errors.push({ id: user.wpId, error: 'Failed to create Clerk user' });
          continue;
        }

        // Create in Supabase
        const supabaseId = await createSupabaseUser(user, clerkId);
        if (!supabaseId) {
          result.failed++;
          result.errors.push({ id: user.wpId, error: 'Failed to create Supabase user' });
          continue;
        }

        // Create migration map entry
        await createMigrationMapEntry(user.wpId, clerkId, supabaseId, user.email);

        // Store ID mapping
        addIdMapping({
          wpId: user.wpId,
          supabaseId,
          type: 'user',
        });

        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: user.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Save mappings
    await saveMappingsToFile();

    // Report
    finishMigrationResult(result);
    await saveMigrationReport([result]);

    log.success(`
Migration complete:
  - Total: ${result.total}
  - Migrated: ${result.migrated}
  - Skipped: ${result.skipped}
  - Failed: ${result.failed}
    `);

    if (result.errors.length > 0) {
      log.warn('Errors occurred during migration:');
      for (const err of result.errors.slice(0, 10)) {
        log.warn(`  - WP User ${err.id}: ${err.error}`);
      }
      if (result.errors.length > 10) {
        log.warn(`  ... and ${result.errors.length - 10} more errors`);
      }
    }
  } finally {
    await closeWpConnection();
  }
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  exportOnly: args.includes('--export-only'),
};

migrateUsers(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });
