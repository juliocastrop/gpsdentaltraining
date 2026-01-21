/**
 * Seed Database Script
 * Run with: npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mstvdmedcwibnhsymljd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHZkbWVkY3dpYm5oc3ltbGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNzEzMiwiZXhwIjoyMDg0NDkzMTMyfQ.6raVkpyKEUHQ3yYtAzBtnuq8bP9bFfHVDnInUWogKq8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  // 1. Create test user
  console.log('Creating test user...');
  const { error: userError } = await supabase.from('users').upsert({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    clerk_id: 'user_test123',
    email: 'test@gpsdentaltraining.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '(555) 123-4567',
    role: 'customer',
  });
  if (userError) console.error('User error:', userError.message);
  else console.log('✓ Test user created');

  // 2. Create events
  console.log('\nCreating events...');
  const events = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      title: 'Comprehensive PRF Protocols: Handling & Clinical Integration',
      slug: 'comprehensive-prf-protocols-handling-clinical-integration',
      description: `<p>Join Dr. Joseph Choukroun, the inventor of PRF technology, for this comprehensive two-day course covering advanced platelet-rich fibrin protocols.</p>
      <p>This hands-on course will teach you:</p>
      <ul>
        <li>A-PRF and S-PRF membrane preparation</li>
        <li>Sticky bone technique</li>
        <li>Socket preservation protocols</li>
        <li>Sinus lift applications</li>
      </ul>
      <p>Limited to 24 participants to ensure personalized instruction.</p>`,
      start_date: '2025-05-01T09:00:00+00:00',
      end_date: '2025-05-02T17:00:00+00:00',
      venue: 'GPS Training Center',
      address: '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
      ce_credits: 15,
      capacity: 24,
      status: 'published',
      schedule_topics: [
        { day: 1, time: '9:00 AM - 10:30 AM', topic: 'Introduction to PRF Protocols', description: 'Overview of A-PRF and S-PRF technology' },
        { day: 1, time: '10:45 AM - 12:00 PM', topic: 'Membrane Preparation Techniques', description: 'Hands-on session with centrifuge operation' },
        { day: 1, time: '12:00 PM - 1:00 PM', topic: 'Lunch Break', description: 'Networking lunch provided' },
        { day: 1, time: '1:00 PM - 3:00 PM', topic: 'Clinical Applications', description: 'Socket preservation and ridge augmentation' },
        { day: 1, time: '3:15 PM - 5:00 PM', topic: 'Case Studies', description: 'Review of successful cases' },
        { day: 2, time: '9:00 AM - 10:30 AM', topic: 'Advanced Techniques', description: 'Sticky bone preparation' },
        { day: 2, time: '10:45 AM - 12:00 PM', topic: 'Sinus Lift Applications', description: 'PRF in sinus augmentation' },
        { day: 2, time: '12:00 PM - 1:00 PM', topic: 'Lunch Break', description: '' },
        { day: 2, time: '1:00 PM - 3:00 PM', topic: 'Hands-On Workshop', description: 'Practice on models' },
        { day: 2, time: '3:15 PM - 5:00 PM', topic: 'Q&A and Certification', description: 'Final discussion and certificate distribution' },
      ],
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      title: 'Implant Surgery Fundamentals',
      slug: 'implant-surgery-fundamentals',
      description: `<p>A comprehensive introduction to dental implant surgery covering patient selection, treatment planning, and surgical techniques.</p>
      <p>This course is ideal for general dentists looking to add implant services to their practice.</p>`,
      start_date: '2025-06-15T09:00:00+00:00',
      end_date: '2025-06-16T17:00:00+00:00',
      venue: 'GPS Training Center',
      address: '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
      ce_credits: 12,
      capacity: 20,
      status: 'published',
      schedule_topics: [
        { day: 1, time: '9:00 AM - 12:00 PM', topic: 'Patient Selection & Treatment Planning', description: '' },
        { day: 1, time: '1:00 PM - 5:00 PM', topic: 'Surgical Anatomy & Techniques', description: '' },
        { day: 2, time: '9:00 AM - 12:00 PM', topic: 'Hands-On Surgical Workshop', description: '' },
        { day: 2, time: '1:00 PM - 5:00 PM', topic: 'Complications & Case Reviews', description: '' },
      ],
    },
    {
      id: 'e3333333-3333-3333-3333-333333333333',
      title: 'Digital Dentistry & CAD/CAM Integration',
      slug: 'digital-dentistry-cad-cam-integration',
      description: '<p>Learn how to integrate digital workflows into your practice with this hands-on course covering intraoral scanning, CAD/CAM design, and milling.</p>',
      start_date: '2025-07-20T09:00:00+00:00',
      end_date: null,
      venue: 'GPS Training Center',
      address: '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
      ce_credits: 8,
      capacity: 16,
      status: 'published',
      schedule_topics: [
        { day: 1, time: '9:00 AM - 10:30 AM', topic: 'Introduction to Digital Workflows', description: '' },
        { day: 1, time: '10:45 AM - 12:00 PM', topic: 'Intraoral Scanning Techniques', description: '' },
        { day: 1, time: '1:00 PM - 3:00 PM', topic: 'CAD Design Fundamentals', description: '' },
        { day: 1, time: '3:15 PM - 5:00 PM', topic: 'Milling & Finishing', description: '' },
      ],
    },
  ];

  for (const event of events) {
    const { error } = await supabase.from('events').upsert(event);
    if (error) console.error(`Event error (${event.title}):`, error.message);
    else console.log(`✓ Event: ${event.title}`);
  }

  // 3. Create ticket types (let Supabase generate UUIDs)
  console.log('\nCreating ticket types...');
  const ticketTypes = [
    {
      event_id: 'e1111111-1111-1111-1111-111111111111',
      name: 'Early Bird',
      ticket_type: 'early_bird',
      price: 1299.0,
      quantity: 10,
      sale_start: '2025-01-01T00:00:00+00:00',
      sale_end: '2025-03-31T23:59:59+00:00',
      status: 'active',
      features: ['Course materials included', 'Lunch provided both days', 'Certificate of completion', '15 CE credits'],
      internal_label: 'PRF Early Bird - ends March 31',
    },
    {
      event_id: 'e1111111-1111-1111-1111-111111111111',
      name: 'General Admission',
      ticket_type: 'general',
      price: 1499.0,
      quantity: 14,
      sale_start: '2025-04-01T00:00:00+00:00',
      sale_end: '2025-04-30T23:59:59+00:00',
      status: 'active',
      features: ['Course materials included', 'Lunch provided both days', 'Certificate of completion', '15 CE credits'],
      internal_label: 'PRF General',
    },
    {
      event_id: 'e2222222-2222-2222-2222-222222222222',
      name: 'Early Bird',
      ticket_type: 'early_bird',
      price: 1199.0,
      quantity: 8,
      sale_start: '2025-01-01T00:00:00+00:00',
      sale_end: '2025-05-15T23:59:59+00:00',
      status: 'active',
      features: ['Course materials', 'Lunch both days', '12 CE credits'],
      internal_label: 'Implant Early Bird',
    },
    {
      event_id: 'e2222222-2222-2222-2222-222222222222',
      name: 'General Admission',
      ticket_type: 'general',
      price: 1399.0,
      quantity: 12,
      sale_start: '2025-05-16T00:00:00+00:00',
      sale_end: '2025-06-14T23:59:59+00:00',
      status: 'active',
      features: ['Course materials', 'Lunch both days', '12 CE credits'],
      internal_label: 'Implant General',
    },
    {
      event_id: 'e3333333-3333-3333-3333-333333333333',
      name: 'Standard',
      ticket_type: 'general',
      price: 899.0,
      quantity: 16,
      sale_start: '2025-01-01T00:00:00+00:00',
      sale_end: '2025-07-19T23:59:59+00:00',
      status: 'active',
      features: ['Hands-on practice', '8 CE credits', 'Lunch included'],
      internal_label: 'Digital Dentistry Standard',
    },
  ];

  for (const ticket of ticketTypes) {
    const { error } = await supabase.from('ticket_types').insert(ticket);
    if (error) console.error(`Ticket type error (${ticket.name}):`, error.message);
    else console.log(`✓ Ticket: ${ticket.name} for event ${ticket.event_id.slice(0, 8)}...`);
  }

  // 4. Create seminar (let Supabase generate UUID)
  console.log('\nCreating seminar...');
  const { data: seminarData, error: seminarError } = await supabase.from('seminars').insert({
    title: 'GPS Monthly Seminars 2025',
    slug: 'gps-monthly-seminars-2025',
    year: 2025,
    price: 750.0,
    capacity: 30,
    total_sessions: 10,
    status: 'active',
  }).select().single();

  if (seminarError) {
    console.error('Seminar error:', seminarError.message);
  } else {
    console.log('✓ Seminar: GPS Monthly Seminars 2025');

    // 5. Create seminar sessions using the generated seminar ID
    console.log('\nCreating seminar sessions...');
    const sessions = [
      { seminar_id: seminarData.id, session_number: 1, session_date: '2025-02-15', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Treatment Planning Strategies', description: 'Case-based discussion on comprehensive treatment planning' },
      { seminar_id: seminarData.id, session_number: 2, session_date: '2025-03-15', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Literature Review: Implant Success Factors', description: 'Review of recent publications on implant outcomes' },
      { seminar_id: seminarData.id, session_number: 3, session_date: '2025-04-19', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Complex Case Presentations', description: 'Member case presentations and peer review' },
      { seminar_id: seminarData.id, session_number: 4, session_date: '2025-05-17', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Periodontal-Prosthetic Integration', description: 'Multidisciplinary treatment approaches' },
      { seminar_id: seminarData.id, session_number: 5, session_date: '2025-06-21', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Digital Workflow Updates', description: 'Latest advances in digital dentistry' },
      { seminar_id: seminarData.id, session_number: 6, session_date: '2025-07-19', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Surgical Complications Management', description: 'Prevention and treatment of surgical complications' },
      { seminar_id: seminarData.id, session_number: 7, session_date: '2025-08-16', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Esthetic Considerations', description: 'Achieving optimal esthetic outcomes' },
      { seminar_id: seminarData.id, session_number: 8, session_date: '2025-09-20', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Full Arch Rehabilitation', description: 'All-on-X concepts and case planning' },
      { seminar_id: seminarData.id, session_number: 9, session_date: '2025-10-18', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Bone Grafting Literature Review', description: 'Evidence-based approaches to augmentation' },
      { seminar_id: seminarData.id, session_number: 10, session_date: '2025-11-15', session_time_start: '18:00:00', session_time_end: '20:00:00', topic: 'Year-End Case Review & Certificates', description: 'Final presentations and certificate ceremony' },
    ];

    for (const session of sessions) {
      const { error } = await supabase.from('seminar_sessions').insert(session);
      if (error) console.error(`Session error (${session.session_number}):`, error.message);
      else console.log(`✓ Session ${session.session_number}: ${session.topic}`);
    }
  }

  // Verify counts
  console.log('\n--- Summary ---');
  const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published');
  const { count: ticketCount } = await supabase.from('ticket_types').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: seminarCount } = await supabase.from('seminars').select('*', { count: 'exact', head: true });
  const { count: sessionCount } = await supabase.from('seminar_sessions').select('*', { count: 'exact', head: true });

  console.log(`Events: ${eventCount}`);
  console.log(`Ticket Types: ${ticketCount}`);
  console.log(`Seminars: ${seminarCount}`);
  console.log(`Seminar Sessions: ${sessionCount}`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nYou can now test:');
  console.log('- http://localhost:4325 (Homepage)');
  console.log('- http://localhost:4325/courses (Course list)');
  console.log('- http://localhost:4325/courses/comprehensive-prf-protocols-handling-clinical-integration');
  console.log('- http://localhost:4325/api/events');
}

seedDatabase().catch(console.error);
