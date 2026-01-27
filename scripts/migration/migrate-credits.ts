/**
 * CE Credits, Certificates, and Waitlist Migration Script
 *
 * Migrates WordPress CE credits ledger, certificates, and waitlist to Supabase.
 *
 * Flow:
 * 1. Export CE credits from wp_gps_ce_ledger
 * 2. Export certificates from wp_gps_certificates
 * 3. Export waitlist from wp_gps_waitlist and wp_gps_seminar_waitlist
 * 4. Create records in Supabase
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-credits.ts [--dry-run]
 */

import {
  supabase,
  getWpConnection,
  closeWpConnection,
  wpTablePrefix,
  migrationSettings,
  log,
  formatWpDate,
  getSupabaseId,
  saveMappingsToFile,
  loadMappingsFromFile,
  createMigrationResult,
  finishMigrationResult,
  saveMigrationReport,
} from './config';
import path from 'path';
import fs from 'fs/promises';

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalize WordPress transaction_type values to Supabase valid values
 */
function normalizeTransactionType(wpType: string | null): 'earned' | 'adjustment' | 'revoked' {
  if (!wpType) return 'earned';

  const mapping: Record<string, 'earned' | 'adjustment' | 'revoked'> = {
    'earned': 'earned',
    'attendance': 'earned',      // Map attendance to earned
    'course_attendance': 'earned',
    'seminar_session': 'earned',
    'manual': 'adjustment',
    'adjustment': 'adjustment',
    'revoked': 'revoked',
  };

  return mapping[wpType.toLowerCase()] || 'earned';
}

// ============================================================
// TYPES
// ============================================================

interface CeLedgerEntry {
  wpId: number;
  userWpId: number;
  eventWpId: number | null;
  credits: number;
  source: string;
  transactionType: 'earned' | 'adjustment' | 'revoked';
  notes: string | null;
  awardedAt: string;
}

interface CertificateData {
  wpId: number;
  ticketWpId: number | null;
  userWpId: number;
  eventWpId: number;
  certificatePath: string | null;
  certificateUrl: string | null;
  generatedAt: string;
  sentAt: string | null;
}

