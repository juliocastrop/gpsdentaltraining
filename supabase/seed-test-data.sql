-- ============================================================
-- GPS Dental Training - Test Data Seed
-- Run this in Supabase SQL Editor to create test data
-- ============================================================

-- 1. Create a test user
INSERT INTO users (id, clerk_id, email, first_name, last_name, phone, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'user_test123',
  'test@gpsdentaltraining.com',
  'John',
  'Doe',
  '(555) 123-4567',
  'customer'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create test events/courses
INSERT INTO events (id, title, slug, description, start_date, end_date, venue, address, ce_credits, capacity, status, schedule_topics)
VALUES
(
  'e1111111-1111-1111-1111-111111111111',
  'Comprehensive PRF Protocols: Handling & Clinical Integration',
  'comprehensive-prf-protocols-handling-clinical-integration',
  '<p>Join Dr. Joseph Choukroun, the inventor of PRF technology, for this comprehensive two-day course covering advanced platelet-rich fibrin protocols.</p>
  <p>This hands-on course will teach you:</p>
  <ul>
    <li>A-PRF and S-PRF membrane preparation</li>
    <li>Sticky bone technique</li>
    <li>Socket preservation protocols</li>
    <li>Sinus lift applications</li>
  </ul>
  <p>Limited to 24 participants to ensure personalized instruction.</p>',
  '2025-05-01 09:00:00+00',
  '2025-05-02 17:00:00+00',
  'GPS Training Center',
  '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
  15,
  24,
  'published',
  '[
    {"day": 1, "time": "9:00 AM - 10:30 AM", "topic": "Introduction to PRF Protocols", "description": "Overview of A-PRF and S-PRF technology"},
    {"day": 1, "time": "10:45 AM - 12:00 PM", "topic": "Membrane Preparation Techniques", "description": "Hands-on session with centrifuge operation"},
    {"day": 1, "time": "12:00 PM - 1:00 PM", "topic": "Lunch Break", "description": "Networking lunch provided"},
    {"day": 1, "time": "1:00 PM - 3:00 PM", "topic": "Clinical Applications", "description": "Socket preservation and ridge augmentation"},
    {"day": 1, "time": "3:15 PM - 5:00 PM", "topic": "Case Studies", "description": "Review of successful cases"},
    {"day": 2, "time": "9:00 AM - 10:30 AM", "topic": "Advanced Techniques", "description": "Sticky bone preparation"},
    {"day": 2, "time": "10:45 AM - 12:00 PM", "topic": "Sinus Lift Applications", "description": "PRF in sinus augmentation"},
    {"day": 2, "time": "12:00 PM - 1:00 PM", "topic": "Lunch Break", "description": ""},
    {"day": 2, "time": "1:00 PM - 3:00 PM", "topic": "Hands-On Workshop", "description": "Practice on models"},
    {"day": 2, "time": "3:15 PM - 5:00 PM", "topic": "Q&A and Certification", "description": "Final discussion and certificate distribution"}
  ]'::jsonb
),
(
  'e2222222-2222-2222-2222-222222222222',
  'Implant Surgery Fundamentals',
  'implant-surgery-fundamentals',
  '<p>A comprehensive introduction to dental implant surgery covering patient selection, treatment planning, and surgical techniques.</p>
  <p>This course is ideal for general dentists looking to add implant services to their practice.</p>',
  '2025-06-15 09:00:00+00',
  '2025-06-16 17:00:00+00',
  'GPS Training Center',
  '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
  12,
  20,
  'published',
  '[
    {"day": 1, "time": "9:00 AM - 12:00 PM", "topic": "Patient Selection & Treatment Planning", "description": ""},
    {"day": 1, "time": "1:00 PM - 5:00 PM", "topic": "Surgical Anatomy & Techniques", "description": ""},
    {"day": 2, "time": "9:00 AM - 12:00 PM", "topic": "Hands-On Surgical Workshop", "description": ""},
    {"day": 2, "time": "1:00 PM - 5:00 PM", "topic": "Complications & Case Reviews", "description": ""}
  ]'::jsonb
),
(
  'e3333333-3333-3333-3333-333333333333',
  'Digital Dentistry & CAD/CAM Integration',
  'digital-dentistry-cad-cam-integration',
  '<p>Learn how to integrate digital workflows into your practice with this hands-on course covering intraoral scanning, CAD/CAM design, and milling.</p>',
  '2025-07-20 09:00:00+00',
  NULL,
  'GPS Training Center',
  '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
  8,
  16,
  'published',
  '[
    {"day": 1, "time": "9:00 AM - 10:30 AM", "topic": "Introduction to Digital Workflows", "description": ""},
    {"day": 1, "time": "10:45 AM - 12:00 PM", "topic": "Intraoral Scanning Techniques", "description": ""},
    {"day": 1, "time": "1:00 PM - 3:00 PM", "topic": "CAD Design Fundamentals", "description": ""},
    {"day": 1, "time": "3:15 PM - 5:00 PM", "topic": "Milling & Finishing", "description": ""}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  schedule_topics = EXCLUDED.schedule_topics;

-- 3. Create ticket types for each event
INSERT INTO ticket_types (id, event_id, name, ticket_type, price, quantity, sale_start, sale_end, status, features, internal_label)
VALUES
-- PRF Course tickets
(
  't1111111-1111-1111-1111-111111111111',
  'e1111111-1111-1111-1111-111111111111',
  'Early Bird',
  'early_bird',
  1299.00,
  10,
  '2025-01-01 00:00:00+00',
  '2025-03-31 23:59:59+00',
  'active',
  '["Course materials included", "Lunch provided both days", "Certificate of completion", "15 CE credits"]'::jsonb,
  'PRF Early Bird - ends March 31'
),
(
  't1111111-2222-2222-2222-222222222222',
  'e1111111-1111-1111-1111-111111111111',
  'General Admission',
  'general',
  1499.00,
  14,
  '2025-04-01 00:00:00+00',
  '2025-04-30 23:59:59+00',
  'active',
  '["Course materials included", "Lunch provided both days", "Certificate of completion", "15 CE credits"]'::jsonb,
  'PRF General'
),
-- Implant Course tickets
(
  't2222222-1111-1111-1111-111111111111',
  'e2222222-2222-2222-2222-222222222222',
  'Early Bird',
  'early_bird',
  1199.00,
  8,
  '2025-01-01 00:00:00+00',
  '2025-05-15 23:59:59+00',
  'active',
  '["Course materials", "Lunch both days", "12 CE credits"]'::jsonb,
  'Implant Early Bird'
),
(
  't2222222-2222-2222-2222-222222222222',
  'e2222222-2222-2222-2222-222222222222',
  'General Admission',
  'general',
  1399.00,
  12,
  '2025-05-16 00:00:00+00',
  '2025-06-14 23:59:59+00',
  'active',
  '["Course materials", "Lunch both days", "12 CE credits"]'::jsonb,
  'Implant General'
),
-- Digital Dentistry tickets
(
  't3333333-1111-1111-1111-111111111111',
  'e3333333-3333-3333-3333-333333333333',
  'Standard',
  'general',
  899.00,
  16,
  '2025-01-01 00:00:00+00',
  '2025-07-19 23:59:59+00',
  'active',
  '["Hands-on practice", "8 CE credits", "Lunch included"]'::jsonb,
  'Digital Dentistry Standard'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  quantity = EXCLUDED.quantity;

-- 4. Create a test seminar
INSERT INTO seminars (id, title, slug, year, price, capacity, total_sessions, status)
VALUES (
  's1111111-1111-1111-1111-111111111111',
  'GPS Monthly Seminars 2025',
  'gps-monthly-seminars-2025',
  2025,
  750.00,
  30,
  10,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create seminar sessions
INSERT INTO seminar_sessions (id, seminar_id, session_number, session_date, session_time_start, session_time_end, topic, description)
VALUES
('ss111111-0001-0001-0001-000000000001', 's1111111-1111-1111-1111-111111111111', 1, '2025-02-15', '18:00:00', '20:00:00', 'Treatment Planning Strategies', 'Case-based discussion on comprehensive treatment planning'),
('ss111111-0002-0002-0002-000000000002', 's1111111-1111-1111-1111-111111111111', 2, '2025-03-15', '18:00:00', '20:00:00', 'Literature Review: Implant Success Factors', 'Review of recent publications on implant outcomes'),
('ss111111-0003-0003-0003-000000000003', 's1111111-1111-1111-1111-111111111111', 3, '2025-04-19', '18:00:00', '20:00:00', 'Complex Case Presentations', 'Member case presentations and peer review'),
('ss111111-0004-0004-0004-000000000004', 's1111111-1111-1111-1111-111111111111', 4, '2025-05-17', '18:00:00', '20:00:00', 'Periodontal-Prosthetic Integration', 'Multidisciplinary treatment approaches'),
('ss111111-0005-0005-0005-000000000005', 's1111111-1111-1111-1111-111111111111', 5, '2025-06-21', '18:00:00', '20:00:00', 'Digital Workflow Updates', 'Latest advances in digital dentistry'),
('ss111111-0006-0006-0006-000000000006', 's1111111-1111-1111-1111-111111111111', 6, '2025-07-19', '18:00:00', '20:00:00', 'Surgical Complications Management', 'Prevention and treatment of surgical complications'),
('ss111111-0007-0007-0007-000000000007', 's1111111-1111-1111-1111-111111111111', 7, '2025-08-16', '18:00:00', '20:00:00', 'Esthetic Considerations', 'Achieving optimal esthetic outcomes'),
('ss111111-0008-0008-0008-000000000008', 's1111111-1111-1111-1111-111111111111', 8, '2025-09-20', '18:00:00', '20:00:00', 'Full Arch Rehabilitation', 'All-on-X concepts and case planning'),
('ss111111-0009-0009-0009-000000000009', 's1111111-1111-1111-1111-111111111111', 9, '2025-10-18', '18:00:00', '20:00:00', 'Bone Grafting Literature Review', 'Evidence-based approaches to augmentation'),
('ss111111-0010-0010-0010-000000000010', 's1111111-1111-1111-1111-111111111111', 10, '2025-11-15', '18:00:00', '20:00:00', 'Year-End Case Review & Certificates', 'Final presentations and certificate ceremony')
ON CONFLICT (id) DO NOTHING;

-- Verify data was inserted
SELECT 'Events created:' as info, COUNT(*) as count FROM events WHERE status = 'published';
SELECT 'Ticket types created:' as info, COUNT(*) as count FROM ticket_types WHERE status = 'active';
SELECT 'Seminars created:' as info, COUNT(*) as count FROM seminars;
SELECT 'Seminar sessions created:' as info, COUNT(*) as count FROM seminar_sessions;
