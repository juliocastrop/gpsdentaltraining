#!/usr/bin/env npx tsx
/**
 * GPS Dental Training - Speaker Import Script
 *
 * Imports speakers scraped from production site and associates them with events.
 *
 * Usage:
 *   npx tsx scripts/migration/import-speakers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Speaker data scraped from production
const speakers = [
  {
    name: 'Dr. Carlos Castro',
    slug: 'dr-carlos-castro',
    title: 'DDS, FACP - Prosthodontist & Implant Specialist',
    bio: `Dr. Castro holds dual dental training from Pontificia Universidad Javeriana and New York University College of Dentistry. He obtained a certificate in Advanced Education in Prosthodontics from NYU. His surgical training included a two-year surgical fellowship at Columbia University, mentored by Dr. Dennis Tarnow. During his residency, he received the Dr. Harold Litvak Fellowship Award and The Kenneth Adisman Award. He served as Clinical Assistant Professor at Columbia and NYU's postgraduate prosthodontics programs and lectures nationally and internationally on implant prosthodontics and digital dentistry.`,
    photo_url: 'https://gpsdentaltraining.com/wp-content/uploads/2025/08/drcarloscastrox4.png',
    social_links: {},
  },
  {
    name: 'Kite Saito',
    slug: 'kite-saito',
    title: 'Certified Dental Technician & Master Dental Ceramist',
    bio: `Kite Saito brings over 20 years of experience in advanced esthetic and implant restorations. Originally from Yokohama, Japan, he completed the LACC Dental Technology Program in 2004 and finished the two-year UCLA Master Dental Ceramist Program in 2011. Currently working at Ozark Prosthodontics in Fayetteville, Arkansas, he specializes in full-arch monolithic zirconia restorations and the artful application of MiYO® liquid ceramics. His expertise includes digital workflows—including iCam 4D photogrammetry and advanced design strategies—combined with the artistry of ceramic characterization. He shares his knowledge through hands-on education and international lectures.`,
    photo_url: 'https://gpsdentaltraining.com/wp-content/uploads/2025/11/Kite-Saito-300x300.jpg',
    social_links: {},
  },
  {
    name: 'Dr. Joseph Choukroun',
    slug: 'dr-joseph-choukroun',
    title: 'MD - Physician, Researcher & PRF Inventor',
    bio: `Dr. Choukroun holds a medical degree from the University of Montpellier with specialization in General Surgery, Anesthesiology, and Pain Management. He invented the PRF (Platelet-Rich Fibrin) family of techniques, transforming biologic dentistry worldwide. He operates a private pain-management clinic in Nice, France, and currently serves as President of SYFAC, an internationally recognized symposium focused on growth factors, biomaterials, and tissue regeneration. He has authored numerous scientific papers and trained thousands of clinicians on biologics and regenerative strategies.`,
    photo_url: 'https://gpsdentaltraining.com/wp-content/uploads/2025/12/Joseph-Choukroun-300x300.png',
    social_links: {},
  },
  {
    name: 'Marina Yefrusi',
    slug: 'marina-yefrusi',
    title: 'RDH - Office Manager at Georgia Prosthodontics',
    bio: `Marina is a dental hygienist and practice leader with over 15 years of clinical and strategic management experience. She transformed Georgia Prosthodontics from insurance-dependent to fee-for-service operations. Her expertise spans treatment coordination, case presentation, and patient journey optimization for complex prosthodontic cases. She specializes in identifying niche markets and developing tailored messaging strategies for high-net-worth and underserved communities.`,
    photo_url: 'https://gpsdentaltraining.com/wp-content/uploads/2025/06/Marina-headshot2-1.jpg',
    social_links: {},
  },
];

// Event-Speaker associations
const eventSpeakerAssociations = [
  {
    event_slug: 'mastering-pink-ceramics-advanced-esthetics-in-zirconia',
    speaker_slugs: ['kite-saito'],
  },
  {
    event_slug: 'immediate-implant-placement-from-a-to-z-master-hands-on-course',
    speaker_slugs: ['dr-carlos-castro'],
  },
  {
    event_slug: 'comprehensive-prf-protocols-handling-clinical-integration',
    speaker_slugs: ['dr-joseph-choukroun'],
  },
  {
    event_slug: 'mastering-large-case-acceptance',
    speaker_slugs: ['dr-carlos-castro', 'marina-yefrusi'],
  },
];

async function importSpeakers() {
  console.log('Starting speaker import...\n');

  const speakerIdMap: Record<string, string> = {};

  // 1. Insert speakers
  for (const speaker of speakers) {
    // Check if speaker already exists
    const { data: existing } = await supabase
      .from('speakers')
      .select('id')
      .eq('slug', speaker.slug)
      .single();

    if (existing) {
      console.log(`Speaker "${speaker.name}" already exists, updating...`);
      const { data, error } = await supabase
        .from('speakers')
        .update({
          name: speaker.name,
          title: speaker.title,
          bio: speaker.bio,
          photo_url: speaker.photo_url,
          social_links: speaker.social_links,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error(`  Error updating speaker: ${error.message}`);
      } else {
        console.log(`  Updated: ${data.name}`);
        speakerIdMap[speaker.slug] = data.id;
      }
    } else {
      console.log(`Creating speaker "${speaker.name}"...`);
      const { data, error } = await supabase
        .from('speakers')
        .insert({
          name: speaker.name,
          slug: speaker.slug,
          title: speaker.title,
          bio: speaker.bio,
          photo_url: speaker.photo_url,
          social_links: speaker.social_links,
        })
        .select()
        .single();

      if (error) {
        console.error(`  Error creating speaker: ${error.message}`);
      } else {
        console.log(`  Created: ${data.name} (ID: ${data.id})`);
        speakerIdMap[speaker.slug] = data.id;
      }
    }
  }

  console.log('\n--- Speaker ID Map ---');
  console.log(speakerIdMap);

  // 2. Get event IDs
  const { data: events } = await supabase
    .from('events')
    .select('id, slug');

  const eventIdMap: Record<string, string> = {};
  events?.forEach(e => {
    eventIdMap[e.slug] = e.id;
  });

  console.log('\n--- Event ID Map ---');
  console.log(eventIdMap);

  // 3. Create event-speaker associations
  console.log('\n--- Creating Event-Speaker Associations ---');

  for (const association of eventSpeakerAssociations) {
    const eventId = eventIdMap[association.event_slug];
    if (!eventId) {
      console.log(`Event not found: ${association.event_slug}`);
      continue;
    }

    // Delete existing associations for this event
    await supabase
      .from('event_speakers')
      .delete()
      .eq('event_id', eventId);

    for (let i = 0; i < association.speaker_slugs.length; i++) {
      const speakerSlug = association.speaker_slugs[i];
      const speakerId = speakerIdMap[speakerSlug];

      if (!speakerId) {
        console.log(`  Speaker not found: ${speakerSlug}`);
        continue;
      }

      const { error } = await supabase
        .from('event_speakers')
        .insert({
          event_id: eventId,
          speaker_id: speakerId,
          display_order: i + 1,
        });

      if (error) {
        console.error(`  Error creating association: ${error.message}`);
      } else {
        console.log(`  Associated ${speakerSlug} with ${association.event_slug} (order: ${i + 1})`);
      }
    }
  }

  console.log('\n=== Import Complete ===');
}

importSpeakers().catch(console.error);
