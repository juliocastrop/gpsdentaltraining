-- GPS Dental Training - Seed Team Members and Content
-- Creates initial team members for About page

-- ============================================================
-- TEAM MEMBERS SEED DATA
-- ============================================================

INSERT INTO team_members (name, slug, title, credentials, role, bio, short_bio, photo_url, display_order, is_featured, status)
VALUES
  (
    'Carlos Castro',
    'carlos-castro',
    'Founder & Program Director',
    'DDS, FACP',
    'founder',
    'Dr. Castro is a board-certified prosthodontist with a Fellowship from Columbia University College of Dental Medicine. As founder and director of GPS Dental Training, he brings over 20 years of clinical experience in complex restorative dentistry, implant prosthodontics, and full-mouth rehabilitation. His commitment to evidence-based education has made GPS a premier destination for dental professionals seeking advanced training.

Dr. Castro maintains an active clinical practice at the GPS Dental Implant Center, where he treats complex cases and provides mentorship to course participants. His approach combines traditional prosthodontic principles with cutting-edge digital workflows and regenerative techniques.',
    'Board-certified prosthodontist with 20+ years of clinical experience in complex restorative dentistry and implant prosthodontics.',
    'https://gpsdentaltraining.com/wp-content/uploads/slider4/img-dr-carlos-castro.jpg',
    1,
    true,
    'active'
  ),
  (
    'Alessandro Cucchiaro',
    'alessandro-cucchiaro',
    'European Master Dental Technician',
    'MDT',
    'lab_director',
    'Alessandro is a European-trained Master Dental Technician with international credentials in advanced prosthetic fabrication. His expertise spans CAD/CAM technology, ceramic restorations, and implant-supported prosthetics. At GPS, he leads the in-house Prostho Dental Lab and teaches hands-on laboratory techniques to clinicians and technicians.

With training from prestigious European dental technology programs, Alessandro brings a unique perspective on esthetic dentistry and precision fabrication. His work has been featured in numerous dental publications, and he regularly collaborates with clinicians on complex full-mouth rehabilitation cases.',
    'European-trained Master Dental Technician specializing in CAD/CAM technology and advanced prosthetic fabrication.',
    'https://gpsdentaltraining.com/wp-content/uploads/slider4/alessandro.png',
    2,
    true,
    'active'
  ),
  (
    'David Li',
    'david-li',
    'International Master Dental Technician',
    'MDT',
    'senior_instructor',
    'David brings international training and expertise in complex dental restorations to the GPS team. Specializing in esthetic and implant restorations, he works closely with clinicians to achieve optimal outcomes. His meticulous approach to prosthetic design has earned recognition throughout the dental community.

At GPS Dental Training, David leads hands-on workshops focusing on implant prosthetics, ceramic layering techniques, and digital workflow integration. His patient-centered approach emphasizes both function and esthetics in every restoration.',
    'International Master Dental Technician specializing in esthetic and implant restorations.',
    'https://gpsdentaltraining.com/wp-content/uploads/slider4/david.png',
    3,
    true,
    'active'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  credentials = EXCLUDED.credentials,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  short_bio = EXCLUDED.short_bio,
  photo_url = EXCLUDED.photo_url,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  status = EXCLUDED.status;

-- ============================================================
-- PARTNERS / ACCREDITATIONS SEED DATA
-- ============================================================

INSERT INTO partners (name, slug, logo_url, website_url, description, partner_type, display_order, status)
VALUES
  (
    'PACE',
    'pace',
    null,
    'https://www.agd.org/pace',
    'GPS Dental Training is a nationally approved PACE Program Provider for FAGD/MAGD credit. Approval does not imply acceptance by any regulatory authority or AGD endorsement. Approval term: 01/01/2024 to 12/31/2027.',
    'accreditation',
    1,
    'active'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  partner_type = EXCLUDED.partner_type,
  display_order = EXCLUDED.display_order;

-- ============================================================
-- ABOUT PAGE CONTENT
-- ============================================================

INSERT INTO pages (slug, title, subtitle, hero_image_url, content, meta_title, meta_description, status)
VALUES
  (
    'about',
    'About Us',
    'Georgia Prosthodontics Study Club & Training Center',
    'https://gpsdentaltraining.com/wp-content/uploads/2025/06/image-building-unique-facility.jpg.webp',
    '{
      "mission": "To provide advanced dental education that enhances the knowledge, skills, and abilities of dental professionals, empowering them to deliver exceptional patient care.",
      "vision": "To be the leading provider of specialized dental training through collaborative partnerships, innovative techniques, and individualized mentorship programs.",
      "stats": [
        {"value": "15+", "label": "Years of Excellence"},
        {"value": "1,000+", "label": "Professionals Trained", "accent": true},
        {"value": "100+", "label": "Courses Delivered"},
        {"value": "10,000+", "label": "CE Credits Awarded"}
      ],
      "location": {
        "address": "6320 Sugarloaf Parkway",
        "city": "Duluth",
        "state": "GA",
        "zip": "30097",
        "description": "Easy access via I-85, near hotels, restaurants, and convention centers"
      },
      "facilities": [
        {
          "name": "Clinical Settings",
          "description": "Access to the Dental Implant Center with real patient cases and live surgical demonstrations.",
          "icon": "clinical"
        },
        {
          "name": "Prostho Dental Lab",
          "description": "In-house laboratory equipped with cutting-edge CAD/CAM technology and milling equipment.",
          "icon": "lab"
        },
        {
          "name": "Digital Technology",
          "description": "CBCT imaging, intraoral scanners, and digital surgical planning software for comprehensive training.",
          "icon": "digital"
        }
      ]
    }'::JSONB,
    'About GPS Dental Training | Advanced Dental Education in Georgia',
    'Learn about GPS Dental Training - Georgia''s premier destination for advanced dental education in implantology, prosthodontics, and digital dentistry.',
    'published'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description;

-- ============================================================
-- CONTACT PAGE CONTENT
-- ============================================================

INSERT INTO pages (slug, title, subtitle, content, meta_title, meta_description, status)
VALUES
  (
    'contact',
    'Contact Us',
    'Get in Touch with GPS Dental Training',
    '{
      "address": {
        "line1": "6320 Sugarloaf Parkway",
        "city": "Duluth",
        "state": "GA",
        "zip": "30097",
        "country": "United States"
      },
      "phone": "(770) 232-0240",
      "email": "info@gpsdentaltraining.com",
      "hours": {
        "weekdays": "Monday - Friday: 8:00 AM - 5:00 PM EST",
        "weekend": "Saturday - Sunday: Closed"
      },
      "social": {
        "facebook": "https://www.facebook.com/gpsdentaltraining",
        "instagram": "https://www.instagram.com/gpsdentaltraining",
        "linkedin": "https://www.linkedin.com/company/gps-dental-training",
        "youtube": "https://www.youtube.com/@gpsdentaltraining"
      },
      "map_embed_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.0!2d-84.1!3d34.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDAzJzM2LjAiTiA4NMKwMDYnMDAuMCJX!5e0!3m2!1sen!2sus!4v1234567890"
    }'::JSONB,
    'Contact GPS Dental Training | Duluth, Georgia',
    'Contact GPS Dental Training for information about our dental courses, seminars, and continuing education programs in Duluth, Georgia.',
    'published'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description;

COMMENT ON TABLE team_members IS 'Team members data seeded for About page';
