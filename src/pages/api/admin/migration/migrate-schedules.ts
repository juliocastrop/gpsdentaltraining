/**
 * Admin Migration Endpoint: Migrate schedule_topics → event_schedules
 *
 * This endpoint reads the simplified schedule_topics JSONB from the events table
 * and creates proper records in the event_schedules table.
 *
 * Usage:
 *   GET /api/admin/migration/migrate-schedules          → Dry run (preview)
 *   POST /api/admin/migration/migrate-schedules         → Execute migration
 *   POST /api/admin/migration/migrate-schedules?force=1 → Force (even if event_schedules has data)
 *
 * The old schedule_topics format (on events table):
 *   [{ day: 1, time: "8:00 AM", topic: "Registration", description?: "..." }]
 *
 * The new event_schedules format:
 *   { event_id, schedule_date, tab_label, display_order, topics: [{ name, start_time, end_time, speakers: [], location, description }] }
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

interface OldScheduleTopic {
  day: number;
  time: string;
  topic: string;
  description?: string;
}

interface NewTopicItem {
  name: string;
  start_time: string;
  end_time: string;
  speakers: string[];
  location: string;
  description: string;
}

/**
 * Extract OldScheduleTopic[] from schedule_topics which could be:
 * - An array of { day, time, topic, description }
 * - An object { objectives: [], schedules: [] } (already migrated format)
 * - null/undefined
 */
function extractOldTopics(scheduleTopics: unknown): OldScheduleTopic[] {
  if (!scheduleTopics) return [];

  // If it's already an array, treat as OldScheduleTopic[]
  if (Array.isArray(scheduleTopics)) {
    return scheduleTopics.filter(t => t && (t.topic || t.time));
  }

  // If it's an object with 'schedules' key, it's already in new format - skip
  if (typeof scheduleTopics === 'object' && scheduleTopics !== null) {
    const obj = scheduleTopics as Record<string, unknown>;
    if (obj.schedules || obj.objectives) {
      return []; // Already migrated format, nothing to migrate
    }
  }

  return [];
}

/**
 * Parse a time string like "8:00 AM", "8:30am", "14:00" into HH:MM format
 */
function parseTimeToHHMM(timeStr: string): string {
  if (!timeStr) return '';

  // Already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr.padStart(5, '0');

  // Try "8:00 AM" / "8:30am" format
  const ampm = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/);
  if (ampm) {
    let hours = parseInt(ampm[1]);
    const mins = ampm[2];
    const period = ampm[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }

  // Try just a number like "8" or "14"
  const hourOnly = timeStr.match(/^(\d{1,2})$/);
  if (hourOnly) {
    return `${hourOnly[1].padStart(2, '0')}:00`;
  }

  // Try time ranges like "8:00 AM - 9:00 AM" (return start time)
  const range = timeStr.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/);
  if (range) {
    return parseTimeToHHMM(range[1].trim());
  }

  return '';
}

/**
 * Try to extract end time from a time range string like "8:00 AM - 9:00 AM"
 */
function parseEndTime(timeStr: string): string {
  if (!timeStr) return '';

  const range = timeStr.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/);
  if (range) {
    return parseTimeToHHMM(range[2].trim());
  }

  return '';
}

// ============================================================
// GET: Dry run / preview
// ============================================================
export const GET: APIRoute = async () => {
  try {
    // Fetch all events (filter schedule_topics in JS to avoid PostgREST filter issues)
    const { data: allEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, slug, start_date, end_date, schedule_topics')
      .order('start_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Filter to only events that have schedule_topics data
    const events = (allEvents || []).filter(e => {
      if (!e.schedule_topics) return false;
      if (Array.isArray(e.schedule_topics) && e.schedule_topics.length === 0) return false;
      return true;
    });

    // Check what's already in event_schedules
    const existingByEvent = new Map<string, number>();
    const { data: existingSchedules, error: schedulesError } = await supabaseAdmin
      .from('event_schedules')
      .select('event_id, id');

    // If table doesn't exist, just skip (no existing schedules)
    if (schedulesError) {
      console.warn('Could not query event_schedules (table may not exist):', schedulesError.message);
    } else if (existingSchedules) {
      for (const s of existingSchedules) {
        existingByEvent.set(s.event_id, (existingByEvent.get(s.event_id) || 0) + 1);
      }
    }

    const preview = (events || []).map(event => {
      const topics = extractOldTopics(event.schedule_topics);
      const existingCount = existingByEvent.get(event.id) || 0;

      // Group by day number
      const byDay = new Map<number, OldScheduleTopic[]>();
      for (const t of topics) {
        const day = t.day || 1;
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(t);
      }

      return {
        event_id: event.id,
        title: event.title,
        slug: event.slug,
        start_date: event.start_date,
        total_old_topics: topics.length,
        days_to_create: byDay.size,
        existing_schedules: existingCount,
        will_skip: existingCount > 0,
        days: Array.from(byDay.entries()).map(([day, dayTopics]) => ({
          day,
          topics: dayTopics.map(t => ({
            time: t.time,
            topic: t.topic,
            parsed_start: parseTimeToHHMM(t.time),
            parsed_end: parseEndTime(t.time),
          })),
        })),
      };
    });

    const willMigrate = preview.filter(p => !p.will_skip);
    const willSkip = preview.filter(p => p.will_skip);

    return new Response(
      JSON.stringify({
        success: true,
        message: `DRY RUN: Found ${events?.length || 0} events with schedule_topics`,
        summary: {
          total_events_with_topics: events?.length || 0,
          will_migrate: willMigrate.length,
          will_skip: willSkip.length,
          total_days_to_create: willMigrate.reduce((sum, p) => sum + p.days_to_create, 0),
          total_topics: willMigrate.reduce((sum, p) => sum + p.total_old_topics, 0),
        },
        preview,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration preview error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to preview migration',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================
// POST: Execute migration
// ============================================================
export const POST: APIRoute = async ({ url }) => {
  try {
    const force = url.searchParams.get('force') === '1';

    // Fetch all events (filter schedule_topics in JS to avoid PostgREST filter issues)
    const { data: allEventsPost, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, slug, start_date, end_date, schedule_topics')
      .order('start_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Filter to only events that have schedule_topics data
    const events = (allEventsPost || []).filter(e => {
      if (!e.schedule_topics) return false;
      if (Array.isArray(e.schedule_topics) && e.schedule_topics.length === 0) return false;
      return true;
    });

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No events with schedule_topics found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check existing schedules
    const { data: existingSchedules } = await supabaseAdmin
      .from('event_schedules')
      .select('event_id');

    const eventsWithSchedules = new Set<string>();
    if (existingSchedules) {
      for (const s of existingSchedules) {
        eventsWithSchedules.add(s.event_id);
      }
    }

    // Fetch all speakers for name lookups (in case old data has IDs embedded)
    const { data: speakers } = await supabaseAdmin
      .from('speakers')
      .select('id, name');

    const speakerMap = new Map<string, string>();
    if (speakers) {
      for (const s of speakers) {
        speakerMap.set(s.id, s.name);
      }
    }

    const results = {
      migrated: [] as Array<{ event_id: string; title: string; days_created: number; topics_total: number }>,
      skipped: [] as Array<{ event_id: string; title: string; reason: string }>,
      errors: [] as Array<{ event_id: string; title: string; error: string }>,
    };

    for (const event of events) {
      const topics = extractOldTopics(event.schedule_topics);

      if (topics.length === 0) {
        results.skipped.push({ event_id: event.id, title: event.title, reason: 'Empty schedule_topics' });
        continue;
      }

      // Skip if already has schedules (unless force)
      if (!force && eventsWithSchedules.has(event.id)) {
        results.skipped.push({ event_id: event.id, title: event.title, reason: 'Already has event_schedules' });
        continue;
      }

      // If force, delete existing first
      if (force && eventsWithSchedules.has(event.id)) {
        await supabaseAdmin
          .from('event_schedules')
          .delete()
          .eq('event_id', event.id);
      }

      try {
        // Group topics by day
        const byDay = new Map<number, OldScheduleTopic[]>();
        for (const t of topics) {
          const day = t.day || 1;
          if (!byDay.has(day)) byDay.set(day, []);
          byDay.get(day)!.push(t);
        }

        // Sort days
        const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]);

        let daysCreated = 0;
        let topicsTotal = 0;

        for (const [dayNum, dayTopics] of sortedDays) {
          // Calculate the schedule date based on event start_date + day offset
          let scheduleDate = event.start_date?.split('T')[0] || '';
          if (scheduleDate && dayNum > 1) {
            const d = new Date(scheduleDate);
            d.setDate(d.getDate() + (dayNum - 1));
            scheduleDate = d.toISOString().split('T')[0];
          }

          // Transform topics to new format
          const newTopics: NewTopicItem[] = dayTopics.map(t => ({
            name: t.topic || '',
            start_time: parseTimeToHHMM(t.time),
            end_time: parseEndTime(t.time),
            speakers: [],
            location: '',
            description: t.description || '',
          }));

          const { error: insertError } = await supabaseAdmin
            .from('event_schedules')
            .insert({
              event_id: event.id,
              schedule_date: scheduleDate,
              tab_label: sortedDays.length > 1 ? `Day ${dayNum}` : null,
              topics: newTopics,
              display_order: dayNum,
            });

          if (insertError) {
            throw new Error(`Day ${dayNum}: ${insertError.message}`);
          }

          daysCreated++;
          topicsTotal += newTopics.length;
        }

        results.migrated.push({
          event_id: event.id,
          title: event.title,
          days_created: daysCreated,
          topics_total: topicsTotal,
        });
      } catch (err) {
        results.errors.push({
          event_id: event.id,
          title: event.title,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration complete: ${results.migrated.length} events migrated, ${results.skipped.length} skipped, ${results.errors.length} errors`,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration execution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
