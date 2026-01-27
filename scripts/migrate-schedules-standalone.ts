/**
 * Standalone script: Migrate events.schedule_topics → event_schedules table
 * Reads from Supabase only (no WordPress MySQL needed)
 *
 * Usage: npx tsx scripts/migrate-schedules-standalone.ts [--dry-run] [--force]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

interface OldScheduleTopic {
  day: number;
  time: string;
  topic: string;
  description?: string;
}

interface NewFormatSchedule {
  date: string;
  tab_label?: string;
  topics: Array<{
    name: string;
    start_time: string;
    end_time: string;
    speakers: string[];
    location: string;
    description: string;
  }>;
}

type ScheduleFormat = 'old' | 'new' | 'none';

function parseTimeToHHMM(timeStr: string): string {
  if (!timeStr) return '';
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr.padStart(5, '0');

  const ampm = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/);
  if (ampm) {
    let hours = parseInt(ampm[1]);
    const mins = ampm[2];
    const period = ampm[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }

  const hourOnly = timeStr.match(/^(\d{1,2})$/);
  if (hourOnly) return `${hourOnly[1].padStart(2, '0')}:00`;

  const range = timeStr.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/);
  if (range) return parseTimeToHHMM(range[1].trim());

  return '';
}

function parseEndTime(timeStr: string): string {
  if (!timeStr) return '';
  const range = timeStr.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/);
  if (range) return parseTimeToHHMM(range[2].trim());
  return '';
}

function detectFormat(scheduleTopics: unknown): ScheduleFormat {
  if (!scheduleTopics) return 'none';
  // Old format: array of { day, time, topic }
  if (Array.isArray(scheduleTopics)) {
    const hasTopics = scheduleTopics.some((t: any) => t && (t.topic || t.time));
    return hasTopics ? 'old' : 'none';
  }
  // New format: object with { schedules: [...], objectives?: [...] }
  if (typeof scheduleTopics === 'object' && scheduleTopics !== null) {
    const obj = scheduleTopics as Record<string, unknown>;
    if (obj.schedules && Array.isArray(obj.schedules) && (obj.schedules as any[]).length > 0) {
      return 'new';
    }
  }
  return 'none';
}

function extractOldTopics(scheduleTopics: unknown): OldScheduleTopic[] {
  if (!scheduleTopics) return [];
  if (Array.isArray(scheduleTopics)) {
    return scheduleTopics.filter((t: any) => t && (t.topic || t.time));
  }
  return [];
}

function extractNewSchedules(scheduleTopics: unknown): NewFormatSchedule[] {
  if (!scheduleTopics || typeof scheduleTopics !== 'object') return [];
  const obj = scheduleTopics as Record<string, unknown>;
  if (!obj.schedules || !Array.isArray(obj.schedules)) return [];
  return (obj.schedules as any[]).filter((s: any) => s && s.date && Array.isArray(s.topics) && s.topics.length > 0);
}

async function main() {
  console.log('=== Migrate schedule_topics -> event_schedules ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}${force ? ' (FORCE)' : ''}\n`);

  // Fetch all events
  const { data: allEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title, slug, start_date, end_date, schedule_topics')
    .order('start_date', { ascending: true });

  if (eventsError) {
    console.error('Failed to fetch events:', eventsError.message);
    process.exit(1);
  }

  const events = (allEvents || []).filter((e: any) => {
    if (!e.schedule_topics) return false;
    if (Array.isArray(e.schedule_topics) && e.schedule_topics.length === 0) return false;
    return true;
  });

  console.log(`Found ${allEvents?.length || 0} total events, ${events.length} with schedule_topics\n`);

  if (events.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  // Check existing schedules
  const { data: existingSchedules, error: schedulesError } = await supabase
    .from('event_schedules')
    .select('event_id, id');

  if (schedulesError) {
    console.error('Could not query event_schedules:', schedulesError.message);
    console.error('Make sure migration 012_event_schedules_and_soldout.sql has been applied.');
    process.exit(1);
  }

  const existingByEvent = new Map<string, number>();
  if (existingSchedules) {
    for (const s of existingSchedules) {
      existingByEvent.set(s.event_id, (existingByEvent.get(s.event_id) || 0) + 1);
    }
  }

  console.log(`Existing event_schedules records: ${existingSchedules?.length || 0}\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    const format = detectFormat(event.schedule_topics);

    if (format === 'none') {
      console.log(`  SKIP: "${event.title}" - no valid schedule data`);
      skipped++;
      continue;
    }

    const existingCount = existingByEvent.get(event.id) || 0;

    if (!force && existingCount > 0) {
      console.log(`  SKIP: "${event.title}" - already has ${existingCount} schedule(s)`);
      skipped++;
      continue;
    }

    console.log(`\n  EVENT: "${event.title}" [format: ${format}]`);

    // Force: delete existing
    if (force && existingCount > 0) {
      if (!dryRun) {
        const { error: delError } = await supabase
          .from('event_schedules')
          .delete()
          .eq('event_id', event.id);
        if (delError) {
          console.error(`    ERROR deleting existing: ${delError.message}`);
          errors++;
          continue;
        }
      }
      console.log(`    Deleted ${existingCount} existing schedule(s)`);
    }

    // ---- NEW FORMAT: { schedules: [{ date, topics: [{ name, start_time, ... }] }] } ----
    if (format === 'new') {
      const schedules = extractNewSchedules(event.schedule_topics);
      const totalTopics = schedules.reduce((sum, s) => sum + s.topics.length, 0);
      console.log(`    ${totalTopics} topics across ${schedules.length} day(s)`);

      if (dryRun) {
        for (let i = 0; i < schedules.length; i++) {
          const s = schedules[i];
          console.log(`    Day ${i + 1} (${s.date}): ${s.topics.length} topics`);
          for (const t of s.topics) {
            console.log(`      - ${t.start_time}-${t.end_time} "${t.name}"`);
          }
        }
        migrated++;
        continue;
      }

      let daysMigrated = 0;
      let topicsMigrated = 0;

      for (let i = 0; i < schedules.length; i++) {
        const s = schedules[i];
        const { error: insertError } = await supabase
          .from('event_schedules')
          .insert({
            event_id: event.id,
            schedule_date: s.date,
            tab_label: schedules.length > 1 ? (s.tab_label || `Day ${i + 1}`) : null,
            topics: s.topics,
            display_order: i + 1,
          });

        if (insertError) {
          console.error(`    ERROR Day ${i + 1}: ${insertError.message}`);
          errors++;
          continue;
        }

        daysMigrated++;
        topicsMigrated += s.topics.length;
      }

      console.log(`    OK: Created ${daysMigrated} day(s), ${topicsMigrated} topics`);
      migrated++;
      continue;
    }

    // ---- OLD FORMAT: [{ day, time, topic, description }] ----
    const topics = extractOldTopics(event.schedule_topics);
    console.log(`    ${topics.length} topics`);

    // Group by day
    const byDay = new Map<number, OldScheduleTopic[]>();
    for (const t of topics) {
      const day = t.day || 1;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(t);
    }
    const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]);

    console.log(`    ${topics.length} topics across ${sortedDays.length} day(s)`);

    if (dryRun) {
      for (const [dayNum, dayTopics] of sortedDays) {
        console.log(`    Day ${dayNum}: ${dayTopics.length} topics`);
        for (const t of dayTopics) {
          console.log(`      - ${t.time || '?'} "${t.topic}" -> start: ${parseTimeToHHMM(t.time)}, end: ${parseEndTime(t.time)}`);
        }
      }
      migrated++;
      continue;
    }

    let daysMigrated = 0;
    let topicsMigrated = 0;

    for (const [dayNum, dayTopics] of sortedDays) {
      let scheduleDate = event.start_date?.split('T')[0] || '';
      if (scheduleDate && dayNum > 1) {
        const d = new Date(scheduleDate + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() + (dayNum - 1));
        scheduleDate = d.toISOString().split('T')[0];
      }

      const newTopics = dayTopics.map((t: OldScheduleTopic) => ({
        name: t.topic || '',
        start_time: parseTimeToHHMM(t.time),
        end_time: parseEndTime(t.time),
        speakers: [] as string[],
        location: '',
        description: t.description || '',
      }));

      const { error: insertError } = await supabase
        .from('event_schedules')
        .insert({
          event_id: event.id,
          schedule_date: scheduleDate,
          tab_label: sortedDays.length > 1 ? `Day ${dayNum}` : null,
          topics: newTopics,
          display_order: dayNum,
        });

      if (insertError) {
        console.error(`    ERROR Day ${dayNum}: ${insertError.message}`);
        errors++;
        continue;
      }

      daysMigrated++;
      topicsMigrated += newTopics.length;
    }

    console.log(`    OK: Created ${daysMigrated} day(s), ${topicsMigrated} topics`);
    migrated++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);

  if (dryRun) {
    console.log('\n  (DRY RUN - no changes made)');
    console.log('  Run without --dry-run to execute.');
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
