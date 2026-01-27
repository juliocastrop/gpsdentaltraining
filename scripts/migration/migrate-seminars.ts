/**
 * Seminars Migration Script
 *
 * Migrates WordPress gps_seminar posts and related data to Strapi and Supabase.
 *
 * Flow:
 * 1. Export seminars from WordPress (gps_seminar CPT + post meta)
 * 2. Export seminar sessions from wp_gps_seminar_sessions
 * 3. Export seminar registrations from wp_gps_seminar_registrations
 * 4. Export seminar attendance from wp_gps_seminar_attendance
 * 5. Create in Strapi (content) and Supabase (transactional)
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-seminars.ts [--dry-run]
 */

import {
  supabase,
  getWpConnection,
  closeWpConnection,
  wpTablePrefix,
  strapiConfig,
  migrationSettings,
  log,
  slugify,
  formatWpDate,
  formatTime,
  addIdMapping,
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
// TYPES
// ============================================================

interface WpSeminar {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_name: string;
  post_status: string;
  post_date: Date;
}

interface WpPostMeta {
  post_id: number;
  meta_key: string;
  meta_value: string;
}

interface SeminarData {
  wpId: number;
  title: string;
  slug: string;
  description: string;
  year: number;
  price: number;
  capacity: number;
  wcProductId: number | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
}

interface SeminarSessionData {
  wpId: number;
  seminarWpId: number;
  sessionNumber: number;
  sessionDate: string;
  timeStart: string | null;
  timeEnd: string | null;
  topic: string;
  description: string | null;
  capacity: number;
  registeredCount: number;
}

interface SeminarRegistrationData {
  wpId: number;
  userWpId: number;
  seminarWpId: number;
  orderWpId: number | null;
  registrationDate: string;
  startSessionDate: string | null;
  sessionsCompleted: number;
  sessionsRemaining: number;
  makeupUsed: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  qrCode: string | null;
  notes: string | null;
  createdAt: string;
}

interface SeminarAttendanceData {
  wpId: number;
  registrationWpId: number;
  sessionWpId: number;
  userWpId: number;
  seminarWpId: number;
  attended: boolean;
  checkedInAt: string;
  checkedInByWpId: number | null;
  isMakeup: boolean;
  creditsAwarded: number;
  notes: string | null;
}

// ============================================================
// FETCH WORDPRESS SEMINARS
// ============================================================

async function fetchWpSeminars(): Promise<SeminarData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress seminars...');

  const [seminars] = await conn.execute<WpSeminar[]>(`
    SELECT ID, post_title, post_content, post_excerpt, post_name, post_status, post_date
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_seminar'
    AND post_status IN ('publish', 'draft', 'pending')
    ORDER BY ID ASC
  `);

  log.info(`Found ${seminars.length} seminars`);

  if (seminars.length === 0) return [];

  const seminarIds = seminars.map(s => s.ID);
  const [metaRows] = await conn.execute<WpPostMeta[]>(`
    SELECT post_id, meta_key, meta_value
    FROM ${wpTablePrefix}postmeta
    WHERE post_id IN (${seminarIds.join(',')})
    AND meta_key IN (
      '_gps_seminar_year', '_gps_seminar_capacity', '_gps_seminar_product_id',
      '_gps_seminar_status', '_gps_seminar_tuition'
    )
  `);

  const metaBySeminar = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaBySeminar.has(meta.post_id)) {
      metaBySeminar.set(meta.post_id, {});
    }
    metaBySeminar.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  const seminarData: SeminarData[] = seminars.map(seminar => {
    const meta = metaBySeminar.get(seminar.ID) || {};

    let status: SeminarData['status'] = 'draft';
    const wpStatus = meta['_gps_seminar_status'] || '';
    if (wpStatus === 'active' || seminar.post_status === 'publish') status = 'active';
    else if (wpStatus === 'completed') status = 'completed';

    return {
      wpId: seminar.ID,
      title: seminar.post_title,
      slug: seminar.post_name || slugify(seminar.post_title),
      description: seminar.post_content,
      year: parseInt(meta['_gps_seminar_year'] || new Date().getFullYear().toString()),
      price: parseFloat(meta['_gps_seminar_tuition'] || '750'),
      capacity: parseInt(meta['_gps_seminar_capacity'] || '50'),
      wcProductId: meta['_gps_seminar_product_id'] ? parseInt(meta['_gps_seminar_product_id']) : null,
      status,
      createdAt: formatWpDate(seminar.post_date) || new Date().toISOString(),
    };
  });

  return seminarData;
}

