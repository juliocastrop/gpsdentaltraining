/**
 * Certificate Configuration - GPS Dental Training
 * Design settings matching WordPress plugin
 */

export const CERTIFICATE_CONFIG = {
  // Colors (GPS Brand)
  colors: {
    navy: '#0C2044',
    navyLight: '#173D84',
    gold: '#DDC89D',
    goldDark: '#BC9D67',
    blue: '#3498db',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
  },

  // Fonts (using standard PDF fonts)
  fonts: {
    title: 'Helvetica-Bold',
    body: 'Helvetica',
    mono: 'Courier',
  },

  // Font Sizes (in points)
  sizes: {
    headerTitle: 20,
    mainTitle: 32,
    subtitle: 14,
    attendeeName: 24,
    eventTitle: 16,
    description: 10,
    date: 11,
    footer: 9,
    paceText: 6.5,
    credits: 18,
  },

  // Page Setup (A4 Landscape)
  page: {
    width: 842, // A4 landscape width in points (297mm)
    height: 595, // A4 landscape height in points (210mm)
    margin: 40,
  },

  // Header Settings
  header: {
    title: 'GPS DENTAL',
    subtitle: 'TRAINING',
    backgroundColor: '#193463',
    textColor: '#FFFFFF',
    height: 80,
  },

  // Content Settings
  content: {
    certificateTitle: 'CERTIFICATE',
    certificateSubtitle: 'OF COMPLETION',
    programProvider: 'GPS Dental Training',
    courseMethodLabel: 'Course Method:',
    courseMethodDefault: 'In Person',
    locationLabel: 'Course Location:',
    instructorLabel: 'Instructor:',
    codeLabelColor: '#BC9D67',
  },

  // PACE Accreditation
  pace: {
    enabled: true,
    text: 'GPS Dental Training is a nationally approved PACE program provider for FAGD/MAGD credit. Approval does not imply acceptance by a state or provincial board of dentistry or AGD endorsement.',
    logoUrl: '/images/pace-logo.png', // Optional
  },

  // QR Code Settings
  qrCode: {
    enabled: true,
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    size: 80,
  },
};

// Course Certificate Description
export const COURSE_CERTIFICATE_DESCRIPTION = `
This certificate acknowledges successful completion of the continuing education course
offered by GPS Dental Training, a PACE-approved provider.
`.trim();

// Seminar Certificate Description
export const SEMINAR_CERTIFICATE_DESCRIPTION = `
This certificate acknowledges participation in the GPS Monthly Seminars program,
a comprehensive continuing education series offered by GPS Dental Training.
`.trim();

// PACE Full Text
export const PACE_FULL_TEXT = `GPS Dental Training LLC is designated as an Approved PACE Program Provider by the Academy of General Dentistry. The formal continuing education programs of this program provider are accepted by AGD for Fellowship, Mastership, and membership maintenance credit. Approval does not imply acceptance by a state or provincial board of dentistry or AGD endorsement. (1/1/2024 to 12/31/2027)`;
