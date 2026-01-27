/**
 * Event Schedules Migration Script
 *
 * Migrates WordPress gps_schedule CPT data into the Supabase event_schedules table.
 *
 * WordPress structure:
 *   - CPT: gps_schedule
 *   - Meta: _gps_event_id (int), _gps_schedule_date (string),
 *           _gps_tab_label (string), _gps_schedule_topics (JSON)
 *   - Topics JSON: [{name, start_time, end_time, speakers: [post_ids], location, description}]
 *
 * Supabase target: event_schedules table
 *   - topics JSONB: [{name, start_time, end_time, speakers: [speaker_names], location, description}]
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-event-schedules.ts [--dry-run]
 */

import {
  supabase,
  getWpConnection,
  closeWpConnection,
  wpTablePrefix,
  migrationSettings,
  log,
  loadMappingsFromFile,
  getSupabaseId,
  createMigrationResult,
  finishMigrationResult,
  saveMigrationReport,
} from './config';
import path from 'path';
import fs from 'fs/promises';

// ============================================================
// TYPES
// ============================================================

interface WpSchedulePost {
  ID: number;
  post_title: string;
  post_status: string;
  post_date: Date;
  menu_order: number;
}

interface WpPostMeta {
  post_id: number;
  meta_key: string;
  meta_value: string;
}

interface WpTopicRaw {
  name?: string;
  start_time?: string;
  end_time?: string;
  speakers?: (number | string)[];
  location?: string;
  description?: string;
}

interface WpSpeaker {
  ID: number;
  post_title: string;
}

interface ScheduleData {
  wpId: number;
  wpEventId: number;
  scheduleDate: string;
  tabLabel: string;
  topics: WpTopicRaw[];
  displayOrder: number;
}

// ============================================================
// FETCH WORDPRESS SCHEDULES
// ============================================================

async function fetchWpSchedules(): Promise<ScheduleData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress schedules (gps_schedule CPT)...');

  // Get all schedule posts
  const [schedules] = await conn.execute<WpSchedulePost[]>(`
    SELECT ID, post_title, post_status, post_date, menu_order
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_schedule'
    AND post_status IN ('publish', 'draft', 'pending')
    ORDER BY ID ASC
  `);

  log.info(`Found ${schedules.length} schedule posts`);

  if (schedules.length === 0) return [];

  // Get all schedule meta
  const scheduleIds = schedules.map(s => s.ID);
  const [metaRows] = await conn.execute<WpPostMeta[]>(`
    SELECT post_id, meta_key, meta_value
    FROM ${wpTablePrefix}postmeta
    WHERE post_id IN (${scheduleIds.join(',')})
    AND meta_key IN (
      '_gps_event_id', '_gps_schedule_date',
      '_gps_tab_label', '_gps_schedule_topics'
    )
  `);

  // Group meta by schedule
  const metaBySchedule = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaBySchedule.has(meta.post_id)) {
      metaBySchedule.set(meta.post_id, {});
    }
    metaBySchedule.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  // Transform to ScheduleData
  const scheduleData: ScheduleData[] = [];

  for (const schedule of schedules) {
    const meta = metaBySchedule.get(schedule.ID) || {};

    const wpEventId = parseInt(meta['_gps_event_id'] || '0');
    if (!wpEventId) {
      log.warn(`Schedule ${schedule.ID} ("${schedule.post_title}") has no event_id, skipping`);
      continue;
    }

    const scheduleDate = meta['_gps_schedule_date'] || '';
    if (!scheduleDate) {
      log.warn(`Schedule ${schedule.ID} ("${schedule.post_title}") has no schedule_date, skipping`);
      continue;
    }

    // Parse topics JSON
    let topics: WpTopicRaw[] = [];
    try {
      const topicsJson = meta['_gps_schedule_topics'] || '[]';
      const parsed = JSON.parse(topicsJson);
      if (Array.isArray(parsed)) {
        topics = parsed;
      }
    } catch (err) {
      log.warn(`Schedule ${schedule.ID}: Failed to parse topics JSON`);
    }

    scheduleData.push({
      wpId: schedule.ID,
      wpEventId,
      scheduleDate,
      tabLabel: meta['_gps_tab_label'] || '',
      topics,
      displayOrder: schedule.menu_order || 0,
    });
  }

  return scheduleData;
}