// ============================================================
// FETCH SEMINAR SESSIONS
// ============================================================

async function fetchWpSeminarSessions(): Promise<SeminarSessionData[]> {
  const conn = await getWpConnection();

  log.info('Fetching seminar sessions...');

  const [sessions] = await conn.execute<{
    id: number;
    seminar_id: number;
    session_number: number;
    session_date: string;
    session_time_start: string;
    session_time_end: string;
    topic: string;
    description: string;
    capacity: number;
    registered_count: number;
  }[]>(`
    SELECT
      id, seminar_id, session_number, session_date,
      session_time_start, session_time_end, topic,
      description, capacity, registered_count
    FROM ${wpTablePrefix}gps_seminar_sessions
    ORDER BY seminar_id, session_number ASC
  `);

  log.info(`Found ${sessions.length} seminar sessions`);

  return sessions.map(session => ({
    wpId: session.id,
    seminarWpId: session.seminar_id,
    sessionNumber: session.session_number,
    sessionDate: session.session_date,
    timeStart: formatTime(session.session_time_start),
    timeEnd: formatTime(session.session_time_end),
    topic: session.topic,
    description: session.description || null,
    capacity: session.capacity || 50,
    registeredCount: session.registered_count || 0,
  }));
}

// ============================================================
// FETCH SEMINAR REGISTRATIONS
// ============================================================

async function fetchWpSeminarRegistrations(): Promise<SeminarRegistrationData[]> {
  const conn = await getWpConnection();

  log.info('Fetching seminar registrations...');

  const [registrations] = await conn.execute<{
    id: number;
    user_id: number;
    seminar_id: number;
    order_id: number | null;
    registration_date: string;
    start_session_date: string | null;
    sessions_completed: number;
    sessions_remaining: number;
    makeup_used: number;
    status: string;
    qr_code: string | null;
    qr_code_path: string | null;
    qr_scan_count: number;
    notes: string | null;
  }[]>(`
    SELECT
      id, user_id, seminar_id, order_id, registration_date,
      start_session_date, sessions_completed, sessions_remaining,
      makeup_used, status, qr_code, qr_code_path, qr_scan_count, notes
    FROM ${wpTablePrefix}gps_seminar_registrations
    ORDER BY id ASC
  `);

  log.info(`Found ${registrations.length} seminar registrations`);

  return registrations.map(reg => ({
    wpId: reg.id,
    userWpId: reg.user_id,
    seminarWpId: reg.seminar_id,
    orderWpId: reg.order_id,
    registrationDate: reg.registration_date,
    startSessionDate: reg.start_session_date,
    sessionsCompleted: reg.sessions_completed || 0,
    sessionsRemaining: reg.sessions_remaining || 10,
    makeupUsed: reg.makeup_used === 1,
    status: (reg.status || 'active') as SeminarRegistrationData['status'],
    qrCode: reg.qr_code,
    notes: reg.notes,
    createdAt: formatWpDate(reg.registration_date) || new Date().toISOString(),
  }));
}

// ============================================================
// FETCH SEMINAR ATTENDANCE
// ============================================================

async function fetchWpSeminarAttendance(): Promise<SeminarAttendanceData[]> {
  const conn = await getWpConnection();

  log.info('Fetching seminar attendance...');

  const [attendance] = await conn.execute<{
    id: number;
    registration_id: number;
    session_id: number;
    user_id: number;
    seminar_id: number;
    attended: number;
    checked_in_at: string;
    checked_in_by: number | null;
    is_makeup: number;
    credits_awarded: number;
    notes: string | null;
  }[]>(`
    SELECT
      id, registration_id, session_id, user_id, seminar_id,
      attended, checked_in_at, checked_in_by, is_makeup,
      credits_awarded, notes
    FROM ${wpTablePrefix}gps_seminar_attendance
    ORDER BY id ASC
  `);

  log.info(`Found ${attendance.length} attendance records`);

  return attendance.map(att => ({
    wpId: att.id,
    registrationWpId: att.registration_id,
    sessionWpId: att.session_id,
    userWpId: att.user_id,
    seminarWpId: att.seminar_id,
    attended: att.attended === 1,
    checkedInAt: formatWpDate(att.checked_in_at) || new Date().toISOString(),
    checkedInByWpId: att.checked_in_by,
    isMakeup: att.is_makeup === 1,
    creditsAwarded: att.credits_awarded || 2,
    notes: att.notes,
  }));
}

// ============================================================
// CREATE IN STRAPI
// ============================================================

