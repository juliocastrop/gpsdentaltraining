/**
 * Seed Test Events for GPS Dental Training
 *
 * This script creates test events that can be easily identified and deleted.
 * All test events have titles prefixed with "[TEST]" for easy identification.
 *
 * Usage:
 *   npx tsx scripts/seed-test-events.ts
 *
 * To delete test events:
 *   npx tsx scripts/seed-test-events.ts --delete
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Supabase credentials from environment variables
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure you have a .env file with these values.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test event prefix for easy identification
const TEST_PREFIX = '[TEST]';

// Generate future dates
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Test events data
const testEvents = [
  {
    title: `${TEST_PREFIX} Comprehensive PRF Protocols`,
    slug: 'test-comprehensive-prf-protocols',
    description: 'Master advanced platelet-rich fibrin techniques with hands-on training from the inventor of PRF technology. This comprehensive course covers A-PRF, L-PRF, and i-PRF protocols.',
    start_date: getFutureDate(30),
    end_date: getFutureDate(31),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 15,
    capacity: 24,
    featured_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '09:00 AM - 10:30 AM', topic: 'Introduction to PRF Biology', description: 'Understanding platelet concentrates and growth factors' },
      { day: 1, time: '10:45 AM - 12:00 PM', topic: 'A-PRF & L-PRF Preparation', description: 'Hands-on membrane preparation techniques' },
      { day: 1, time: '01:00 PM - 03:00 PM', topic: 'Clinical Applications', description: 'Socket preservation, ridge augmentation, sinus lift' },
      { day: 2, time: '09:00 AM - 12:00 PM', topic: 'Advanced Techniques', description: 'Sticky bone, PRF plugs, and i-PRF' },
      { day: 2, time: '01:00 PM - 04:00 PM', topic: 'Live Patient Procedures', description: 'Observation of clinical cases' },
    ],
  },
  {
    title: `${TEST_PREFIX} Implant Surgery Fundamentals`,
    slug: 'test-implant-surgery-fundamentals',
    description: 'A comprehensive introduction to dental implant surgery for general dentists looking to expand their practice. Includes surgical planning, placement techniques, and complication management.',
    start_date: getFutureDate(45),
    end_date: getFutureDate(46),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 12,
    capacity: 20,
    featured_image_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'Patient Selection & Treatment Planning', description: 'Case selection criteria and digital planning workflow' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'Surgical Anatomy Review', description: 'Critical anatomical considerations for implant placement' },
      { day: 1, time: '01:00 PM - 04:00 PM', topic: 'Hands-On Workshop', description: 'Implant placement on models' },
      { day: 2, time: '08:30 AM - 12:00 PM', topic: 'Complication Management', description: 'Prevention and management of surgical complications' },
      { day: 2, time: '01:00 PM - 03:00 PM', topic: 'Case Presentations', description: 'Review of complex cases and discussion' },
    ],
  },
  {
    title: `${TEST_PREFIX} Digital Dentistry Workshop`,
    slug: 'test-digital-dentistry-workshop',
    description: 'Explore the latest in digital dentistry including intraoral scanning, CAD/CAM design, and 3D printing applications in dental practice.',
    start_date: getFutureDate(60),
    end_date: getFutureDate(60),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 8,
    capacity: 16,
    featured_image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '09:00 AM - 10:30 AM', topic: 'Digital Workflow Overview', description: 'From scan to final restoration' },
      { day: 1, time: '10:45 AM - 12:00 PM', topic: 'Intraoral Scanning Mastery', description: 'Hands-on scanning techniques and tips' },
      { day: 1, time: '01:00 PM - 03:00 PM', topic: 'CAD/CAM Design Principles', description: 'Designing crowns, bridges, and surgical guides' },
      { day: 1, time: '03:15 PM - 05:00 PM', topic: '3D Printing Applications', description: 'Models, surgical guides, and temporary restorations' },
    ],
  },
  {
    title: `${TEST_PREFIX} Periodontal Plastic Surgery`,
    slug: 'test-periodontal-plastic-surgery',
    description: 'Advanced soft tissue management techniques for esthetic outcomes. Covers connective tissue grafts, tunneling techniques, and coronally advanced flaps.',
    start_date: getFutureDate(75),
    end_date: getFutureDate(76),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 14,
    capacity: 18,
    featured_image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'Soft Tissue Anatomy', description: 'Understanding gingival biotype and tissue characteristics' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'Connective Tissue Grafting', description: 'Harvesting techniques and recipient site preparation' },
      { day: 1, time: '01:00 PM - 04:00 PM', topic: 'Hands-On Pig Jaw Workshop', description: 'Practice grafting techniques' },
      { day: 2, time: '08:30 AM - 11:00 AM', topic: 'Tunneling Techniques', description: 'Minimally invasive approaches for root coverage' },
      { day: 2, time: '11:15 AM - 01:00 PM', topic: 'Live Surgery Observation', description: 'Watch Dr. Neiva perform soft tissue procedures' },
    ],
  },
  {
    title: `${TEST_PREFIX} Full Arch Rehabilitation`,
    slug: 'test-full-arch-rehabilitation',
    description: 'Comprehensive course on full arch implant rehabilitation including All-on-4 concepts, immediate loading protocols, and prosthetic considerations.',
    start_date: getFutureDate(90),
    end_date: getFutureDate(92),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 24,
    capacity: 16,
    featured_image_url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '08:00 AM - 12:00 PM', topic: 'Treatment Planning for Full Arch', description: 'Patient selection, CBCT analysis, and surgical planning' },
      { day: 1, time: '01:00 PM - 05:00 PM', topic: 'Surgical Protocols', description: 'Implant positioning for immediate load' },
      { day: 2, time: '08:00 AM - 12:00 PM', topic: 'Prosthetic Workflow', description: 'Impressions, bite registration, and lab communication' },
      { day: 2, time: '01:00 PM - 05:00 PM', topic: 'Hands-On Surgery', description: 'Model surgery with guided placement' },
      { day: 3, time: '08:00 AM - 12:00 PM', topic: 'Live Surgery', description: 'Full arch case from start to provisional' },
      { day: 3, time: '01:00 PM - 03:00 PM', topic: 'Maintenance & Complications', description: 'Long-term care and problem-solving' },
    ],
  },
  {
    title: `${TEST_PREFIX} Bone Grafting Essentials`,
    slug: 'test-bone-grafting-essentials',
    description: 'Learn essential bone grafting techniques for implant site development including socket preservation, horizontal and vertical augmentation.',
    start_date: getFutureDate(105),
    end_date: getFutureDate(105),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 8,
    capacity: 20,
    featured_image_url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=450&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '09:00 AM - 10:30 AM', topic: 'Bone Biology & Healing', description: 'Understanding bone regeneration principles' },
      { day: 1, time: '10:45 AM - 12:00 PM', topic: 'Graft Materials', description: 'Autograft, allograft, xenograft, and synthetics' },
      { day: 1, time: '01:00 PM - 03:00 PM', topic: 'Socket Preservation Techniques', description: 'Hands-on workshop' },
      { day: 1, time: '03:15 PM - 05:00 PM', topic: 'Ridge Augmentation', description: 'GBR with membranes and tenting screws' },
    ],
  },
];

async function seedTestEvents() {
  console.log('Seeding test events...\n');

  for (const event of testEvents) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error(`Failed to insert "${event.title}":`, error.message);
    } else {
      console.log(`Created: ${data.title}`);
      console.log(`  - Date: ${new Date(data.start_date).toLocaleDateString()}`);
      console.log(`  - CE Credits: ${data.ce_credits}`);
      console.log(`  - Slug: ${data.slug}\n`);
    }
  }

  console.log('Done! Test events have been created.');
  console.log(`\nTo delete test events, run: npx tsx scripts/seed-test-events.ts --delete`);
}

async function deleteTestEvents() {
  console.log('Deleting test events...\n');

  const { data, error } = await supabase
    .from('events')
    .delete()
    .like('title', `${TEST_PREFIX}%`)
    .select();

  if (error) {
    console.error('Failed to delete test events:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Deleted ${data.length} test events:`);
    data.forEach(event => console.log(`  - ${event.title}`));
  } else {
    console.log('No test events found to delete.');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--delete')) {
  deleteTestEvents();
} else {
  seedTestEvents();
}
