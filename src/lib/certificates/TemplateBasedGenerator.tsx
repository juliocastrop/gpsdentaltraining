/**
 * Template-Based Certificate PDF Generator - GPS Dental Training
 * Generates PDF certificates using configurable templates from the database
 * This replaces the static CourseCertificateTemplate and SeminarCertificateTemplate
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import sharp from 'sharp';
import type { CertificateTemplate } from '../../types/database';

const BASE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com';

// Register Montserrat font
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w-.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
  ],
});

// ============================================================
// DATA INTERFACES
// ============================================================

export interface CourseCertificateInput {
  attendeeName: string;
  eventTitle: string;
  eventSubtitle?: string;
  eventDate: string;
  eventEndDate?: string;
  venue?: string;
  address?: string;
  instructor?: string;
  courseMethod?: string;
  ceCredits?: number;
  certificateCode: string;
}

export interface SeminarCertificateInput {
  attendeeName: string;
  programName?: string;
  programPeriod: string; // e.g., "January - June 2025"
  sessionsAttended: number;
  totalSessions?: number;
  creditsEarned: number;
  issueDate: string;
  certificateCode: string;
  venue?: string;
  courseMethod?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate decorative curved lines background SVG and convert to PNG
 */
async function generateDecorativeBackground(
  width: number,
  height: number,
  color: string = '#DDC89D'
): Promise<string> {
  const lines: string[] = [];
  const centerX = width + 100;
  const centerY = -100;
  const numLines = 40;
  const startRadius = 200;
  const spacing = 15;

  for (let i = 0; i < numLines; i++) {
    const radius = startRadius + i * spacing;
    const opacity = Math.max(0.1, 0.4 - i * 0.008);
    lines.push(
      `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}" />`
    );
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip">
          <rect x="0" y="0" width="${width}" height="${height}" />
        </clipPath>
      </defs>
      <g clip-path="url(#clip)">
        ${lines.join('\n')}
      </g>
    </svg>
  `;

  try {
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to generate decorative background:', error);
    return '';
  }
}

/**
 * Fetch image and convert to base64 data URL for PDF rendering
 * SVG and WebP images are automatically converted to PNG using sharp
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert SVG or WebP to PNG (react-pdf only supports PNG/JPG)
    if (contentType.includes('svg') || contentType.includes('webp') || url.endsWith('.svg') || url.endsWith('.webp')) {
      const pngBuffer = await sharp(buffer).png().toBuffer();
      return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    }

    // Return as-is for other formats
    const base64 = buffer.toString('base64');
    const mimeType = contentType.split(';')[0] || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
}

/**
 * Generate QR code as data URL for certificate verification
 */
async function generateVerificationQR(certificateCode: string, baseUrl: string): Promise<string> {
  const verificationUrl = `${baseUrl}/${certificateCode}`;

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: '#0C2044',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  return qrCodeDataUrl;
}

// ============================================================
// STYLE GENERATOR
// ============================================================

function createStyles(template: CertificateTemplate) {
  return StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      fontFamily: 'Montserrat',
      position: 'relative',
    },
    decorativeBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },
    border: {
      position: 'absolute',
      top: 6,
      left: 6,
      right: 6,
      bottom: 6,
      borderWidth: template.show_border ? 2 : 0,
      borderColor: template.border_color || '#C9A961',
      borderStyle: 'solid',
    },
    header: {
      backgroundColor: template.header_bg_color || '#0C2044',
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginTop: 10,
      marginHorizontal: 10,
    },
    logo: {
      width: template.logo_width || 180,
      height: template.logo_height || 50,
    },
    mainContent: {
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 15,
      alignItems: 'center',
    },
    certificateTitle: {
      color: template.primary_color || '#0C2044',
      fontSize: 28,
      fontWeight: 700,
      textAlign: 'center',
      letterSpacing: 4,
      marginBottom: 6,
    },
    subtitleBadge: {
      backgroundColor: template.accent_color || '#C9A961',
      paddingVertical: 5,
      paddingHorizontal: 18,
      borderRadius: 4,
      marginBottom: 10,
    },
    subtitleText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 2,
    },
    description: {
      color: template.secondary_color || '#666666',
      fontSize: 10,
      textAlign: 'center',
      marginBottom: 8,
    },
    attendeeName: {
      color: template.attendee_name_color || '#0C2044',
      fontSize: 24,
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 3,
    },
    programProvider: {
      color: template.primary_color || '#0C2044',
      fontSize: 10,
      textAlign: 'center',
      marginBottom: 6,
    },
    dateText: {
      color: '#26ACF5',
      fontSize: 11,
      fontWeight: 600,
      textAlign: 'center',
      marginBottom: 8,
    },
    creditsBadge: {
      backgroundColor: template.primary_color || '#0C2044',
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    creditsText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 1,
    },
    courseTitleLabel: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
      textAlign: 'center',
      marginBottom: 3,
    },
    courseTitle: {
      color: template.primary_color || '#0C2044',
      fontSize: 18,
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 3,
    },
    courseSubtitle: {
      color: template.secondary_color || '#666666',
      fontSize: 9,
      textAlign: 'center',
      marginBottom: 8,
      maxWidth: 380,
    },
    codeBadge: {
      backgroundColor: template.accent_color || '#C9A961',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginBottom: 10,
    },
    codeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: 600,
      letterSpacing: 1,
    },
    signatureSection: {
      alignItems: 'center',
      marginBottom: 6,
    },
    signatureImage: {
      width: template.signature_width || 100,
      height: template.signature_height || 35,
      marginBottom: 5,
    },
    signatureLine: {
      width: 120,
      borderBottomWidth: 1,
      borderBottomColor: '#999999',
      marginBottom: 5,
      height: 25,
    },
    instructorInfo: {
      alignItems: 'center',
      marginBottom: 10,
    },
    instructorLabelBold: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
      fontWeight: 700,
      marginBottom: 2,
    },
    instructorName: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
      fontWeight: 700,
    },
    courseMethodLabel: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
      fontWeight: 700,
    },
    courseMethodValue: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
    },
    locationLabel: {
      color: template.primary_color || '#0C2044',
      fontSize: 9,
      marginTop: 2,
    },
    // Seminar-specific styles
    programPeriodLabel: {
      color: template.secondary_color || '#666666',
      fontSize: 9,
      textAlign: 'center',
      marginBottom: 2,
    },
    programPeriodValue: {
      color: '#26ACF5',
      fontSize: 12,
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 8,
    },
    sessionsInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      gap: 20,
    },
    sessionsBadge: {
      backgroundColor: template.accent_color || '#C9A961',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 4,
    },
    sessionsText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: 600,
    },
    programNameText: {
      color: template.primary_color || '#0C2044',
      fontSize: 16,
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 4,
    },
    // PACE section
    paceSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F8F8',
      marginHorizontal: 12,
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    paceLogoContainer: {
      marginRight: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paceLogo: {
      width: template.pace_logo_width || 70,
      height: template.pace_logo_height || 55,
    },
    paceTextContainer: {
      flex: 1,
      paddingRight: 16,
    },
    paceTextTitle: {
      color: template.primary_color || '#0C2044',
      fontSize: 7,
      fontWeight: 700,
      marginBottom: 3,
    },
    paceText: {
      color: template.secondary_color || '#666666',
      fontSize: 6.5,
      lineHeight: 1.4,
    },
    qrSection: {
      alignItems: 'center',
      paddingLeft: 16,
      borderLeftWidth: 1,
      borderLeftColor: '#E0E0E0',
    },
    qrCode: {
      width: template.qr_code_size || 55,
      height: template.qr_code_size || 55,
    },
    qrLabel: {
      color: template.primary_color || '#0C2044',
      fontSize: 7,
      fontWeight: 600,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}

// ============================================================
// COURSE CERTIFICATE GENERATOR
// ============================================================

export async function generateCourseCertificateWithTemplate(
  data: CourseCertificateInput,
  template: CertificateTemplate
): Promise<Buffer> {
  const styles = createStyles(template);

  // Page dimensions for LETTER landscape: 792 x 612 points
  const pageWidth = template.page_orientation === 'L' ? 792 : 612;
  const pageHeight = template.page_orientation === 'L' ? 612 : 792;

  // Pre-fetch all images in parallel
  const [logoDataUrl, signatureDataUrl, paceLogoDataUrl, decorativeBgDataUrl, qrCodeDataUrl] = await Promise.all([
    template.logo_url ? fetchImageAsDataUrl(template.logo_url) : null,
    template.signature_image_url ? fetchImageAsDataUrl(template.signature_image_url) : null,
    template.pace_logo_url ? fetchImageAsDataUrl(template.pace_logo_url) : null,
    generateDecorativeBackground(pageWidth, pageHeight, template.accent_color || '#DDC89D'),
    template.enable_qr_code
      ? generateVerificationQR(data.certificateCode, template.verification_url_base || `${BASE_URL}/certificate`)
      : null,
  ]);

  // Create the certificate document
  const CertificateDocument = () => {
    return React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        {
          size: template.page_format?.toUpperCase() as 'A4' | 'LETTER' || 'LETTER',
          orientation: template.page_orientation === 'L' ? 'landscape' : 'portrait',
          style: styles.page,
        },
        // Decorative background
        decorativeBgDataUrl && React.createElement(Image, {
          src: decorativeBgDataUrl,
          style: styles.decorativeBackground,
        }),
        // Border
        template.show_border && React.createElement(View, { style: styles.border }),
        // Header with logo
        React.createElement(
          View,
          { style: styles.header },
          logoDataUrl && React.createElement(Image, { src: logoDataUrl, style: styles.logo })
        ),
        // Main Content
        React.createElement(
          View,
          { style: styles.mainContent },
          // CERTIFICATE title
          React.createElement(Text, { style: styles.certificateTitle }, template.main_title || 'CERTIFICATE'),
          // OF COMPLETION badge
          React.createElement(
            View,
            { style: styles.subtitleBadge },
            React.createElement(Text, { style: styles.subtitleText }, template.main_subtitle || 'OF COMPLETION')
          ),
          // Description
          React.createElement(
            Text,
            { style: styles.description },
            template.description_text || 'This letter certified the person below participated in the following course by GPS Dental Training.'
          ),
          // Attendee Name
          React.createElement(Text, { style: styles.attendeeName }, data.attendeeName),
          // Program Provider
          React.createElement(
            Text,
            { style: styles.programProvider },
            `Program Provider: ${template.program_provider || 'GPS Dental Training'}`
          ),
          // Date
          React.createElement(Text, { style: styles.dateText }, data.eventDate),
          // CE Credits badge
          data.ceCredits && React.createElement(
            View,
            { style: styles.creditsBadge },
            React.createElement(Text, { style: styles.creditsText }, `CE CREDITS EARNED: ${data.ceCredits}`)
          ),
          // Course Title
          React.createElement(Text, { style: styles.courseTitleLabel }, template.course_title_label || 'Course Title:'),
          React.createElement(Text, { style: styles.courseTitle }, data.eventTitle),
          data.eventSubtitle && React.createElement(Text, { style: styles.courseSubtitle }, data.eventSubtitle),
          // Code badge
          React.createElement(
            View,
            { style: styles.codeBadge },
            React.createElement(Text, { style: styles.codeText }, `CODE #${data.certificateCode}`)
          ),
          // Signature
          React.createElement(
            View,
            { style: styles.signatureSection },
            template.show_signature && signatureDataUrl
              ? React.createElement(Image, { src: signatureDataUrl, style: styles.signatureImage })
              : React.createElement(View, { style: styles.signatureLine })
          ),
          // Instructor Info
          React.createElement(
            View,
            { style: styles.instructorInfo },
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
              React.createElement(Text, { style: styles.instructorLabelBold }, 'Instructor Name: '),
              React.createElement(Text, { style: styles.instructorName }, data.instructor || template.instructor_name || 'Dr Carlos Castro DDS, FACP')
            ),
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
              React.createElement(Text, { style: styles.courseMethodLabel }, `${template.course_method_label || 'Course Method:'} `),
              React.createElement(Text, { style: styles.courseMethodValue }, data.courseMethod || template.course_method_value || 'In Person')
            ),
            data.venue && React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center' } },
              React.createElement(Text, { style: styles.locationLabel }, `${template.location_label || 'Course Location:'} ${data.venue}`)
            )
          )
        ),
        // PACE Section at bottom with QR Code
        React.createElement(
          View,
          { style: styles.paceSection },
          template.show_pace && paceLogoDataUrl && React.createElement(
            View,
            { style: styles.paceLogoContainer },
            React.createElement(Image, { src: paceLogoDataUrl, style: styles.paceLogo })
          ),
          template.show_pace && React.createElement(
            View,
            { style: styles.paceTextContainer },
            React.createElement(Text, { style: styles.paceTextTitle }, 'GPS Dental Training LLC.'),
            React.createElement(Text, { style: styles.paceText }, template.pace_text || 'Nationally Approved PACE Program Provider for FAGD/MAGD credit.')
          ),
          template.enable_qr_code && qrCodeDataUrl && React.createElement(
            View,
            { style: styles.qrSection },
            React.createElement(Image, { src: qrCodeDataUrl, style: styles.qrCode }),
            React.createElement(Text, { style: styles.qrLabel }, template.qr_code_label || 'Scan to verify')
          )
        )
      )
    );
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(CertificateDocument) as unknown as Parameters<typeof renderToBuffer>[0]
  );

  return pdfBuffer;
}

// ============================================================
// SEMINAR CERTIFICATE GENERATOR
// ============================================================

export async function generateSeminarCertificateWithTemplate(
  data: SeminarCertificateInput,
  template: CertificateTemplate
): Promise<Buffer> {
  const styles = createStyles(template);

  // Page dimensions
  const pageWidth = template.page_orientation === 'L' ? 792 : 612;
  const pageHeight = template.page_orientation === 'L' ? 612 : 792;

  // Pre-fetch all images in parallel
  const [logoDataUrl, signatureDataUrl, paceLogoDataUrl, decorativeBgDataUrl, qrCodeDataUrl] = await Promise.all([
    template.logo_url ? fetchImageAsDataUrl(template.logo_url) : null,
    template.signature_image_url ? fetchImageAsDataUrl(template.signature_image_url) : null,
    template.pace_logo_url ? fetchImageAsDataUrl(template.pace_logo_url) : null,
    generateDecorativeBackground(pageWidth, pageHeight, template.accent_color || '#DDC89D'),
    template.enable_qr_code
      ? generateVerificationQR(data.certificateCode, template.verification_url_base || `${BASE_URL}/certificate`)
      : null,
  ]);

  // Create the certificate document
  const CertificateDocument = () => {
    return React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        {
          size: template.page_format?.toUpperCase() as 'A4' | 'LETTER' || 'LETTER',
          orientation: template.page_orientation === 'L' ? 'landscape' : 'portrait',
          style: styles.page,
        },
        // Decorative background
        decorativeBgDataUrl && React.createElement(Image, {
          src: decorativeBgDataUrl,
          style: styles.decorativeBackground,
        }),
        // Border
        template.show_border && React.createElement(View, { style: styles.border }),
        // Header with logo
        React.createElement(
          View,
          { style: styles.header },
          logoDataUrl && React.createElement(Image, { src: logoDataUrl, style: styles.logo })
        ),
        // Main Content
        React.createElement(
          View,
          { style: styles.mainContent },
          // CERTIFICATE title
          React.createElement(Text, { style: styles.certificateTitle }, template.main_title || 'CERTIFICATE'),
          // OF PARTICIPATION badge
          React.createElement(
            View,
            { style: styles.subtitleBadge },
            React.createElement(Text, { style: styles.subtitleText }, template.main_subtitle || 'OF PARTICIPATION')
          ),
          // Description
          React.createElement(
            Text,
            { style: styles.description },
            template.description_text || 'This letter certifies that the person below has successfully participated in the GPS Monthly Seminars continuing education program.'
          ),
          // Attendee Name
          React.createElement(Text, { style: styles.attendeeName }, data.attendeeName),
          // Program Provider
          React.createElement(
            Text,
            { style: styles.programProvider },
            `Program Provider: ${template.program_provider || 'GPS Dental Training'}`
          ),
          // Program Period Label
          React.createElement(
            Text,
            { style: styles.programPeriodLabel },
            template.seminar_period_label || 'Program Period:'
          ),
          // Program Period Value
          React.createElement(
            Text,
            { style: styles.programPeriodValue },
            data.programPeriod
          ),
          // CE Credits badge
          React.createElement(
            View,
            { style: styles.creditsBadge },
            React.createElement(Text, { style: styles.creditsText }, `${template.seminar_total_credits_label || 'TOTAL CE CREDITS EARNED:'} ${data.creditsEarned}`)
          ),
          // Sessions attended info
          React.createElement(
            View,
            { style: styles.sessionsInfo },
            React.createElement(
              View,
              { style: styles.sessionsBadge },
              React.createElement(Text, { style: styles.sessionsText }, `${template.seminar_sessions_label || 'Sessions Attended:'} ${data.sessionsAttended}/${data.totalSessions || 10}`)
            )
          ),
          // Program Name
          React.createElement(
            Text,
            { style: styles.programNameText },
            data.programName || 'GPS Monthly Seminars Program'
          ),
          // Code badge
          React.createElement(
            View,
            { style: styles.codeBadge },
            React.createElement(Text, { style: styles.codeText }, `CODE #${data.certificateCode}`)
          ),
          // Signature
          React.createElement(
            View,
            { style: styles.signatureSection },
            template.show_signature && signatureDataUrl
              ? React.createElement(Image, { src: signatureDataUrl, style: styles.signatureImage })
              : React.createElement(View, { style: styles.signatureLine })
          ),
          // Instructor Info
          React.createElement(
            View,
            { style: styles.instructorInfo },
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
              React.createElement(Text, { style: styles.instructorLabelBold }, `${template.instructor_label || 'Program Director'}: `),
              React.createElement(Text, { style: styles.instructorName }, template.instructor_name || 'Dr Carlos Castro DDS, FACP')
            ),
            React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
              React.createElement(Text, { style: styles.courseMethodLabel }, `${template.course_method_label || 'Course Method:'} `),
              React.createElement(Text, { style: styles.courseMethodValue }, data.courseMethod || template.course_method_value || 'In Person / Live')
            ),
            data.venue && React.createElement(
              View,
              { style: { flexDirection: 'row', justifyContent: 'center' } },
              React.createElement(Text, { style: styles.locationLabel }, `${template.location_label || 'Course Location:'} ${data.venue}`)
            )
          )
        ),
        // PACE Section at bottom with QR Code
        React.createElement(
          View,
          { style: styles.paceSection },
          template.show_pace && paceLogoDataUrl && React.createElement(
            View,
            { style: styles.paceLogoContainer },
            React.createElement(Image, { src: paceLogoDataUrl, style: styles.paceLogo })
          ),
          template.show_pace && React.createElement(
            View,
            { style: styles.paceTextContainer },
            React.createElement(Text, { style: styles.paceTextTitle }, 'GPS Dental Training LLC.'),
            React.createElement(Text, { style: styles.paceText }, template.pace_text || 'Nationally Approved PACE Program Provider for FAGD/MAGD credit.')
          ),
          template.enable_qr_code && qrCodeDataUrl && React.createElement(
            View,
            { style: styles.qrSection },
            React.createElement(Image, { src: qrCodeDataUrl, style: styles.qrCode }),
            React.createElement(Text, { style: styles.qrLabel }, template.qr_code_label || 'Scan to verify')
          )
        )
      )
    );
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(CertificateDocument) as unknown as Parameters<typeof renderToBuffer>[0]
  );

  return pdfBuffer;
}

/**
 * Format period string for seminar certificates
 */
export function formatSeminarPeriod(period: 'first_half' | 'second_half', year: number): string {
  if (period === 'first_half') {
    return `January - June ${year}`;
  } else {
    return `July - December ${year}`;
  }
}

/**
 * Generate certificate filename
 */
export function generateCertificateFilename(
  type: 'course' | 'seminar',
  attendeeName: string,
  code: string
): string {
  const safeName = attendeeName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

  const timestamp = Date.now().toString(36);

  return `${type}_certificate_${safeName}_${code}_${timestamp}.pdf`;
}