async function createStrapiSeminar(seminar: SeminarData): Promise<number | null> {
  try {
    const response = await fetch(`${strapiConfig.url}/api/seminars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strapiConfig.apiToken}`,
      },
      body: JSON.stringify({
        data: {
          title: seminar.title,
          slug: seminar.slug,
          description: seminar.description,
          year: seminar.year,
          price: seminar.price,
          capacity: seminar.capacity,
          totalSessions: 10,
          creditsPerSession: 2,
          publishedAt: seminar.status === 'active' ? new Date().toISOString() : null,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.error(`Strapi error for seminar ${seminar.wpId}:`, error);
      return null;
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    log.error(`Failed to create Strapi seminar ${seminar.title}:`, error);
    return null;
  }
}

// ============================================================
// CREATE IN SUPABASE
// ============================================================

async function createSupabaseSeminar(
  seminar: SeminarData,
  strapiId: number | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('seminars')
      .insert({
        strapi_id: strapiId,
        title: seminar.title,
        slug: seminar.slug,
        year: seminar.year,
        description: seminar.description,
        price: seminar.price,
        capacity: seminar.capacity,
        total_sessions: 10,
        status: seminar.status,
        created_at: seminar.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create Supabase seminar ${seminar.title}:`, error);
    return null;
  }
}

async function createSupabaseSeminarSession(
  session: SeminarSessionData,
  seminarSupabaseId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('seminar_sessions')
      .insert({
        seminar_id: seminarSupabaseId,
        session_number: session.sessionNumber,
        session_date: session.sessionDate,
        session_time_start: session.timeStart,
        session_time_end: session.timeEnd,
        topic: session.topic,
        description: session.description,
        capacity: session.capacity,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create seminar session:`, error);
    return null;
  }
}

async function createSupabaseSeminarRegistration(
  registration: SeminarRegistrationData,
  seminarSupabaseId: string,
  userSupabaseId: string | null,
  orderSupabaseId: string | null
): Promise<string | null> {
  if (!userSupabaseId) {
    log.warn(`No user found for registration ${registration.wpId}`);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('seminar_registrations')
      .insert({
        user_id: userSupabaseId,
        seminar_id: seminarSupabaseId,
        order_id: orderSupabaseId,
        registration_date: registration.registrationDate,
        start_session_date: registration.startSessionDate,
        sessions_completed: registration.sessionsCompleted,
        sessions_remaining: registration.sessionsRemaining,
        makeup_used: registration.makeupUsed,
        status: registration.status,
        qr_code: registration.qrCode,
        notes: registration.notes,
        created_at: registration.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create seminar registration:`, error);
    return null;
  }
}

async function createSupabaseSeminarAttendance(
  attendance: SeminarAttendanceData,
  registrationSupabaseId: string,
  sessionSupabaseId: string,
  userSupabaseId: string,
  seminarSupabaseId: string,
  checkedInBySupabaseId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('seminar_attendance')
      .insert({
        registration_id: registrationSupabaseId,
        session_id: sessionSupabaseId,
        user_id: userSupabaseId,
        seminar_id: seminarSupabaseId,
        is_makeup: attendance.isMakeup,
        credits_awarded: attendance.creditsAwarded,
        checked_in_at: attendance.checkedInAt,
        checked_in_by: checkedInBySupabaseId,
        notes: attendance.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create seminar attendance:`, error);
    return null;
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateSeminars(options: { dryRun?: boolean }): Promise<void> {
  const results = [
    createMigrationResult('seminars'),
    createMigrationResult('seminar_sessions'),
    createMigrationResult('seminar_registrations'),
    createMigrationResult('seminar_attendance'),
  ];

  try {
    await loadMappingsFromFile();

    // Fetch all data
    const seminars = await fetchWpSeminars();
    const sessions = await fetchWpSeminarSessions();
    const registrations = await fetchWpSeminarRegistrations();
    const attendance = await fetchWpSeminarAttendance();

    results[0].total = seminars.length;
    results[1].total = sessions.length;
    results[2].total = registrations.length;
    results[3].total = attendance.length;

    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      log.info(`Would migrate: ${seminars.length} seminars, ${sessions.length} sessions, ${registrations.length} registrations, ${attendance.length} attendance records`);

      const outputPath = path.join(migrationSettings.outputDir, 'seminars-export.json');
      await fs.mkdir(migrationSettings.outputDir, { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify({ seminars, sessions, registrations, attendance }, null, 2)
      );
      log.info(`Data exported to ${outputPath}`);
      return;
    }

    // ID mappings
    const seminarIdMap = new Map<number, string>();
    const sessionIdMap = new Map<number, string>();
    const registrationIdMap = new Map<number, string>();

    // Migrate seminars
    log.info(`Migrating ${seminars.length} seminars...`);

    for (let i = 0; i < seminars.length; i++) {
      const seminar = seminars[i];
      log.progress(i + 1, seminars.length, 'Seminars');

      try {
        const strapiId = await createStrapiSeminar(seminar);
        const supabaseId = await createSupabaseSeminar(seminar, strapiId);

        if (supabaseId) {
          seminarIdMap.set(seminar.wpId, supabaseId);
          addIdMapping({ wpId: seminar.wpId, supabaseId, type: 'seminar' });
          results[0].migrated++;
        } else {
          results[0].failed++;
        }
      } catch (error) {
        results[0].failed++;
        results[0].errors.push({
          id: seminar.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate sessions
    log.info(`Migrating ${sessions.length} seminar sessions...`);

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      log.progress(i + 1, sessions.length, 'Sessions');

      try {
        const seminarSupabaseId = seminarIdMap.get(session.seminarWpId);
        if (!seminarSupabaseId) {
          results[1].skipped++;
          continue;
        }

        const supabaseId = await createSupabaseSeminarSession(session, seminarSupabaseId);
        if (supabaseId) {
          sessionIdMap.set(session.wpId, supabaseId);
          results[1].migrated++;
        } else {
          results[1].failed++;
        }
      } catch (error) {
        results[1].failed++;
        results[1].errors.push({
          id: session.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate registrations
    log.info(`Migrating ${registrations.length} seminar registrations...`);

    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      log.progress(i + 1, registrations.length, 'Registrations');

      try {
        const seminarSupabaseId = seminarIdMap.get(reg.seminarWpId);
        const userSupabaseId = getSupabaseId(reg.userWpId, 'user');
        const orderSupabaseId = reg.orderWpId ? getSupabaseId(reg.orderWpId, 'order') : null;

        if (!seminarSupabaseId) {
          results[2].skipped++;
          continue;
        }

        const supabaseId = await createSupabaseSeminarRegistration(
          reg,
          seminarSupabaseId,
          userSupabaseId,
          orderSupabaseId
        );

        if (supabaseId) {
          registrationIdMap.set(reg.wpId, supabaseId);
          results[2].migrated++;
        } else {
          results[2].failed++;
        }
      } catch (error) {
        results[2].failed++;
        results[2].errors.push({
          id: reg.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate attendance
    log.info(`Migrating ${attendance.length} attendance records...`);

    for (let i = 0; i < attendance.length; i++) {
      const att = attendance[i];
      log.progress(i + 1, attendance.length, 'Attendance');

      try {
        const registrationSupabaseId = registrationIdMap.get(att.registrationWpId);
        const sessionSupabaseId = sessionIdMap.get(att.sessionWpId);
        const userSupabaseId = getSupabaseId(att.userWpId, 'user');
        const seminarSupabaseId = seminarIdMap.get(att.seminarWpId);
        const checkedInBySupabaseId = att.checkedInByWpId
          ? getSupabaseId(att.checkedInByWpId, 'user')
          : null;

        if (!registrationSupabaseId || !sessionSupabaseId || !userSupabaseId || !seminarSupabaseId) {
          results[3].skipped++;
          continue;
        }

        const supabaseId = await createSupabaseSeminarAttendance(
          att,
          registrationSupabaseId,
          sessionSupabaseId,
          userSupabaseId,
          seminarSupabaseId,
          checkedInBySupabaseId
        );

        if (supabaseId) {
          results[3].migrated++;
        } else {
          results[3].failed++;
        }
      } catch (error) {
        results[3].failed++;
        results[3].errors.push({
          id: att.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Save mappings and report
    await saveMappingsToFile();

    for (const result of results) {
      finishMigrationResult(result);
    }
    await saveMigrationReport(results);

    log.success(`
Migration complete:
  Seminars: ${results[0].migrated}/${results[0].total} (${results[0].failed} failed)
  Sessions: ${results[1].migrated}/${results[1].total} (${results[1].failed} failed)
  Registrations: ${results[2].migrated}/${results[2].total} (${results[2].failed} failed, ${results[2].skipped} skipped)
  Attendance: ${results[3].migrated}/${results[3].total} (${results[3].failed} failed, ${results[3].skipped} skipped)
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

migrateSeminars(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });
