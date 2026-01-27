#!/usr/bin/env npx tsx
/**
 * GPS Dental Training - Migrate Schedules and Objectives from WordPress
 *
 * Extracts schedule data and objectives from WordPress and updates Supabase events.
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-schedules-objectives.ts
 */

import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ScheduleTopic {
  name: string;
  start_time: string;
  end_time: string;
  speakers: number[];
  location: string;
  description: string;
}

interface Schedule {
  date: string;
  tab_label: string;
  topics: ScheduleTopic[];
}

async function getMySQLConnection() {
  return await mysql.createConnection({
    host: process.env.WP_DB_HOST || 'localhost',
    port: parseInt(process.env.WP_DB_PORT || '3306'),
    user: process.env.WP_DB_USER || 'root',
    password: process.env.WP_DB_PASSWORD || '',
    database: process.env.WP_DB_NAME || 'gps_wordpress',
  });
}

async function migrateSchedulesAndObjectives() {
  const conn = await getMySQLConnection();
  const prefix = process.env.WP_TABLE_PREFIX || 'wpiy_';

  console.log('Starting schedules and objectives migration...\n');

  try {
    // Get all events from WordPress
    const [wpEvents] = await conn.query<any[]>(`
      SELECT p.ID, p.post_title, p.post_name as slug
      FROM ${prefix}posts p
      WHERE p.post_type = 'gps_event'
      AND p.post_status = 'publish'
    `);

    console.log(`Found ${wpEvents.length} WordPress events\n`);

    for (const wpEvent of wpEvents) {
      console.log(`\n--- Processing: ${wpEvent.post_title} ---`);

      // Get objectives
      const [objectivesMeta] = await conn.query<any[]>(`
        SELECT meta_value FROM ${prefix}postmeta
        WHERE post_id = ? AND meta_key = '_gps_objectives'
      `, [wpEvent.ID]);

      const objectivesText = objectivesMeta[0]?.meta_value || '';
      const objectives = objectivesText
        .split('\n')
        .map((o: string) => o.trim())
        .filter((o: string) => o.length > 0);

      console.log(`  Objectives: ${objectives.length} found`);

      // Get schedules
      const [schedules] = await conn.query<any[]>(`
        SELECT
          s.ID,
          s.post_title,
          pm_date.meta_value as schedule_date,
          pm_label.meta_value as tab_label,
          pm_topics.meta_value as topics_json
        FROM ${prefix}posts s
        LEFT JOIN ${prefix}postmeta pm_event ON s.ID = pm_event.post_id AND pm_event.meta_key = '_gps_event_id'
        LEFT JOIN ${prefix}postmeta pm_date ON s.ID = pm_date.post_id AND pm_date.meta_key = '_gps_schedule_date'
        LEFT JOIN ${prefix}postmeta pm_label ON s.ID = pm_label.post_id AND pm_label.meta_key = '_gps_tab_label'
        LEFT JOIN ${prefix}postmeta pm_topics ON s.ID = pm_topics.post_id AND pm_topics.meta_key = '_gps_schedule_topics'
        WHERE s.post_type = 'gps_schedule'
        AND s.post_status = 'publish'
        AND pm_event.meta_value = ?
        ORDER BY pm_date.meta_value ASC
      `, [wpEvent.ID]);

      console.log(`  Schedules: ${schedules.length} found`);

      // Parse schedules
      const parsedSchedules: Schedule[] = [];
      for (const sched of schedules) {
        let topics: ScheduleTopic[] = [];
        try {
          if (sched.topics_json) {
            topics = JSON.parse(sched.topics_json);
          }
        } catch (e) {
          console.log(`    Warning: Could not parse topics for ${sched.post_title}`);
        }

        parsedSchedules.push({
          date: sched.schedule_date,
          tab_label: sched.tab_label || `Day ${parsedSchedules.length + 1}`,
          topics: topics,
        });
      }

      // Find corresponding event in Supabase
      const { data: supabaseEvent, error: findError } = await supabase
        .from('events')
        .select('id, slug')
        .eq('slug', wpEvent.slug)
        .single();

      if (findError || !supabaseEvent) {
        console.log(`  Event not found in Supabase: ${wpEvent.slug}`);
        continue;
      }

      // Update event with objectives (stored in schedule_topics for now since learning_objectives doesn't exist)
      // We'll store objectives and schedules in schedule_topics as a combined JSON
      const combinedData = {
        objectives: objectives,
        schedules: parsedSchedules,
      };

      const { error: updateError } = await supabase
        .from('events')
        .update({
          schedule_topics: combinedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supabaseEvent.id);

      if (updateError) {
        console.log(`  Error updating: ${updateError.message}`);
      } else {
        console.log(`  Updated successfully!`);
        console.log(`    - ${objectives.length} objectives`);
        console.log(`    - ${parsedSchedules.length} schedules with ${parsedSchedules.reduce((sum, s) => sum + s.topics.length, 0)} total topics`);
      }
    }

    console.log('\n=== Migration Complete ===');
  } finally {
    await conn.end();
  }
}

migrateSchedulesAndObjectives().catch(console.error);