// ============================================================
// FETCH WORDPRESS SPEAKERS (for name resolution)
// ============================================================

async function fetchWpSpeakerNames(): Promise<Map<number, string>> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress speaker names for ID resolution...');

  const [speakers] = await conn.execute<WpSpeaker[]>(`
    SELECT ID, post_title
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_speaker'
    AND post_status = 'publish'
    ORDER BY ID ASC
  `);

  const speakerMap = new Map<number, string>();
  for (const speaker of speakers) {
    speakerMap.set(speaker.ID, speaker.post_title);
  }

  log.info(`Loaded ${speakerMap.size} speaker names`);
  return speakerMap;
}

// ============================================================
// RESOLVE EVENT IDs (WP → Supabase)
// ============================================================

async function buildEventIdMap(): Promise<Map<number, string>> {
  // First try ID mappings from previous migration
  const eventMap = new Map<number, string>();

  // Also build a slug-based lookup from Supabase events
  const { data: supabaseEvents } = await supabase
    .from('events')
    .select('id, slug, strapi_id, title');

  if (supabaseEvents) {
    for (const event of supabaseEvents) {
      // If strapi_id is set, it might correspond to wp ID
      // But more reliably, use the ID mapping from config
    }
  }

  // Try to use saved ID mappings
  // getSupabaseId will work if loadMappingsFromFile was called
  // We'll also build a fallback by matching WP event slugs to Supabase slugs

  return eventMap;
}

async function resolveEventId(wpEventId: number): Promise<string | null> {
  // First try the ID mapping
  const mapped = getSupabaseId(wpEventId, 'event');
  if (mapped) return mapped;

  // Fallback: query WP for the event slug, then find it in Supabase
  const conn = await getWpConnection();
  const [rows] = await conn.execute<{ post_name: string }[]>(`
    SELECT post_name
    FROM ${wpTablePrefix}posts
    WHERE ID = ? AND post_type = 'gps_event'
    LIMIT 1
  `, [wpEventId]);

  if (rows.length === 0) return null;

  const slug = rows[0].post_name;
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .single();

  return data?.id || null;
}

// ============================================================
// CREATE SUPABASE SCHEDULE
// ============================================================

