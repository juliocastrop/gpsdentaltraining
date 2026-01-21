/**
 * Complete Seed Data for GPS Dental Training
 *
 * Creates a full test environment with:
 * - Speakers
 * - Events with rich content
 * - Ticket types
 * - Event-speaker relationships
 *
 * Usage:
 *   npx tsx scripts/seed-complete-test-data.ts
 *
 * To delete all test data:
 *   npx tsx scripts/seed-complete-test-data.ts --delete
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://mstvdmedcwibnhsymljd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHZkbWVkY3dpYm5oc3ltbGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNzEzMiwiZXhwIjoyMDg0NDkzMTMyfQ.6raVkpyKEUHQ3yYtAzBtnuq8bP9bFfHVDnInUWogKq8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_PREFIX = '[TEST]';

// Generate future dates
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// ============================================================
// SPEAKERS DATA
// ============================================================
const testSpeakers = [
  {
    name: `${TEST_PREFIX} Dr. Joseph Choukroun`,
    slug: 'test-dr-joseph-choukroun',
    title: 'MD, PhD - Inventor of PRF Technology',
    bio: `Dr. Joseph Choukroun is a world-renowned physician and researcher who invented the Platelet-Rich Fibrin (PRF) technique in 2001. His groundbreaking work has revolutionized regenerative medicine and tissue engineering in dentistry.

With over 30 years of experience in pain management and regenerative medicine, Dr. Choukroun has trained thousands of clinicians worldwide in PRF protocols. He continues to advance the field through ongoing research at the Pain Clinic in Nice, France.

His publications include over 100 peer-reviewed articles and he has lectured in more than 50 countries, making him one of the most sought-after speakers in dental regenerative medicine.`,
    photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    social_links: {
      linkedin: 'https://linkedin.com/in/josephchoukroun',
      researchgate: 'https://researchgate.net/profile/Joseph-Choukroun',
    },
  },
  {
    name: `${TEST_PREFIX} Dr. Carlos Castro`,
    slug: 'test-dr-carlos-castro',
    title: 'DDS, Prosthodontist - GPS Director',
    bio: `Dr. Carlos Castro is the founder and director of GPS Dental Training, bringing over 25 years of experience in prosthodontics and implant dentistry to the educational platform.

As a board-certified prosthodontist, Dr. Castro specializes in complex full-mouth rehabilitation, digital dentistry, and implant prosthetics. He has placed and restored over 5,000 dental implants throughout his career.

Dr. Castro's passion for education has led him to develop comprehensive training programs that bridge the gap between theoretical knowledge and clinical excellence. He is known for his practical, hands-on approach to teaching.`,
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
    social_links: {
      linkedin: 'https://linkedin.com/in/drcarloscastro',
      instagram: 'https://instagram.com/gpsdentaltraining',
    },
  },
  {
    name: `${TEST_PREFIX} Dr. Maurice Salama`,
    slug: 'test-dr-maurice-salama',
    title: 'DMD - Periodontics & Implant Esthetics',
    bio: `Dr. Maurice Salama is an internationally recognized leader in periodontics and implant esthetics. He maintains a private practice in Atlanta, Georgia, focusing on complex esthetic and implant cases.

A graduate of the University of Pennsylvania, Dr. Salama has authored over 100 publications and co-authored the textbook "Dental Implant Complications." He serves on the editorial boards of multiple peer-reviewed journals.

Known for his innovative techniques in soft tissue management and immediate implant placement, Dr. Salama has trained dentists from over 40 countries through his comprehensive courses.`,
    photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    social_links: {
      linkedin: 'https://linkedin.com/in/mauricesalama',
    },
  },
  {
    name: `${TEST_PREFIX} Dr. Rodrigo Neiva`,
    slug: 'test-dr-rodrigo-neiva',
    title: 'DDS, MS - Periodontics',
    bio: `Dr. Rodrigo Neiva is a Professor and Chair of Periodontics at the University of Pennsylvania School of Dental Medicine. His research focuses on guided bone regeneration and minimally invasive surgical techniques.

Dr. Neiva has published extensively on topics including ridge augmentation, soft tissue grafting, and dental implant therapy. He is a diplomate of the American Board of Periodontology.

His teaching philosophy emphasizes evidence-based decision making and the integration of classical periodontal principles with modern implant dentistry.`,
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    social_links: {
      linkedin: 'https://linkedin.com/in/rodrigoneiva',
    },
  },
];

// ============================================================
// EVENTS DATA (with rich content)
// ============================================================
const testEvents = [
  {
    title: `${TEST_PREFIX} Comprehensive PRF Protocols`,
    slug: 'test-comprehensive-prf-protocols',
    excerpt: 'Master advanced platelet-rich fibrin techniques with hands-on training from the inventor of PRF technology.',
    description: `<h2>Transform Your Practice with PRF Technology</h2>
<p>Join Dr. Joseph Choukroun, the inventor of PRF technology, for an intensive two-day course that will revolutionize your approach to tissue regeneration and wound healing.</p>

<p>This comprehensive program covers everything from the biological principles behind platelet concentrates to advanced clinical applications. You'll gain hands-on experience with multiple PRF protocols and learn how to integrate them seamlessly into your daily practice.</p>

<h3>What Sets This Course Apart</h3>
<p>Unlike other PRF courses, this program is taught by the inventor himself, ensuring you receive the most accurate and up-to-date information. Dr. Choukroun's unique teaching style combines scientific rigor with practical clinical insights.</p>

<p>You'll work directly with fresh blood samples to prepare various PRF products, observing the subtle differences in technique that can dramatically affect clinical outcomes.</p>

<h3>Clinical Applications Covered</h3>
<ul>
<li>Socket preservation with PRF plugs</li>
<li>Ridge augmentation using sticky bone</li>
<li>Sinus lift procedures with PRF membranes</li>
<li>Soft tissue healing enhancement</li>
<li>Combination with bone grafting materials</li>
</ul>`,
    start_date: getFutureDate(30),
    end_date: getFutureDate(31),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 15,
    capacity: 24,
    featured_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=630&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'published',
    learning_objectives: [
      'Understand the biology of platelet concentrates and growth factor release',
      'Master A-PRF, L-PRF, and i-PRF preparation protocols',
      'Apply sticky bone technique for ridge augmentation',
      'Integrate PRF into socket preservation procedures',
      'Optimize PRF membrane application for soft tissue healing',
      'Combine PRF with various bone graft materials',
      'Troubleshoot common preparation and application issues',
    ],
    includes: [
      'Comprehensive course materials and protocol guides',
      'Hands-on practice with PRF preparation',
      'Live patient demonstration observation',
      'Certificate of completion with CE credits',
      'Breakfast and lunch both days',
      'Access to online resources for 1 year',
    ],
    prerequisites: [
      'Active dental license (DDS, DMD, or equivalent)',
      'Basic understanding of surgical principles',
      'Experience with implant placement (recommended)',
    ],
    target_audience: [
      'General Dentists expanding into surgical procedures',
      'Periodontists seeking advanced regenerative techniques',
      'Oral Surgeons interested in biological enhancement',
      'Prosthodontists involved in implant treatment planning',
    ],
    gallery_images: [
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=600&fit=crop',
    ],
    schedule_topics: [
      { day: 1, time: '08:00 AM - 08:30 AM', topic: 'Registration & Welcome', description: 'Check-in, materials distribution, and morning refreshments' },
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'PRF Biology & Science', description: 'Understanding platelet concentrates, growth factors, and the wound healing cascade' },
      { day: 1, time: '10:00 AM - 10:15 AM', topic: 'Coffee Break', description: '' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'A-PRF & L-PRF Protocols', description: 'Hands-on preparation of Advanced PRF and Leukocyte PRF membranes' },
      { day: 1, time: '12:00 PM - 01:00 PM', topic: 'Lunch', description: 'Networking lunch with faculty and fellow participants' },
      { day: 1, time: '01:00 PM - 03:00 PM', topic: 'Clinical Applications Part 1', description: 'Socket preservation, immediate implant placement with PRF' },
      { day: 1, time: '03:00 PM - 03:15 PM', topic: 'Coffee Break', description: '' },
      { day: 1, time: '03:15 PM - 05:00 PM', topic: 'Sticky Bone Technique', description: 'Hands-on preparation and application of sticky bone for ridge augmentation' },
      { day: 2, time: '08:00 AM - 10:00 AM', topic: 'i-PRF (Injectable PRF)', description: 'Preparation and applications of injectable platelet-rich fibrin' },
      { day: 2, time: '10:00 AM - 10:15 AM', topic: 'Coffee Break', description: '' },
      { day: 2, time: '10:15 AM - 12:00 PM', topic: 'Live Patient Demonstration', description: 'Observe Dr. Choukroun perform PRF-enhanced procedures' },
      { day: 2, time: '12:00 PM - 01:00 PM', topic: 'Lunch', description: '' },
      { day: 2, time: '01:00 PM - 03:00 PM', topic: 'Sinus Lift Applications', description: 'PRF membranes for sinus augmentation procedures' },
      { day: 2, time: '03:00 PM - 04:30 PM', topic: 'Case Discussion & Q&A', description: 'Review complex cases and troubleshooting common issues' },
      { day: 2, time: '04:30 PM - 05:00 PM', topic: 'Certification Ceremony', description: 'Certificate distribution and closing remarks' },
    ],
    speakers: ['test-dr-joseph-choukroun', 'test-dr-carlos-castro'],
  },
  {
    title: `${TEST_PREFIX} Implant Surgery Fundamentals`,
    slug: 'test-implant-surgery-fundamentals',
    excerpt: 'A comprehensive introduction to dental implant surgery for general dentists expanding their practice.',
    description: `<h2>Build Your Foundation in Implant Dentistry</h2>
<p>This two-day intensive course is designed for general dentists who want to add implant surgery to their clinical repertoire. Whether you're new to implants or looking to refine your skills, this course provides the essential knowledge and hands-on experience you need.</p>

<h3>Evidence-Based Approach</h3>
<p>Led by Dr. Carlos Castro and Dr. Rodrigo Neiva, this course emphasizes evidence-based decision making and proper case selection. You'll learn not just how to place implants, but when to place them and when to refer.</p>

<h3>Hands-On Practice</h3>
<p>Each participant will place multiple implants on high-fidelity models using various implant systems. This practical experience is crucial for developing the tactile skills and confidence needed for clinical success.</p>`,
    start_date: getFutureDate(45),
    end_date: getFutureDate(46),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 14,
    capacity: 20,
    featured_image_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=630&fit=crop',
    status: 'published',
    learning_objectives: [
      'Evaluate patients for implant treatment using proper selection criteria',
      'Interpret CBCT scans for surgical planning',
      'Master flap design and tissue management',
      'Perform basic implant placement with confidence',
      'Understand immediate vs. delayed loading protocols',
      'Recognize and manage common surgical complications',
    ],
    includes: [
      'Course manual with step-by-step protocols',
      'Hands-on workshop with implant models',
      'CBCT interpretation guide',
      'Certificate of completion',
      'Meals included both days',
    ],
    prerequisites: [
      'Active dental license',
      'Basic surgical experience',
    ],
    target_audience: [
      'General Dentists new to implant surgery',
      'Dentists seeking to expand implant skills',
      'Recent graduates interested in surgical training',
    ],
    schedule_topics: [
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'Patient Selection & Treatment Planning', description: 'Case selection criteria, medical considerations, and informed consent' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'Surgical Anatomy', description: 'Critical anatomical landmarks and avoiding complications' },
      { day: 1, time: '01:00 PM - 04:00 PM', topic: 'Hands-On Workshop: Basic Placement', description: 'Implant placement on typodont models' },
      { day: 2, time: '08:30 AM - 10:00 AM', topic: 'CBCT Interpretation', description: 'Reading scans, measuring bone, identifying anatomy' },
      { day: 2, time: '10:15 AM - 12:00 PM', topic: 'Complication Management', description: 'Prevention and management of surgical complications' },
      { day: 2, time: '01:00 PM - 03:00 PM', topic: 'Advanced Hands-On', description: 'Guided surgery and immediate placement cases' },
    ],
    speakers: ['test-dr-carlos-castro', 'test-dr-rodrigo-neiva'],
  },
  {
    title: `${TEST_PREFIX} Periodontal Plastic Surgery Masterclass`,
    slug: 'test-periodontal-plastic-surgery',
    excerpt: 'Advanced soft tissue management techniques for optimal esthetic outcomes.',
    description: `<h2>Master the Art of Soft Tissue Surgery</h2>
<p>This advanced course focuses on periodontal plastic surgery techniques essential for achieving optimal esthetic outcomes in implant and restorative dentistry.</p>

<p>Dr. Maurice Salama brings decades of experience in managing complex soft tissue cases, sharing techniques refined through thousands of procedures.</p>`,
    start_date: getFutureDate(75),
    end_date: getFutureDate(76),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 16,
    capacity: 18,
    featured_image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&h=630&fit=crop',
    status: 'published',
    learning_objectives: [
      'Master connective tissue graft harvesting techniques',
      'Perform tunnel and envelope techniques for root coverage',
      'Achieve predictable esthetic outcomes around implants',
      'Manage recession defects in the esthetic zone',
    ],
    includes: [
      'Pig jaw workshop materials',
      'Micro-surgical instrument overview',
      'Suturing technique guide',
      'Certificate of completion',
    ],
    schedule_topics: [
      { day: 1, time: '08:30 AM - 12:00 PM', topic: 'Soft Tissue Anatomy & Biotype', description: 'Understanding tissue characteristics' },
      { day: 1, time: '01:00 PM - 05:00 PM', topic: 'Connective Tissue Grafting', description: 'Harvesting and placement techniques' },
      { day: 2, time: '08:30 AM - 12:00 PM', topic: 'Live Surgery Observation', description: 'Watch expert perform procedures' },
      { day: 2, time: '01:00 PM - 04:00 PM', topic: 'Pig Jaw Workshop', description: 'Practice all techniques learned' },
    ],
    speakers: ['test-dr-maurice-salama', 'test-dr-rodrigo-neiva'],
  },
];

// ============================================================
// TICKET TYPES
// ============================================================
const createTicketTypes = (eventId: string, eventSlug: string) => {
  const baseDate = new Date();
  const earlyBirdEnd = new Date(baseDate);
  earlyBirdEnd.setDate(earlyBirdEnd.getDate() + 14);

  return [
    {
      event_id: eventId,
      name: 'Early Bird Registration',
      ticket_type: 'early_bird',
      price: eventSlug.includes('prf') ? 1299.00 : eventSlug.includes('plastic') ? 1599.00 : 1099.00,
      quantity: 10,
      sale_start: new Date().toISOString(),
      sale_end: earlyBirdEnd.toISOString(),
      features: ['Priority seating', 'Exclusive course materials', 'Networking dinner invite'],
      status: 'active',
    },
    {
      event_id: eventId,
      name: 'General Admission',
      ticket_type: 'general',
      price: eventSlug.includes('prf') ? 1499.00 : eventSlug.includes('plastic') ? 1899.00 : 1299.00,
      quantity: 15,
      sale_start: new Date().toISOString(),
      sale_end: null,
      features: ['Full course access', 'Course materials', 'Certificate of completion'],
      status: 'active',
    },
    {
      event_id: eventId,
      name: 'VIP Package',
      ticket_type: 'vip',
      price: eventSlug.includes('prf') ? 1999.00 : eventSlug.includes('plastic') ? 2499.00 : 1799.00,
      quantity: 5,
      sale_start: new Date().toISOString(),
      sale_end: null,
      features: ['Front row seating', 'Private lunch with speakers', '1-on-1 consultation time', 'Premium course materials', 'Photo opportunity'],
      status: 'active',
    },
  ];
};

// ============================================================
// MAIN FUNCTIONS
// ============================================================

async function runMigration() {
  console.log('Running migration for new columns...\n');

  // Add new columns if they don't exist
  const alterQueries = [
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[]',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt TEXT',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[]',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS includes TEXT[]',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites TEXT[]',
    'ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience TEXT[]',
  ];

  for (const query of alterQueries) {
    const { error } = await supabase.rpc('exec_sql', { sql: query }).single();
    if (error && !error.message.includes('already exists')) {
      console.log(`Note: ${error.message}`);
    }
  }

  console.log('Migration check complete.\n');
}

async function seedData() {
  console.log('='.repeat(60));
  console.log('GPS Dental Training - Complete Test Data Seeder');
  console.log('='.repeat(60));
  console.log();

  // First, delete existing test data
  console.log('Cleaning up existing test data...\n');
  await deleteTestData(false);

  // Create speakers
  console.log('Creating speakers...\n');
  const speakerMap: { [slug: string]: string } = {};

  for (const speaker of testSpeakers) {
    const { data, error } = await supabase
      .from('speakers')
      .insert(speaker)
      .select()
      .single();

    if (error) {
      console.error(`Failed to create speaker "${speaker.name}":`, error.message);
    } else {
      speakerMap[speaker.slug] = data.id;
      console.log(`Created speaker: ${data.name}`);
    }
  }
  console.log();

  // Create events with all rich data
  console.log('Creating events with rich content...\n');
  const eventMap: { [slug: string]: string } = {};

  for (const event of testEvents) {
    const { speakers: speakerSlugs, ...eventData } = event;

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error(`Failed to create event "${event.title}":`, error.message);
      continue;
    }

    eventMap[event.slug] = data.id;
    console.log(`Created event: ${data.title}`);
    console.log(`  - Date: ${new Date(data.start_date).toLocaleDateString()}`);
    console.log(`  - CE Credits: ${data.ce_credits}`);

    // Link speakers to event
    if (speakerSlugs) {
      for (let i = 0; i < speakerSlugs.length; i++) {
        const speakerId = speakerMap[speakerSlugs[i]];
        if (speakerId) {
          const { error: linkError } = await supabase
            .from('event_speakers')
            .insert({
              event_id: data.id,
              speaker_id: speakerId,
              display_order: i,
            });

          if (linkError) {
            console.error(`  Failed to link speaker:`, linkError.message);
          } else {
            console.log(`  - Linked speaker: ${speakerSlugs[i]}`);
          }
        }
      }
    }

    // Create ticket types
    const ticketTypes = createTicketTypes(data.id, event.slug);
    for (const ticket of ticketTypes) {
      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticket);

      if (ticketError) {
        console.error(`  Failed to create ticket "${ticket.name}":`, ticketError.message);
      } else {
        console.log(`  - Created ticket: ${ticket.name} ($${ticket.price})`);
      }
    }

    console.log();
  }

  console.log('='.repeat(60));
  console.log('Seed data creation complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Test URLs:');
  for (const slug of Object.keys(eventMap)) {
    console.log(`  http://localhost:4321/courses/${slug.replace('test-', '')}`);
  }
  console.log();
  console.log('To delete all test data:');
  console.log('  npx tsx scripts/seed-complete-test-data.ts --delete');
}

async function deleteTestData(verbose = true) {
  if (verbose) {
    console.log('Deleting all test data...\n');
  }

  // Delete event_speakers first (junction table)
  const { data: testEvents } = await supabase
    .from('events')
    .select('id')
    .like('title', `${TEST_PREFIX}%`);

  if (testEvents) {
    for (const event of testEvents) {
      await supabase.from('event_speakers').delete().eq('event_id', event.id);
      await supabase.from('ticket_types').delete().eq('event_id', event.id);
    }
  }

  // Delete events
  const { data: deletedEvents } = await supabase
    .from('events')
    .delete()
    .like('title', `${TEST_PREFIX}%`)
    .select();

  if (verbose && deletedEvents) {
    console.log(`Deleted ${deletedEvents.length} events`);
  }

  // Delete speakers
  const { data: deletedSpeakers } = await supabase
    .from('speakers')
    .delete()
    .like('name', `${TEST_PREFIX}%`)
    .select();

  if (verbose && deletedSpeakers) {
    console.log(`Deleted ${deletedSpeakers.length} speakers`);
  }

  if (verbose) {
    console.log('\nAll test data has been deleted.');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--delete')) {
  deleteTestData();
} else {
  seedData();
}
