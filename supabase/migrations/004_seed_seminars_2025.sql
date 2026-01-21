-- GPS Dental Training - Seed Data for 2025 Monthly Seminars
-- Creates the 2025 season with 10 sessions and moderator

-- First, create the moderator speaker (Dr. Carlos Castro)
INSERT INTO speakers (id, name, slug, title, bio, photo_url, social_links)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Carlos Castro, DDS',
  'carlos-castro',
  'Prosthodontist',
  'Dr. Carlos Castro is a board-certified prosthodontist with over 20 years of experience in complex restorative dentistry, implant prosthodontics, and full-mouth rehabilitation. He is the founder and director of GPS Dental Training, where he leads the Monthly Seminars program and various continuing education courses. Dr. Castro is passionate about advancing clinical excellence through evidence-based education and collaborative learning.',
  NULL,
  '{"linkedin": "https://www.linkedin.com/in/drcarloscastro"}'::JSONB
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  bio = EXCLUDED.bio;

-- Create the 2025 Monthly Seminars season
INSERT INTO seminars (
  id,
  title,
  slug,
  year,
  description,
  subtitle,
  program_description,
  price,
  capacity,
  total_sessions,
  credits_per_session,
  total_credits,
  session_duration,
  venue,
  address,
  contact_email,
  contact_phone,
  benefits,
  membership_policy,
  refund_policy,
  makeup_policy,
  agenda_items,
  certificate_dates,
  accreditation_text,
  status
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  'GPS Monthly Seminars 2025',
  '2025-monthly-seminars',
  2025,
  'A comprehensive 10-session cycle dedicated to Literature Review, Case Discussions, and Treatment Planning Seminars.',
  'Engage in a 10-session cycle dedicated to Literature Review, Case Discussions, and Treatment Planning Seminars',
  '<p>Our Monthly Seminars program offers dental professionals an exceptional opportunity to enhance their clinical knowledge through interactive discussions, case presentations, and evidence-based practice reviews.</p>
<p>Each session is designed to provide practical insights that you can immediately apply in your practice. Topics rotate throughout the year to cover a comprehensive range of subjects including:</p>
<ul>
<li>Complex case treatment planning</li>
<li>Current literature review and discussion</li>
<li>Implant case presentations</li>
<li>Prosthodontic challenges and solutions</li>
<li>Interdisciplinary treatment approaches</li>
</ul>
<p>Join our community of dedicated dental professionals committed to continuous learning and clinical excellence.</p>',
  750.00,
  25,
  10,
  2.00,
  20.00,
  '2 hours',
  'GPS Training Center',
  '6320 Sugarloaf Parkway, Duluth, GA 30097',
  'gpsdentaltraining@gaprostho.com',
  '(770) 814-2883',
  ARRAY[
    'Literature Review Sessions',
    'Case Discussions and Presentations',
    'Treatment Planning Seminars',
    'Surgical Seminars',
    'Peer Networking Opportunities',
    'Interactive Q&A Sessions'
  ],
  '<p>Membership begins at the next available session and concludes after completing 10 consecutive sessions.</p>
<p>Attendance is mandatory to receive CE credits for each session. Members who miss a session can schedule ONE make-up session per calendar year.</p>
<p>Certificates are issued bi-annually on June 30 and December 31 for completed sessions.</p>',
  'Tuition is non-refundable and non-transferable once enrolled.',
  'Only ONE make-up session is allowed per calendar year. Make-up sessions must be scheduled within 60 days of the missed session.',
  '[
    {"time": "5:45 PM - 6:00 PM", "title": "Meet and Greet", "description": "Networking, refreshments, and introductions"},
    {"time": "6:00 PM - 7:45 PM", "title": "Main Session", "description": "Core content, presentations, and interactive discussions"},
    {"time": "7:45 PM - 8:00 PM", "title": "Summary & Conclusions", "description": "Key takeaways, Q&A, and wrap-up"}
  ]'::JSONB,
  '["June 30", "December 31"]'::JSONB,
  'GPS Dental Training is an AGD PACE-approved provider. PACE approval does not imply acceptance by a state or provincial board of dentistry. Approval term: 01/01/2024 to 12/31/2027. Provider ID: 123456',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  description = EXCLUDED.description,
  subtitle = EXCLUDED.subtitle,
  program_description = EXCLUDED.program_description,
  price = EXCLUDED.price,
  capacity = EXCLUDED.capacity,
  total_sessions = EXCLUDED.total_sessions,
  credits_per_session = EXCLUDED.credits_per_session,
  total_credits = EXCLUDED.total_credits,
  session_duration = EXCLUDED.session_duration,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  benefits = EXCLUDED.benefits,
  membership_policy = EXCLUDED.membership_policy,
  refund_policy = EXCLUDED.refund_policy,
  makeup_policy = EXCLUDED.makeup_policy,
  agenda_items = EXCLUDED.agenda_items,
  certificate_dates = EXCLUDED.certificate_dates,
  accreditation_text = EXCLUDED.accreditation_text,
  status = EXCLUDED.status;

-- Link the moderator to the seminar
INSERT INTO seminar_moderators (seminar_id, speaker_id, role, display_order)
VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  '550e8400-e29b-41d4-a716-446655440001',
  'moderator',
  1
)
ON CONFLICT (seminar_id, speaker_id) DO UPDATE SET
  role = EXCLUDED.role,
  display_order = EXCLUDED.display_order;

-- Create 10 sessions for 2025 (one per month, skipping July and August for summer break)
-- Sessions: Jan, Feb, Mar, Apr, May, Jun, Sep, Oct, Nov, Dec

INSERT INTO seminar_sessions (seminar_id, session_number, session_date, session_time_start, session_time_end, topic, description)
VALUES
  -- Session 1 - January
  (
    '550e8400-e29b-41d4-a716-446655440100',
    1,
    '2025-01-23',
    '18:00:00',
    '20:00:00',
    'Treatment Planning Fundamentals',
    'Comprehensive approach to complex case treatment planning with focus on systematic evaluation and documentation.'
  ),
  -- Session 2 - February
  (
    '550e8400-e29b-41d4-a716-446655440100',
    2,
    '2025-02-27',
    '18:00:00',
    '20:00:00',
    'Literature Review: Implant Success Factors',
    'Critical analysis of recent publications on factors affecting implant success and survival rates.'
  ),
  -- Session 3 - March
  (
    '550e8400-e29b-41d4-a716-446655440100',
    3,
    '2025-03-27',
    '18:00:00',
    '20:00:00',
    'Complex Case Presentations I',
    'Member case presentations featuring challenging prosthodontic cases with peer discussion and collaborative treatment planning.'
  ),
  -- Session 4 - April
  (
    '550e8400-e29b-41d4-a716-446655440100',
    4,
    '2025-04-24',
    '18:00:00',
    '20:00:00',
    'Full Mouth Rehabilitation Concepts',
    'Principles and protocols for comprehensive full mouth rehabilitation cases including occlusal considerations.'
  ),
  -- Session 5 - May
  (
    '550e8400-e29b-41d4-a716-446655440100',
    5,
    '2025-05-22',
    '18:00:00',
    '20:00:00',
    'Digital Workflow Integration',
    'Incorporating digital technologies into treatment planning and execution for improved outcomes.'
  ),
  -- Session 6 - June
  (
    '550e8400-e29b-41d4-a716-446655440100',
    6,
    '2025-06-26',
    '18:00:00',
    '20:00:00',
    'Literature Review: Bone Grafting Updates',
    'Review of current evidence on bone grafting materials, techniques, and outcomes in implant dentistry.'
  ),
  -- Session 7 - September (after summer break)
  (
    '550e8400-e29b-41d4-a716-446655440100',
    7,
    '2025-09-25',
    '18:00:00',
    '20:00:00',
    'Complex Case Presentations II',
    'Continuation of member case presentations with focus on interdisciplinary treatment approaches.'
  ),
  -- Session 8 - October
  (
    '550e8400-e29b-41d4-a716-446655440100',
    8,
    '2025-10-23',
    '18:00:00',
    '20:00:00',
    'Surgical Seminar: Soft Tissue Management',
    'Techniques for optimal soft tissue management around implants and natural teeth.'
  ),
  -- Session 9 - November
  (
    '550e8400-e29b-41d4-a716-446655440100',
    9,
    '2025-11-20',
    '18:00:00',
    '20:00:00',
    'Esthetic Dentistry Principles',
    'Principles of smile design and esthetic treatment planning for anterior restorations.'
  ),
  -- Session 10 - December
  (
    '550e8400-e29b-41d4-a716-446655440100',
    10,
    '2025-12-18',
    '18:00:00',
    '20:00:00',
    'Year in Review & Case Wrap-up',
    'Annual review of key learnings, final case presentations, and certificate distribution.'
  )
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
DO $$
DECLARE
  seminar_count INTEGER;
  session_count INTEGER;
  moderator_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO seminar_count FROM seminars WHERE slug = '2025-monthly-seminars';
  SELECT COUNT(*) INTO session_count FROM seminar_sessions WHERE seminar_id = '550e8400-e29b-41d4-a716-446655440100';
  SELECT COUNT(*) INTO moderator_count FROM seminar_moderators WHERE seminar_id = '550e8400-e29b-41d4-a716-446655440100';

  RAISE NOTICE 'Seed data verification:';
  RAISE NOTICE '  - Seminars: % (expected: 1)', seminar_count;
  RAISE NOTICE '  - Sessions: % (expected: 10)', session_count;
  RAISE NOTICE '  - Moderators: % (expected: 1)', moderator_count;
END $$;