async function createSupabaseSchedule(
  eventId: string,
  schedule: ScheduleData,
  speakerNames: Map<number, string>,
  displayOrder: number
): Promise<string | null> {
  try {
    // Transform topics: convert speaker post IDs to speaker names
    const transformedTopics = schedule.topics.map(topic => {
      const speakerNameList: string[] = [];
      if (topic.speakers && Array.isArray(topic.speakers)) {
        for (const speakerId of topic.speakers) {
          const id = typeof speakerId === 'string' ? parseInt(speakerId) : speakerId;
          if (!isNaN(id) && id > 0) {
            const name = speakerNames.get(id);
            if (name) {
              speakerNameList.push(name);
            } else {
              log.warn(`  Speaker ID ${id} not found in WordPress`);
            }
          }
        }
      }

      return {
        name: topic.name || '',
        start_time: topic.start_time || '',
        end_time: topic.end_time || '',
        speakers: speakerNameList,
        location: topic.location || '',
        description: topic.description || '',
      };
    });

    const { data, error } = await supabase
      .from('event_schedules')
      .insert({
        event_id: eventId,
        schedule_date: schedule.scheduleDate,
        tab_label: schedule.tabLabel || null,
        topics: transformedTopics,
        display_order: displayOrder,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create schedule for event ${eventId}:`, error);
    return null;
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateEventSchedules(options: { dryRun?: boolean }): Promise<void> {
  const result = createMigrationResult('event_schedules');

  try {
    // Load existing ID mappings from previous migrations
    await loadMappingsFromFile();

    // Fetch WordPress data
    const schedules = await fetchWpSchedules();
    const speakerNames = await fetchWpSpeakerNames();

    result.total = schedules.length;

    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      log.info(`Would migrate: ${schedules.length} schedules`);

      // Group by event for display
      const byEvent = new Map<number, ScheduleData[]>();
      for (const s of schedules) {
        if (!byEvent.has(s.wpEventId)) byEvent.set(s.wpEventId, []);
        byEvent.get(s.wpEventId)!.push(s);
      }

      for (const [eventId, eventSchedules] of byEvent) {
        const supabaseId = await resolveEventId(eventId);
        log.info(`\n  WP Event ${eventId} → Supabase ${supabaseId || 'NOT FOUND'}`);
        for (const s of eventSchedules) {
          const speakerCount = s.topics.reduce((sum, t) => sum + (t.speakers?.length || 0), 0);
          log.info(`    - ${s.scheduleDate} (${s.tabLabel || 'no label'}) → ${s.topics.length} topics, ${speakerCount} speaker refs`);

          // Show speaker resolution
          for (const topic of s.topics) {
            if (topic.speakers && topic.speakers.length > 0) {
              const names = topic.speakers.map(id => {
                const numId = typeof id === 'string' ? parseInt(id) : id;
                return speakerNames.get(numId) || `UNKNOWN(${id})`;
              });
              log.info(`      "${topic.name}" → speakers: ${names.join(', ')}`);
            }
          }
        }
      }

      // Export for review
      const outputPath = path.join(migrationSettings.outputDir, 'event-schedules-export.json');
      await fs.mkdir(migrationSettings.outputDir, { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify({ schedules, speakerNames: Object.fromEntries(speakerNames) }, null, 2)
      );
      log.info(`\nData exported to ${outputPath}`);
      return;
    }

    // Group schedules by event for display_order assignment
    const byEvent = new Map<number, ScheduleData[]>();
    for (const s of schedules) {
      if (!byEvent.has(s.wpEventId)) byEvent.set(s.wpEventId, []);
      byEvent.get(s.wpEventId)!.push(s);
    }

    // Sort each event's schedules by date
    for (const [, eventSchedules] of byEvent) {
      eventSchedules.sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
    }

    // Migrate
    let processed = 0;
    for (const [wpEventId, eventSchedules] of byEvent) {
      const supabaseEventId = await resolveEventId(wpEventId);

      if (!supabaseEventId) {
        log.warn(`No Supabase event found for WP event ${wpEventId} — skipping ${eventSchedules.length} schedule(s)`);
        for (const s of eventSchedules) {
          result.skipped++;
          processed++;
          log.progress(processed, result.total, 'Schedules');
        }
        continue;
      }

      // Check if schedules already exist for this event
      const { data: existing } = await supabase
        .from('event_schedules')
        .select('id, schedule_date')
        .eq('event_id', supabaseEventId);

      const existingDates = new Set((existing || []).map(e => e.schedule_date));

      for (let i = 0; i < eventSchedules.length; i++) {
        const schedule = eventSchedules[i];
        processed++;
        log.progress(processed, result.total, 'Schedules');

        // Skip if already exists
        if (existingDates.has(schedule.scheduleDate)) {
          log.warn(`  Schedule for date ${schedule.scheduleDate} already exists for event ${supabaseEventId}, skipping`);
          result.skipped++;
          continue;
        }

        try {
          const displayOrder = schedule.displayOrder || (i + 1);
          const id = await createSupabaseSchedule(supabaseEventId, schedule, speakerNames, displayOrder);

          if (id) {
            result.migrated++;
            log.debug(`  Created schedule ${id} for event ${supabaseEventId} date ${schedule.scheduleDate}`);
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: schedule.wpId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Save report
    finishMigrationResult(result);
    await saveMigrationReport([result]);

    log.success(`
Migration complete:
  Event Schedules: ${result.migrated}/${result.total} (${result.skipped} skipped, ${result.failed} failed)
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

migrateEventSchedules(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });
