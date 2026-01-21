/**
 * Seed Test Data v3 - With Learning Objectives
 * First adds the learning_objectives column if missing, then seeds data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mstvdmedcwibnhsymljd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHZkbWVkY3dpYm5oc3ltbGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNzEzMiwiZXhwIjoyMDg0NDkzMTMyfQ.6raVkpyKEUHQ3yYtAzBtnuq8bP9bFfHVDnInUWogKq8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TEST_PREFIX = '[TEST]';

const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Speakers
const testSpeakers = [
  {
    name: `${TEST_PREFIX} Dr. Joseph Choukroun`,
    slug: 'test-dr-joseph-choukroun',
    title: 'MD, PhD - Inventor of PRF Technology',
    bio: `Dr. Joseph Choukroun is a world-renowned physician and researcher who invented the Platelet-Rich Fibrin (PRF) technique in 2001. His groundbreaking work has revolutionized regenerative medicine and tissue engineering in dentistry.

With over 30 years of experience in pain management and regenerative medicine, Dr. Choukroun has trained thousands of clinicians worldwide in PRF protocols.`,
    photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    social_links: { linkedin: 'https://linkedin.com/in/josephchoukroun', website: 'https://prfeducation.com' },
  },
  {
    name: `${TEST_PREFIX} Dr. Carlos Castro`,
    slug: 'test-dr-carlos-castro',
    title: 'DDS, Prosthodontist - GPS Director',
    bio: `Dr. Carlos Castro is the founder and director of GPS Dental Training, bringing over 25 years of experience in prosthodontics and implant dentistry.

As a board-certified prosthodontist, Dr. Castro specializes in complex full-mouth rehabilitation, digital dentistry, and implant prosthetics.`,
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
    social_links: { linkedin: 'https://linkedin.com/in/drcarloscastro', twitter: 'https://twitter.com/drcarloscastro' },
  },
  {
    name: `${TEST_PREFIX} Dr. Maurice Salama`,
    slug: 'test-dr-maurice-salama',
    title: 'DMD - Periodontics & Implant Esthetics',
    bio: `Dr. Maurice Salama is an internationally recognized leader in periodontics and implant esthetics. He maintains a private practice in Atlanta, Georgia, focusing on complex esthetic and implant cases.`,
    photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    social_links: { linkedin: 'https://linkedin.com/in/mauricesalama' },
  },
];

// Events with learning_objectives
const testEvents = [
  {
    title: `${TEST_PREFIX} Comprehensive PRF Protocols`,
    slug: 'test-comprehensive-prf-protocols',
    description: `<h2>Transform Your Practice with PRF Technology</h2>
<p>Join Dr. Joseph Choukroun, the inventor of PRF technology, for an intensive two-day course that will revolutionize your approach to tissue regeneration and wound healing.</p>

<p>This comprehensive program covers everything from the biological principles behind platelet concentrates to advanced clinical applications. You'll gain hands-on experience with multiple PRF protocols and learn how to integrate them seamlessly into your daily practice.</p>

<h3>What Sets This Course Apart</h3>
<p>Unlike other PRF courses, this program is taught by the inventor himself, ensuring you receive the most accurate and up-to-date information. Dr. Choukroun's unique teaching style combines scientific rigor with practical clinical insights.</p>

<h3>What's Included</h3>
<ul>
<li>Comprehensive course materials and protocol guides</li>
<li>Hands-on practice with PRF preparation</li>
<li>Live patient demonstration observation</li>
<li>Certificate of completion with CE credits</li>
<li>Breakfast and lunch both days</li>
<li>Access to online resources for 1 year</li>
</ul>`,
    learning_objectives: [
      'Understand the biology of platelet concentrates and growth factor release kinetics',
      'Master the preparation of A-PRF, L-PRF, and i-PRF using standardized protocols',
      'Apply the sticky bone technique for ridge augmentation and socket preservation',
      'Integrate PRF membranes into extraction and immediate implant procedures',
      'Combine PRF with various bone graft materials for optimal regeneration',
    ],
    start_date: getFutureDate(30),
    end_date: getFutureDate(31),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 15,
    capacity: 24,
    featured_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=630&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '08:00 AM - 08:30 AM', topic: 'Registration & Welcome Coffee', description: 'Check-in, materials distribution' },
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'PRF Biology & Science', description: 'Understanding platelet concentrates, growth factors, and healing cascades' },
      { day: 1, time: '10:00 AM - 10:15 AM', topic: 'Coffee Break' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'Lab 1: A-PRF & L-PRF Protocols', description: 'Hands-on preparation of PRF membranes and plugs' },
      { day: 1, time: '12:00 PM - 01:00 PM', topic: 'Lunch', description: 'Networking lunch provided' },
      { day: 1, time: '01:00 PM - 03:00 PM', topic: 'Clinical Applications Part I', description: 'Socket preservation and ridge maintenance' },
      { day: 1, time: '03:00 PM - 03:15 PM', topic: 'Afternoon Break' },
      { day: 1, time: '03:15 PM - 05:00 PM', topic: 'Sticky Bone Technique', description: 'Ridge augmentation with PRF-enhanced bone grafts' },
      { day: 2, time: '08:00 AM - 10:00 AM', topic: 'i-PRF (Injectable PRF)', description: 'Preparation, applications, and combination therapies' },
      { day: 2, time: '10:00 AM - 10:15 AM', topic: 'Coffee Break' },
      { day: 2, time: '10:15 AM - 12:00 PM', topic: 'Live Patient Demonstration', description: 'Observe PRF-enhanced surgical procedures' },
      { day: 2, time: '12:00 PM - 01:00 PM', topic: 'Lunch' },
      { day: 2, time: '01:00 PM - 03:00 PM', topic: 'Sinus Lift with PRF', description: 'Membrane applications for sinus augmentation' },
      { day: 2, time: '03:00 PM - 04:30 PM', topic: 'Case Discussion & Q&A', description: 'Complex cases, troubleshooting, and best practices' },
      { day: 2, time: '04:30 PM - 05:00 PM', topic: 'Certification Ceremony', description: 'Certificate distribution and group photo' },
    ],
    speakers: ['test-dr-joseph-choukroun', 'test-dr-carlos-castro'],
  },
  {
    title: `${TEST_PREFIX} Implant Surgery Fundamentals`,
    slug: 'test-implant-surgery-fundamentals',
    description: `<h2>Build Your Foundation in Implant Dentistry</h2>
<p>This two-day intensive course is designed for general dentists who want to add implant surgery to their clinical repertoire. Learn from experienced implant surgeons and gain the confidence to place your first implants.</p>

<h3>Who Should Attend</h3>
<p>This course is ideal for general dentists new to implant surgery, dentists wanting to refresh their surgical skills, and those looking to expand their practice with implant services.</p>`,
    learning_objectives: [
      'Evaluate patients for implant treatment using proper diagnostic criteria',
      'Interpret CBCT scans for surgical planning and risk assessment',
      'Master flap design and tissue management for implant surgery',
      'Perform basic implant placement in favorable anatomical conditions',
      'Recognize and manage common surgical complications',
    ],
    start_date: getFutureDate(45),
    end_date: getFutureDate(46),
    venue: 'GPS Training Center',
    address: '6320 Sugarloaf Parkway, Duluth, GA 30097',
    ce_credits: 14,
    capacity: 20,
    featured_image_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=630&fit=crop',
    status: 'published',
    schedule_topics: [
      { day: 1, time: '08:00 AM - 08:30 AM', topic: 'Registration & Welcome' },
      { day: 1, time: '08:30 AM - 10:00 AM', topic: 'Patient Selection & Treatment Planning', description: 'Case selection criteria and risk assessment' },
      { day: 1, time: '10:15 AM - 12:00 PM', topic: 'Surgical Anatomy Review', description: 'Critical anatomical landmarks and danger zones' },
      { day: 1, time: '12:00 PM - 01:00 PM', topic: 'Lunch' },
      { day: 1, time: '01:00 PM - 04:00 PM', topic: 'Hands-On Lab: Basic Implant Placement', description: 'Implant placement on simulation models' },
      { day: 2, time: '08:30 AM - 10:00 AM', topic: 'CBCT Interpretation Workshop', description: 'Hands-on scan analysis and planning' },
      { day: 2, time: '10:15 AM - 12:00 PM', topic: 'Complication Prevention & Management', description: 'Avoiding and managing common complications' },
      { day: 2, time: '12:00 PM - 01:00 PM', topic: 'Lunch' },
      { day: 2, time: '01:00 PM - 03:00 PM', topic: 'Introduction to Guided Surgery', description: 'Digital planning and surgical guides' },
      { day: 2, time: '03:00 PM - 04:00 PM', topic: 'Case Presentations & Certification', description: 'Discussion and certificate ceremony' },
    ],
    speakers: ['test-dr-carlos-castro'],
  },
];

// Ticket types
const createTicketTypes = (eventId: string, slug: string) => {
  const earlyBirdEnd = new Date();
  earlyBirdEnd.setDate(earlyBirdEnd.getDate() + 14);

  const basePrice = slug.includes('prf') ? 1299 : 1099;

  return [
    {
      event_id: eventId,
      name: 'Early Bird',
      ticket_type: 'early_bird',
      price: basePrice,
      quantity: 10,
      sale_start: new Date().toISOString(),
      sale_end: earlyBirdEnd.toISOString(),
      features: ['Priority seating', 'Networking dinner invite', 'Exclusive materials'],
      status: 'active',
    },
    {
      event_id: eventId,
      name: 'General Admission',
      ticket_type: 'general',
      price: basePrice + 200,
      quantity: 15,
      sale_start: new Date().toISOString(),
      sale_end: null,
      features: ['Full course access', 'Course materials', 'Certificate'],
      status: 'active',
    },
    {
      event_id: eventId,
      name: 'VIP Experience',
      ticket_type: 'vip',
      price: basePrice + 500,
      quantity: 5,
      sale_start: new Date().toISOString(),
      sale_end: null,
      features: ['Front row seating', 'Private lunch with speakers', '1-on-1 consultation', 'Premium materials', 'Photo opportunity'],
      status: 'active',
    },
  ];
};

async function ensureLearningObjectivesColumn() {
  console.log('Checking for learning_objectives column...');

  // Try to add the column - it will fail silently if already exists
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];`
  });

  if (error) {
    // Try direct approach if RPC not available
    console.log('  Note: Could not verify column via RPC, proceeding with seed...');
  } else {
    console.log('  Column verified/created successfully');
  }
}

async function deleteTestData() {
  console.log('Deleting existing test data...\n');

  const { data: events } = await supabase.from('events').select('id').like('title', `${TEST_PREFIX}%`);
  if (events) {
    for (const event of events) {
      await supabase.from('event_speakers').delete().eq('event_id', event.id);
      await supabase.from('ticket_types').delete().eq('event_id', event.id);
    }
  }

  await supabase.from('events').delete().like('title', `${TEST_PREFIX}%`);
  await supabase.from('speakers').delete().like('name', `${TEST_PREFIX}%`);
}

async function seedData() {
  console.log('='.repeat(60));
  console.log('GPS Dental Training - Test Data Seeder v3');
  console.log('With Learning Objectives');
  console.log('='.repeat(60));
  console.log();

  await ensureLearningObjectivesColumn();
  console.log();

  await deleteTestData();

  // Create speakers
  console.log('Creating speakers...\n');
  const speakerMap: Record<string, string> = {};

  for (const speaker of testSpeakers) {
    const { data, error } = await supabase.from('speakers').insert(speaker).select().single();
    if (error) {
      console.error(`Failed: ${speaker.name}`, error.message);
    } else {
      speakerMap[speaker.slug] = data.id;
      console.log(`Created: ${data.name}`);
    }
  }
  console.log();

  // Create events
  console.log('Creating events...\n');
  for (const event of testEvents) {
    const { speakers: speakerSlugs, ...eventData } = event;

    const { data, error } = await supabase.from('events').insert(eventData).select().single();
    if (error) {
      console.error(`Failed: ${event.title}`, error.message);

      // If learning_objectives column doesn't exist, try without it
      if (error.message.includes('learning_objectives')) {
        console.log('  Retrying without learning_objectives...');
        const { learning_objectives, ...eventDataWithoutObjectives } = eventData;
        const { data: retryData, error: retryError } = await supabase.from('events').insert(eventDataWithoutObjectives).select().single();
        if (retryError) {
          console.error('  Retry failed:', retryError.message);
          continue;
        }
        console.log(`  Created (without objectives): ${retryData.title}`);
        // Continue with retryData
        await processEvent(retryData, speakerSlugs, speakerMap);
        continue;
      }
      continue;
    }

    await processEvent(data, speakerSlugs, speakerMap);
  }

  console.log('='.repeat(60));
  console.log('Done! Visit:');
  console.log('  http://localhost:4321/courses/test-comprehensive-prf-protocols');
  console.log('  http://localhost:4321/courses/test-implant-surgery-fundamentals');
  console.log('='.repeat(60));
}

async function processEvent(data: any, speakerSlugs: string[] | undefined, speakerMap: Record<string, string>) {
  console.log(`Created: ${data.title}`);
  console.log(`  Slug: ${data.slug}`);
  console.log(`  CE Credits: ${data.ce_credits}`);
  console.log(`  Date: ${new Date(data.start_date).toLocaleDateString()}`);
  if (data.learning_objectives) {
    console.log(`  Objectives: ${data.learning_objectives.length} items`);
  }

  // Link speakers
  if (speakerSlugs) {
    for (let i = 0; i < speakerSlugs.length; i++) {
      const speakerId = speakerMap[speakerSlugs[i]];
      if (speakerId) {
        await supabase.from('event_speakers').insert({
          event_id: data.id,
          speaker_id: speakerId,
          display_order: i,
        });
        console.log(`  Linked: ${speakerSlugs[i]}`);
      }
    }
  }

  // Create tickets
  const tickets = createTicketTypes(data.id, data.slug);
  for (const ticket of tickets) {
    const { error: ticketError } = await supabase.from('ticket_types').insert(ticket);
    if (ticketError) {
      console.error(`  Ticket failed: ${ticket.name}`, ticketError.message);
    } else {
      console.log(`  Ticket: ${ticket.name} - $${ticket.price}`);
    }
  }
  console.log();
}

seedData();