interface WaitlistEntry {
  wpId: number;
  ticketTypeWpId: number;
  eventWpId: number;
  userWpId: number | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  position: number;
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'removed';
  notifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface SeminarWaitlistEntry {
  wpId: number;
  seminarWpId: number;
  userWpId: number | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  position: number;
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  notifiedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

// ============================================================
// FETCH CE LEDGER
// ============================================================

async function fetchCeLedger(): Promise<CeLedgerEntry[]> {
  const conn = await getWpConnection();

  log.info('Fetching CE credits ledger...');

  const [entries] = await conn.execute<{
    id: number;
    user_id: number;
    event_id: number | null;
    credits: number;
    source: string;
    transaction_type: string;
    notes: string | null;
    awarded_at: string;
  }[]>(`
    SELECT
      id, user_id, event_id, credits, source,
      transaction_type, notes, awarded_at
    FROM ${wpTablePrefix}gps_ce_ledger
    ORDER BY id ASC
  `);

  log.info(`Found ${entries.length} CE ledger entries`);

  return entries.map(entry => ({
    wpId: entry.id,
    userWpId: entry.user_id,
    eventWpId: entry.event_id,
    credits: entry.credits,
    source: entry.source || 'manual',
    transactionType: normalizeTransactionType(entry.transaction_type),
    notes: entry.notes,
    awardedAt: formatWpDate(entry.awarded_at) || new Date().toISOString(),
  }));
}

// ============================================================
// FETCH CERTIFICATES
// ============================================================

async function fetchCertificates(): Promise<CertificateData[]> {
  const conn = await getWpConnection();

  log.info('Fetching certificates...');

  const [certs] = await conn.execute<{
    id: number;
    ticket_id: number | null;
    user_id: number;
    event_id: number;
    certificate_path: string | null;
    certificate_url: string | null;
    generated_at: string;
    certificate_sent_at: string | null;
  }[]>(`
    SELECT
      id, ticket_id, user_id, event_id,
      certificate_path, certificate_url,
      generated_at, certificate_sent_at
    FROM ${wpTablePrefix}gps_certificates
    ORDER BY id ASC
  `);

  log.info(`Found ${certs.length} certificates`);

  return certs.map(cert => ({
    wpId: cert.id,
    ticketWpId: cert.ticket_id,
    userWpId: cert.user_id,
    eventWpId: cert.event_id,
    certificatePath: cert.certificate_path,
    certificateUrl: cert.certificate_url,
    generatedAt: formatWpDate(cert.generated_at) || new Date().toISOString(),
    sentAt: cert.certificate_sent_at ? formatWpDate(cert.certificate_sent_at) : null,
  }));
}

// ============================================================
// FETCH WAITLIST (Events)
// ============================================================

async function fetchEventWaitlist(): Promise<WaitlistEntry[]> {
  const conn = await getWpConnection();

  log.info('Fetching event waitlist...');

  const [entries] = await conn.execute<{
    id: number;
    ticket_type_id: number;
    event_id: number;
    user_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    position: number;
    status: string;
    notified_at: string | null;
    expires_at: string | null;
    created_at: string;
  }[]>(`
    SELECT
      id, ticket_type_id, event_id, user_id, email,
      first_name, last_name, phone, position, status,
      notified_at, expires_at, created_at
    FROM ${wpTablePrefix}gps_waitlist
    ORDER BY id ASC
  `);

  log.info(`Found ${entries.length} event waitlist entries`);

  return entries.map(entry => ({
    wpId: entry.id,
    ticketTypeWpId: entry.ticket_type_id,
    eventWpId: entry.event_id,
    userWpId: entry.user_id,
    email: entry.email,
    firstName: entry.first_name,
    lastName: entry.last_name,
    phone: entry.phone,
    position: entry.position,
    status: (entry.status || 'waiting') as WaitlistEntry['status'],
    notifiedAt: entry.notified_at ? formatWpDate(entry.notified_at) : null,
    expiresAt: entry.expires_at ? formatWpDate(entry.expires_at) : null,
    createdAt: formatWpDate(entry.created_at) || new Date().toISOString(),
  }));
}

// ============================================================
// FETCH SEMINAR WAITLIST
// ============================================================

async function fetchSeminarWaitlist(): Promise<SeminarWaitlistEntry[]> {
  const conn = await getWpConnection();

  log.info('Fetching seminar waitlist...');

  const [entries] = await conn.execute<{
    id: number;
    seminar_id: number;
    user_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    position: number;
    status: string;
    notified_at: string | null;
    expires_at: string | null;
    notes: string | null;
    created_at: string;
  }[]>(`
    SELECT
      id, seminar_id, user_id, email, first_name, last_name,
      phone, position, status, notified_at, expires_at,
      notes, created_at
    FROM ${wpTablePrefix}gps_seminar_waitlist
    ORDER BY id ASC
  `);

  log.info(`Found ${entries.length} seminar waitlist entries`);

  return entries.map(entry => ({
    wpId: entry.id,
    seminarWpId: entry.seminar_id,
    userWpId: entry.user_id,
    email: entry.email,
    firstName: entry.first_name,
    lastName: entry.last_name,
    phone: entry.phone,
    position: entry.position,
    status: (entry.status || 'waiting') as SeminarWaitlistEntry['status'],
    notifiedAt: entry.notified_at ? formatWpDate(entry.notified_at) : null,
    expiresAt: entry.expires_at ? formatWpDate(entry.expires_at) : null,
    notes: entry.notes,
    createdAt: formatWpDate(entry.created_at) || new Date().toISOString(),
  }));
}

// ============================================================
// CREATE IN SUPABASE
// ============================================================

async function createSupabaseCeLedgerEntry(
  entry: CeLedgerEntry,
  userSupabaseId: string,
  eventSupabaseId: string | null
): Promise<string | null> {
  try {
    // Map source to allowed values
    let source: 'course_attendance' | 'seminar_session' | 'manual' | 'adjustment' = 'manual';
    if (entry.source === 'auto' || entry.source === 'attendance') {
      source = 'course_attendance';
    } else if (entry.source === 'seminar') {
      source = 'seminar_session';
    } else if (entry.source === 'adjustment') {
      source = 'adjustment';
    }

    const { data, error } = await supabase
      .from('ce_ledger')
      .insert({
        user_id: userSupabaseId,
        event_id: eventSupabaseId,
        credits: entry.credits,
        source,
        transaction_type: entry.transactionType,
        notes: entry.notes,
        awarded_at: entry.awardedAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create CE ledger entry:`, error);
    return null;
  }
}

async function createSupabaseCertificate(
  cert: CertificateData,
  userSupabaseId: string,
  eventSupabaseId: string,
  ticketSupabaseId: string | null,
  attendeeName: string
): Promise<string | null> {
  try {
    // Generate certificate code
    const year = new Date(cert.generatedAt).getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certificateCode = `CERT-${year}-${randomPart}`;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        certificate_code: certificateCode,
        ticket_id: ticketSupabaseId,
        user_id: userSupabaseId,
        event_id: eventSupabaseId,
        attendee_name: attendeeName,
        pdf_url: cert.certificateUrl,
        generated_at: cert.generatedAt,
        sent_at: cert.sentAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create certificate:`, error);
    return null;
  }
}

async function createSupabaseWaitlistEntry(
  entry: WaitlistEntry,
  ticketTypeSupabaseId: string,
  eventSupabaseId: string,
  userSupabaseId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        ticket_type_id: ticketTypeSupabaseId,
        event_id: eventSupabaseId,
        user_id: userSupabaseId,
        email: entry.email,
        first_name: entry.firstName,
        last_name: entry.lastName,
        phone: entry.phone,
        position: entry.position,
        status: entry.status,
        notified_at: entry.notifiedAt,
        expires_at: entry.expiresAt,
        created_at: entry.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create waitlist entry:`, error);
    return null;
  }
}

// Note: Seminar waitlist would require a separate table or using the existing waitlist
// with a seminar_id column. For now, we'll log a warning.

// ============================================================
// GET USER INFO FOR CERTIFICATES
// ============================================================

async function getUserInfo(wpUserId: number): Promise<{ name: string } | null> {
  const conn = await getWpConnection();

  try {
    const [rows] = await conn.execute<{ display_name: string }[]>(`
      SELECT display_name
      FROM ${wpTablePrefix}users
      WHERE ID = ?
    `, [wpUserId]);

    if (rows.length > 0) {
      return { name: rows[0].display_name };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateCredits(options: { dryRun?: boolean }): Promise<void> {
  const results = [
    createMigrationResult('ce_ledger'),
    createMigrationResult('certificates'),
    createMigrationResult('waitlist'),
  ];

  try {
    await loadMappingsFromFile();

    // Fetch all data
    const ceLedger = await fetchCeLedger();
    const certificates = await fetchCertificates();
    const eventWaitlist = await fetchEventWaitlist();
    const seminarWaitlist = await fetchSeminarWaitlist();

    results[0].total = ceLedger.length;
    results[1].total = certificates.length;
    results[2].total = eventWaitlist.length + seminarWaitlist.length;

    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      log.info(`Would migrate: ${ceLedger.length} CE entries, ${certificates.length} certificates, ${eventWaitlist.length} event waitlist, ${seminarWaitlist.length} seminar waitlist`);

      const outputPath = path.join(migrationSettings.outputDir, 'credits-export.json');
      await fs.mkdir(migrationSettings.outputDir, { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify({ ceLedger, certificates, eventWaitlist, seminarWaitlist }, null, 2)
      );
      log.info(`Data exported to ${outputPath}`);
      return;
    }

    // Migrate CE Ledger
    log.info(`Migrating ${ceLedger.length} CE ledger entries...`);

    for (let i = 0; i < ceLedger.length; i++) {
      const entry = ceLedger[i];
      log.progress(i + 1, ceLedger.length, 'CE Ledger');

      try {
        const userSupabaseId = getSupabaseId(entry.userWpId, 'user');
        const eventSupabaseId = entry.eventWpId ? getSupabaseId(entry.eventWpId, 'event') : null;

        if (!userSupabaseId) {
          results[0].skipped++;
          continue;
        }

        const supabaseId = await createSupabaseCeLedgerEntry(entry, userSupabaseId, eventSupabaseId);
        if (supabaseId) {
          results[0].migrated++;
        } else {
          results[0].failed++;
        }
      } catch (error) {
        results[0].failed++;
        results[0].errors.push({
          id: entry.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate Certificates
    log.info(`Migrating ${certificates.length} certificates...`);

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      log.progress(i + 1, certificates.length, 'Certificates');

      try {
        const userSupabaseId = getSupabaseId(cert.userWpId, 'user');
        const eventSupabaseId = getSupabaseId(cert.eventWpId, 'event');
        const ticketSupabaseId = cert.ticketWpId ? getSupabaseId(cert.ticketWpId, 'ticket') : null;

        if (!userSupabaseId || !eventSupabaseId) {
          results[1].skipped++;
          continue;
        }

        // Get attendee name
        const userInfo = await getUserInfo(cert.userWpId);
        const attendeeName = userInfo?.name || 'Unknown Attendee';

        const supabaseId = await createSupabaseCertificate(
          cert,
          userSupabaseId,
          eventSupabaseId,
          ticketSupabaseId,
          attendeeName
        );

        if (supabaseId) {
          results[1].migrated++;
        } else {
          results[1].failed++;
        }
      } catch (error) {
        results[1].failed++;
        results[1].errors.push({
          id: cert.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate Event Waitlist
    log.info(`Migrating ${eventWaitlist.length} event waitlist entries...`);

    for (let i = 0; i < eventWaitlist.length; i++) {
      const entry = eventWaitlist[i];
      log.progress(i + 1, eventWaitlist.length, 'Event Waitlist');

      try {
        const ticketTypeSupabaseId = getSupabaseId(entry.ticketTypeWpId, 'ticket_type');
        const eventSupabaseId = getSupabaseId(entry.eventWpId, 'event');
        const userSupabaseId = entry.userWpId ? getSupabaseId(entry.userWpId, 'user') : null;

        if (!ticketTypeSupabaseId || !eventSupabaseId) {
          results[2].skipped++;
          continue;
        }

        const supabaseId = await createSupabaseWaitlistEntry(
          entry,
          ticketTypeSupabaseId,
          eventSupabaseId,
          userSupabaseId
        );

        if (supabaseId) {
          results[2].migrated++;
        } else {
          results[2].failed++;
        }
      } catch (error) {
        results[2].failed++;
        results[2].errors.push({
          id: entry.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log seminar waitlist (would need separate handling)
    if (seminarWaitlist.length > 0) {
      log.warn(`${seminarWaitlist.length} seminar waitlist entries found - these require separate migration handling`);
    }

    // Save report
    for (const result of results) {
      finishMigrationResult(result);
    }
    await saveMigrationReport(results);

    log.success(`
Migration complete:
  CE Ledger: ${results[0].migrated}/${results[0].total} (${results[0].failed} failed, ${results[0].skipped} skipped)
  Certificates: ${results[1].migrated}/${results[1].total} (${results[1].failed} failed, ${results[1].skipped} skipped)
  Waitlist: ${results[2].migrated}/${results[2].total} (${results[2].failed} failed, ${results[2].skipped} skipped)
    `);
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
};

migrateCredits(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });
