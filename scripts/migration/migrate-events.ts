/**
 * Events/Courses Migration Script
 *
 * Migrates WordPress gps_event posts to Strapi (content) and Supabase (transactional data).
 *
 * Flow:
 * 1. Export events from WordPress (gps_event CPT + post meta)
 * 2. Create events in Strapi (content management)
 * 3. Create events in Supabase (for transactional linking)
 * 4. Migrate ticket types to Supabase
 * 5. Migrate speakers and event-speaker relationships
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-events.ts [--dry-run] [--strapi-only] [--supabase-only]
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
  unserialize,
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

interface WpEvent {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_name: string;
  post_status: string;
  post_date: Date;
  post_modified: Date;
}

interface WpPostMeta {
  post_id: number;
  meta_key: string;
  meta_value: string;
}

interface EventData {
  wpId: number;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ceCredits: number;
  courseDescription: string | null;
  objectives: string[];
  speakerIds: number[];
  featuredImageUrl: string | null;
  status: 'draft' | 'published' | 'archived';
  scheduledTopics: Array<{
    day: number;
    time: string;
    topic: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TicketTypeData {
  wpId: number;
  eventWpId: number;
  name: string;
  ticketType: string;
  price: number;
  quantity: number | null;
  saleStart: string | null;
  saleEnd: string | null;
  wcProductId: number | null;
  status: 'active' | 'inactive';
  features: string | null;
}

interface SpeakerData {
  wpId: number;
  name: string;
  slug: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

// ============================================================
// FETCH WORDPRESS EVENTS
// ============================================================

async function fetchWpEvents(): Promise<EventData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress events...');

  // Get all events
  const [events] = await conn.execute<WpEvent[]>(`
    SELECT
      ID, post_title, post_content, post_excerpt, post_name,
      post_status, post_date, post_modified
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_event'
    AND post_status IN ('publish', 'draft', 'pending')
    ORDER BY ID ASC
  `);

  log.info(`Found ${events.length} events`);

  if (events.length === 0) return [];

  // Get all event meta
  const eventIds = events.map(e => e.ID);
  const [metaRows] = await conn.execute<WpPostMeta[]>(`
    SELECT post_id, meta_key, meta_value
    FROM ${wpTablePrefix}postmeta
    WHERE post_id IN (${eventIds.join(',')})
    AND meta_key IN (
      '_gps_start_date', '_gps_end_date', '_gps_start_time', '_gps_end_time',
      '_gps_venue', '_gps_address', '_gps_city', '_gps_state', '_gps_zip',
      '_gps_ce_credits', '_gps_description', '_gps_course_description',
      '_gps_objectives', '_gps_speaker_ids', '_gps_schedule_topics',
      '_thumbnail_id'
    )
  `);

  // Get featured image URLs
  const thumbnailIds = metaRows
    .filter(m => m.meta_key === '_thumbnail_id')
    .map(m => parseInt(m.meta_value))
    .filter(id => !isNaN(id));

  const imageUrls = new Map<number, string>();
  if (thumbnailIds.length > 0) {
    const [imageRows] = await conn.execute<{ ID: number; guid: string }[]>(`
      SELECT ID, guid
      FROM ${wpTablePrefix}posts
      WHERE ID IN (${thumbnailIds.join(',')})
    `);
    for (const img of imageRows) {
      imageUrls.set(img.ID, img.guid);
    }
  }

  // Group meta by event
  const metaByEvent = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaByEvent.has(meta.post_id)) {
      metaByEvent.set(meta.post_id, {});
    }
    metaByEvent.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  // Transform events
  const eventData: EventData[] = events.map(event => {
    const meta = metaByEvent.get(event.ID) || {};

    // Parse objectives (line-separated)
    const objectives = (meta['_gps_objectives'] || '')
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    // Parse speaker IDs (serialized array or JSON)
    let speakerIds: number[] = [];
    try {
      const speakers = unserialize(meta['_gps_speaker_ids'] || '[]');
      if (Array.isArray(speakers)) {
        speakerIds = speakers.map(s => parseInt(s)).filter(n => !isNaN(n));
      }
    } catch {
      speakerIds = [];
    }

    // Parse schedule topics (JSON)
    let scheduledTopics: EventData['scheduledTopics'] = [];
    try {
      const topics = JSON.parse(meta['_gps_schedule_topics'] || '[]');
      if (Array.isArray(topics)) {
        scheduledTopics = topics.map((t, i) => ({
          day: t.day || i + 1,
          time: t.time || '',
          topic: t.topic || t.title || '',
          description: t.description,
        }));
      }
    } catch {
      scheduledTopics = [];
    }

    // Get featured image URL
    const thumbnailId = parseInt(meta['_thumbnail_id'] || '0');
    const featuredImageUrl = imageUrls.get(thumbnailId) || null;

    // Map status
    let status: 'draft' | 'published' | 'archived' = 'draft';
    if (event.post_status === 'publish') status = 'published';

    return {
      wpId: event.ID,
      title: event.post_title,
      slug: event.post_name || slugify(event.post_title),
      description: meta['_gps_description'] || event.post_content,
      excerpt: event.post_excerpt,
      startDate: meta['_gps_start_date'] || '',
      endDate: meta['_gps_end_date'] || null,
      startTime: meta['_gps_start_time'] || null,
      endTime: meta['_gps_end_time'] || null,
      venue: meta['_gps_venue'] || 'GPS Dental Training Center',
      address: meta['_gps_address'] || '6320 Sugarloaf Parkway',
      city: meta['_gps_city'] || 'Duluth',
      state: meta['_gps_state'] || 'GA',
      zip: meta['_gps_zip'] || '30097',
      ceCredits: parseInt(meta['_gps_ce_credits'] || '0') || 0,
      courseDescription: meta['_gps_course_description'] || null,
      objectives,
      speakerIds,
      featuredImageUrl,
      status,
      scheduledTopics,
      createdAt: formatWpDate(event.post_date) || new Date().toISOString(),
      updatedAt: formatWpDate(event.post_modified) || new Date().toISOString(),
    };
  });

  return eventData;
}

// ============================================================
// FETCH WORDPRESS TICKET TYPES
// ============================================================

async function fetchWpTicketTypes(): Promise<TicketTypeData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress ticket types...');

  const [tickets] = await conn.execute<WpEvent[]>(`
    SELECT ID, post_title, post_status
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_ticket'
    ORDER BY ID ASC
  `);

  if (tickets.length === 0) return [];

  const ticketIds = tickets.map(t => t.ID);
  const [metaRows] = await conn.execute<WpPostMeta[]>(`
    SELECT post_id, meta_key, meta_value
    FROM ${wpTablePrefix}postmeta
    WHERE post_id IN (${ticketIds.join(',')})
    AND meta_key IN (
      '_gps_event_id', '_gps_ticket_type', '_gps_ticket_price',
      '_gps_ticket_quantity', '_gps_ticket_start_date', '_gps_ticket_end_date',
      '_gps_wc_product_id', '_gps_ticket_status', '_gps_ticket_features'
    )
  `);

  const metaByTicket = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaByTicket.has(meta.post_id)) {
      metaByTicket.set(meta.post_id, {});
    }
    metaByTicket.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  const ticketData: TicketTypeData[] = tickets.map(ticket => {
    const meta = metaByTicket.get(ticket.ID) || {};

    return {
      wpId: ticket.ID,
      eventWpId: parseInt(meta['_gps_event_id'] || '0'),
      name: ticket.post_title,
      ticketType: meta['_gps_ticket_type'] || 'general',
      price: parseFloat(meta['_gps_ticket_price'] || '0'),
      quantity: meta['_gps_ticket_quantity'] ? parseInt(meta['_gps_ticket_quantity']) : null,
      saleStart: meta['_gps_ticket_start_date'] || null,
      saleEnd: meta['_gps_ticket_end_date'] || null,
      wcProductId: meta['_gps_wc_product_id'] ? parseInt(meta['_gps_wc_product_id']) : null,
      status: meta['_gps_ticket_status'] === 'active' ? 'active' : 'inactive',
      features: meta['_gps_ticket_features'] || null,
    };
  });

  log.info(`Found ${ticketData.length} ticket types`);
  return ticketData;
}

// ============================================================
// FETCH WORDPRESS SPEAKERS
// ============================================================

async function fetchWpSpeakers(): Promise<SpeakerData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WordPress speakers...');

  const [speakers] = await conn.execute<WpEvent[]>(`
    SELECT ID, post_title, post_content, post_name
    FROM ${wpTablePrefix}posts
    WHERE post_type = 'gps_speaker'
    AND post_status = 'publish'
    ORDER BY ID ASC
  `);

  if (speakers.length === 0) return [];

  const speakerIds = speakers.map(s => s.ID);
  const [metaRows] = await conn.execute<WpPostMeta[]>(`
    SELECT post_id, meta_key, meta_value
    FROM ${wpTablePrefix}postmeta
    WHERE post_id IN (${speakerIds.join(',')})
    AND meta_key IN (
      '_gps_designation', '_gps_company', '_gps_email', '_gps_phone',
      '_gps_social_twitter', '_gps_social_linkedin', '_gps_social_facebook',
      '_thumbnail_id'
    )
  `);

  // Get speaker photos
  const thumbnailIds = metaRows
    .filter(m => m.meta_key === '_thumbnail_id')
    .map(m => parseInt(m.meta_value))
    .filter(id => !isNaN(id));

  const imageUrls = new Map<number, string>();
  if (thumbnailIds.length > 0) {
    const [imageRows] = await conn.execute<{ ID: number; guid: string }[]>(`
      SELECT ID, guid
      FROM ${wpTablePrefix}posts
      WHERE ID IN (${thumbnailIds.join(',')})
    `);
    for (const img of imageRows) {
      imageUrls.set(img.ID, img.guid);
    }
  }

  const metaBySpeaker = new Map<number, Record<string, string>>();
  for (const meta of metaRows) {
    if (!metaBySpeaker.has(meta.post_id)) {
      metaBySpeaker.set(meta.post_id, {});
    }
    metaBySpeaker.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  const speakerData: SpeakerData[] = speakers.map(speaker => {
    const meta = metaBySpeaker.get(speaker.ID) || {};
    const thumbnailId = parseInt(meta['_thumbnail_id'] || '0');

    return {
      wpId: speaker.ID,
      name: speaker.post_title,
      slug: speaker.post_name || slugify(speaker.post_title),
      title: meta['_gps_designation'] || '',
      bio: speaker.post_content,
      photoUrl: imageUrls.get(thumbnailId) || null,
      socialLinks: {
        twitter: meta['_gps_social_twitter'] || undefined,
        linkedin: meta['_gps_social_linkedin'] || undefined,
        facebook: meta['_gps_social_facebook'] || undefined,
      },
    };
  });

  log.info(`Found ${speakerData.length} speakers`);
  return speakerData;
}

// ============================================================
// CREATE STRAPI CONTENT
// ============================================================

async function createStrapiEvent(event: EventData): Promise<number | null> {
  try {
    const response = await fetch(`${strapiConfig.url}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strapiConfig.apiToken}`,
      },
      body: JSON.stringify({
        data: {
          title: event.title,
          slug: event.slug,
          description: event.description,
          shortDescription: event.excerpt,
          startDate: event.startDate,
          endDate: event.endDate,
          venue: event.venue,
          address: `${event.address}, ${event.city}, ${event.state} ${event.zip}`,
          ceCredits: event.ceCredits,
          learningObjectives: event.objectives,
          publishedAt: event.status === 'published' ? new Date().toISOString() : null,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.error(`Strapi error for event ${event.wpId}:`, error);
      return null;
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    log.error(`Failed to create Strapi event ${event.title}:`, error);
    return null;
  }
}

async function createStrapiSpeaker(speaker: SpeakerData): Promise<number | null> {
  try {
    const response = await fetch(`${strapiConfig.url}/api/speakers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strapiConfig.apiToken}`,
      },
      body: JSON.stringify({
        data: {
          name: speaker.name,
          slug: speaker.slug,
          title: speaker.title,
          bio: speaker.bio,
          shortBio: speaker.bio?.substring(0, 200),
          publishedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.error(`Strapi error for speaker ${speaker.wpId}:`, error);
      return null;
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    log.error(`Failed to create Strapi speaker ${speaker.name}:`, error);
    return null;
  }
}

// ============================================================
// CREATE SUPABASE RECORDS
// ============================================================

async function createSupabaseEvent(
  event: EventData,
  strapiId: number | null
): Promise<string | null> {
  try {
    // Combine date and time
    let startDateTime = event.startDate;
    if (event.startTime) {
      startDateTime = `${event.startDate}T${event.startTime}:00`;
    }

    let endDateTime = event.endDate;
    if (endDateTime && event.endTime) {
      endDateTime = `${event.endDate}T${event.endTime}:00`;
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        strapi_id: strapiId,
        title: event.title,
        slug: event.slug,
        description: event.description,
        excerpt: event.excerpt,
        start_date: startDateTime,
        end_date: endDateTime,
        venue: event.venue,
        address: `${event.address}, ${event.city}, ${event.state} ${event.zip}`,
        ce_credits: event.ceCredits,
        schedule_topics: event.scheduledTopics.length > 0 ? event.scheduledTopics : null,
        featured_image_url: event.featuredImageUrl,
        status: event.status,
        created_at: event.createdAt,
        updated_at: event.updatedAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create Supabase event ${event.title}:`, error);
    return null;
  }
}

async function createSupabaseSpeaker(
  speaker: SpeakerData,
  strapiId: number | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('speakers')
      .insert({
        strapi_id: strapiId,
        name: speaker.name,
        slug: speaker.slug,
        title: speaker.title,
        bio: speaker.bio,
        photo_url: speaker.photoUrl,
        social_links: speaker.socialLinks,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create Supabase speaker ${speaker.name}:`, error);
    return null;
  }
}

async function createSupabaseTicketType(
  ticket: TicketTypeData,
  eventSupabaseId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ticket_types')
      .insert({
        event_id: eventSupabaseId,
        name: ticket.name,
        ticket_type: ticket.ticketType.toLowerCase().replace(/\s+/g, '_'),
        price: ticket.price,
        quantity: ticket.quantity,
        sale_start: ticket.saleStart ? formatWpDate(ticket.saleStart) : null,
        sale_end: ticket.saleEnd ? formatWpDate(ticket.saleEnd) : null,
        status: ticket.status,
        features: ticket.features ? ticket.features.split('\n').filter(f => f.trim()) : null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create ticket type ${ticket.name}:`, error);
    return null;
  }
}

async function createEventSpeakerRelation(
  eventId: string,
  speakerId: string,
  order: number
): Promise<void> {
  try {
    await supabase.from('event_speakers').upsert(
      {
        event_id: eventId,
        speaker_id: speakerId,
        display_order: order,
      },
      { onConflict: 'event_id,speaker_id' }
    );
  } catch (error) {
    log.error(`Failed to create event-speaker relation:`, error);
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateEvents(options: {
  dryRun?: boolean;
  strapiOnly?: boolean;
  supabaseOnly?: boolean;
}): Promise<void> {
  const results = [
    createMigrationResult('speakers'),
    createMigrationResult('events'),
    createMigrationResult('ticket_types'),
  ];

  try {
    await loadMappingsFromFile();

    // Fetch all data
    const speakers = await fetchWpSpeakers();
    const events = await fetchWpEvents();
    const ticketTypes = await fetchWpTicketTypes();

    results[0].total = speakers.length;
    results[1].total = events.length;
    results[2].total = ticketTypes.length;

    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      log.info(`Would migrate: ${speakers.length} speakers, ${events.length} events, ${ticketTypes.length} ticket types`);

      // Export for review
      const outputPath = path.join(migrationSettings.outputDir, 'events-export.json');
      await fs.mkdir(migrationSettings.outputDir, { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify({ speakers, events, ticketTypes }, null, 2)
      );
      log.info(`Data exported to ${outputPath}`);
      return;
    }

    // Migrate speakers first
    log.info(`Migrating ${speakers.length} speakers...`);
    const speakerIdMap = new Map<number, string>();

    for (let i = 0; i < speakers.length; i++) {
      const speaker = speakers[i];
      log.progress(i + 1, speakers.length, 'Speakers');

      try {
        let strapiId: number | null = null;
        if (!options.supabaseOnly) {
          strapiId = await createStrapiSpeaker(speaker);
        }

        let supabaseId: string | null = null;
        if (!options.strapiOnly) {
          supabaseId = await createSupabaseSpeaker(speaker, strapiId);
        }

        if (supabaseId) {
          speakerIdMap.set(speaker.wpId, supabaseId);
          addIdMapping({ wpId: speaker.wpId, supabaseId, type: 'speaker' });
          results[0].migrated++;
        } else {
          results[0].failed++;
        }
      } catch (error) {
        results[0].failed++;
        results[0].errors.push({
          id: speaker.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate events
    log.info(`Migrating ${events.length} events...`);
    const eventIdMap = new Map<number, string>();

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      log.progress(i + 1, events.length, 'Events');

      try {
        let strapiId: number | null = null;
        if (!options.supabaseOnly) {
          strapiId = await createStrapiEvent(event);
        }

        let supabaseId: string | null = null;
        if (!options.strapiOnly) {
          supabaseId = await createSupabaseEvent(event, strapiId);
        }

        if (supabaseId) {
          eventIdMap.set(event.wpId, supabaseId);
          addIdMapping({ wpId: event.wpId, supabaseId, type: 'event' });

          // Create speaker relations
          for (let j = 0; j < event.speakerIds.length; j++) {
            const speakerId = speakerIdMap.get(event.speakerIds[j]);
            if (speakerId) {
              await createEventSpeakerRelation(supabaseId, speakerId, j);
            }
          }

          results[1].migrated++;
        } else {
          results[1].failed++;
        }
      } catch (error) {
        results[1].failed++;
        results[1].errors.push({
          id: event.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate ticket types
    log.info(`Migrating ${ticketTypes.length} ticket types...`);

    for (let i = 0; i < ticketTypes.length; i++) {
      const ticket = ticketTypes[i];
      log.progress(i + 1, ticketTypes.length, 'Ticket Types');

      try {
        const eventSupabaseId = eventIdMap.get(ticket.eventWpId);
        if (!eventSupabaseId) {
          log.warn(`No event found for ticket type ${ticket.wpId}`);
          results[2].skipped++;
          continue;
        }

        if (!options.strapiOnly) {
          const supabaseId = await createSupabaseTicketType(ticket, eventSupabaseId);
          if (supabaseId) {
            addIdMapping({ wpId: ticket.wpId, supabaseId, type: 'ticket_type' });
            results[2].migrated++;
          } else {
            results[2].failed++;
          }
        }
      } catch (error) {
        results[2].failed++;
        results[2].errors.push({
          id: ticket.wpId,
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
  Speakers: ${results[0].migrated}/${results[0].total} (${results[0].failed} failed)
  Events: ${results[1].migrated}/${results[1].total} (${results[1].failed} failed)
  Ticket Types: ${results[2].migrated}/${results[2].total} (${results[2].failed} failed)
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
  strapiOnly: args.includes('--strapi-only'),
  supabaseOnly: args.includes('--supabase-only'),
};

migrateEvents(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });
