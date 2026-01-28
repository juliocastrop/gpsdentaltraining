import type { APIRoute } from 'astro';
import { getCertificateTemplateById } from '../../../../../lib/supabase/queries';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import sharp from 'sharp';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

/**
 * Generate decorative curved lines background SVG and convert to PNG
 * Creates the elegant curved lines pattern for the certificate background
 */
async function generateDecorativeBackground(
  width: number,
  height: number,
  color: string = '#DDC89D'
): Promise<string> {
  // Create SVG with curved concentric lines in the corner
  const lines: string[] = [];
  const centerX = width + 100; // Center point outside the right edge
  const centerY = -100; // Center point above the top edge
  const numLines = 40;
  const startRadius = 200;
  const spacing = 15;

  for (let i = 0; i < numLines; i++) {
    const radius = startRadius + i * spacing;
    // Calculate opacity - fade out towards the edges
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
    if (!response.ok) {
      console.error(`Failed to fetch image: ${url}, status: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // SVG and WebP need conversion - @react-pdf only supports PNG and JPG
    if (contentType.includes('svg') || contentType.includes('webp')) {
      try {
        buffer = await sharp(buffer).png().toBuffer();
        return `data:image/png;base64,${buffer.toString('base64')}`;
      } catch (convertError) {
        console.error(`Failed to convert ${contentType} to PNG: ${url}`, convertError);
        return null;
      }
    }

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error);
    return null;
  }
}

/**
 * GET /api/admin/certificate-templates/[id]/preview
 * Generate a preview PDF matching the GPS Dental Training certificate design
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = await getCertificateTemplateById(id);
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Debug: Log template values
    console.log('Preview template data:', {
      id: template.id,
      template_type: template.template_type,
      description_text: template.description_text,
      main_title: template.main_title,
      main_subtitle: template.main_subtitle,
      instructor_name: template.instructor_name,
    });

    // Determine if this is a seminar template
    const isSeminarTemplate = template.template_type === 'seminar';

    // Sample data for preview (generic demo data)
    // Different data for course vs seminar templates
    const sampleData = isSeminarTemplate
      ? {
          // Seminar-specific sample data
          attendeeName: 'John Doe',
          programProvider: 'GPS Dental Training',
          programName: 'GPS Monthly Seminars Program',
          programPeriod: 'January - June 2025',
          periodStart: 'January 1, 2025',
          periodEnd: 'June 30, 2025',
          sessionsAttended: 5,
          totalSessions: 10,
          ceCredits: 10,
          certificateCode: 'SEM-DEMO2025',
          courseMethod: 'In Person / Live',
          venue: '6320 Sugarloaf Parkway - Duluth GA 30097',
        }
      : {
          // Course-specific sample data
          attendeeName: 'John Doe',
          programProvider: 'GPS Dental Training',
          eventTitle: 'Immediate Implant Placement',
          eventSubtitle: 'From A to Z Two Days Master Hands-On Course for No crestal bone loss',
          eventDate: 'April 4 - 5, 2025',
          venue: '6320 Sugarloaf Parkway - Duluth GA 30097',
          ceCredits: 15,
          certificateCode: 'DEMO123456',
          courseMethod: 'In Person',
        };

    // Pre-fetch images and generate decorative background
    // Page dimensions for LETTER landscape: 792 x 612 points
    const pageWidth = template.page_orientation === 'L' ? 792 : 612;
    const pageHeight = template.page_orientation === 'L' ? 612 : 792;

    const [logoDataUrl, signatureDataUrl, paceLogoDataUrl, decorativeBgDataUrl] = await Promise.all([
      template.logo_url ? fetchImageAsDataUrl(template.logo_url) : null,
      template.signature_image_url ? fetchImageAsDataUrl(template.signature_image_url) : null,
      template.pace_logo_url ? fetchImageAsDataUrl(template.pace_logo_url) : null,
      generateDecorativeBackground(pageWidth, pageHeight, template.accent_color || '#DDC89D'),
    ]);

    // Generate QR code
    const qrCodeDataUrl = template.enable_qr_code
      ? await QRCode.toDataURL(
          `${template.verification_url_base || 'https://gpsdentaltraining.com/certificate'}/${sampleData.certificateCode}`,
          {
            width: 150,
            margin: 1,
            color: {
              dark: template.primary_color || '#0C2044',
              light: '#FFFFFF',
            },
          }
        )
      : null;

    // Register fonts
    Font.register({
      family: 'Montserrat',
      fonts: [
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aX8.ttf', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf', fontWeight: 700 },
      ],
    });

    // Styles matching the GPS Dental Training certificate design
    const styles = StyleSheet.create({
      page: {
        backgroundColor: '#FFFFFF',
        fontFamily: 'Montserrat',
        position: 'relative',
      },
      // Decorative background with curved lines
      decorativeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
      },
      // Border
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
      // Header with logo
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
      // Main content
      mainContent: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 15,
        alignItems: 'center',
      },
      // Certificate title
      certificateTitle: {
        color: template.primary_color || '#0C2044',
        fontSize: 28,
        fontWeight: 700,
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 6,
      },
      // OF COMPLETION badge
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
      // Description text
      description: {
        color: template.secondary_color || '#666666',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 8,
      },
      // Attendee name
      attendeeName: {
        color: template.attendee_name_color || '#0C2044',
        fontSize: 24,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 3,
      },
      // Program provider
      programProvider: {
        color: template.primary_color || '#0C2044',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 6,
      },
      // Date in blue
      dateText: {
        color: '#26ACF5',
        fontSize: 11,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 8,
      },
      // CE Credits badge - blue background per brand
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
      // Course title section
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
      // Code badge
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
      // Signature section
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
      // Instructor info
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
      // PACE section at bottom
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
      // QR Code section - vertical divider + QR
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
          // Decorative curved lines background
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

          // Main Content - Conditional rendering based on template type
          React.createElement(
            View,
            { style: styles.mainContent },

            // CERTIFICATE title
            React.createElement(Text, { style: styles.certificateTitle }, template.main_title || 'CERTIFICATE'),

            // OF COMPLETION badge
            React.createElement(
              View,
              { style: styles.subtitleBadge },
              React.createElement(Text, { style: styles.subtitleText }, template.main_subtitle || (isSeminarTemplate ? 'OF PARTICIPATION' : 'OF COMPLETION'))
            ),

            // Description
            React.createElement(
              Text,
              { style: styles.description },
              template.description_text || (isSeminarTemplate
                ? 'This letter certifies that the person below has successfully participated in the GPS Monthly Seminars continuing education program.'
                : 'This letter certified the person below participated in the following course by GPS Dental Training.')
            ),

            // Attendee Name
            React.createElement(Text, { style: styles.attendeeName }, sampleData.attendeeName),

            // Program Provider
            React.createElement(
              Text,
              { style: styles.programProvider },
              `Program Provider: ${sampleData.programProvider}`
            ),

            // === SEMINAR-SPECIFIC CONTENT ===
            ...(isSeminarTemplate ? [
              // Program Period Label
              React.createElement(
                Text,
                { style: styles.programPeriodLabel, key: 'period-label' },
                template.seminar_period_label || 'Program Period:'
              ),
              // Program Period Value (e.g., "January - June 2025")
              React.createElement(
                Text,
                { style: styles.programPeriodValue, key: 'period-value' },
                sampleData.programPeriod
              ),
              // CE Credits badge
              React.createElement(
                View,
                { style: styles.creditsBadge, key: 'credits-badge' },
                React.createElement(Text, { style: styles.creditsText }, `${template.seminar_total_credits_label || 'TOTAL CE CREDITS EARNED:'} ${sampleData.ceCredits}`)
              ),
              // Sessions attended info
              React.createElement(
                View,
                { style: styles.sessionsInfo, key: 'sessions-info' },
                React.createElement(
                  View,
                  { style: styles.sessionsBadge },
                  React.createElement(Text, { style: styles.sessionsText }, `${template.seminar_sessions_label || 'Sessions Attended:'} ${sampleData.sessionsAttended}/${sampleData.totalSessions}`)
                )
              ),
              // Program Name
              React.createElement(
                Text,
                { style: styles.programNameText, key: 'program-name' },
                sampleData.programName
              ),
            ] : [
              // === COURSE-SPECIFIC CONTENT ===
              // Date
              React.createElement(Text, { style: styles.dateText, key: 'date' }, sampleData.eventDate),
              // CE Credits badge
              React.createElement(
                View,
                { style: styles.creditsBadge, key: 'credits-badge' },
                React.createElement(Text, { style: styles.creditsText }, `CE CREDITS EARNED: ${sampleData.ceCredits}`)
              ),
              // Course Title
              React.createElement(Text, { style: styles.courseTitleLabel, key: 'title-label' }, 'Course Title:'),
              React.createElement(Text, { style: styles.courseTitle, key: 'title' }, sampleData.eventTitle),
              React.createElement(Text, { style: styles.courseSubtitle, key: 'subtitle' }, sampleData.eventSubtitle),
            ]),

            // Code badge (common to both)
            React.createElement(
              View,
              { style: styles.codeBadge },
              React.createElement(Text, { style: styles.codeText }, `CODE #${sampleData.certificateCode}`)
            ),

            // Signature
            React.createElement(
              View,
              { style: styles.signatureSection },
              signatureDataUrl
                ? React.createElement(Image, { src: signatureDataUrl, style: styles.signatureImage })
                : React.createElement(View, { style: styles.signatureLine })
            ),

            // Instructor Info
            React.createElement(
              View,
              { style: styles.instructorInfo },
              // Instructor Name row
              React.createElement(
                View,
                { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
                React.createElement(Text, { style: styles.instructorLabelBold }, 'Instructor Name: '),
                React.createElement(Text, { style: styles.instructorName }, template.instructor_name || 'Dr Carlos Castro DDS, FACP')
              ),
              // Course Method row
              React.createElement(
                View,
                { style: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 } },
                React.createElement(Text, { style: styles.courseMethodLabel }, 'Course Method: '),
                React.createElement(Text, { style: styles.courseMethodValue }, sampleData.courseMethod)
              ),
              // Course Location row
              React.createElement(
                View,
                { style: { flexDirection: 'row', justifyContent: 'center' } },
                React.createElement(Text, { style: styles.locationLabel }, `Course Location: ${sampleData.venue}`)
              )
            )
          ),

          // PACE Section at bottom with QR Code
          React.createElement(
            View,
            { style: styles.paceSection },
            // PACE Logo in container
            template.show_pace && paceLogoDataUrl && React.createElement(
              View,
              { style: styles.paceLogoContainer },
              React.createElement(Image, { src: paceLogoDataUrl, style: styles.paceLogo })
            ),
            // PACE Text with title
            template.show_pace && React.createElement(
              View,
              { style: styles.paceTextContainer },
              React.createElement(Text, { style: styles.paceTextTitle }, 'GPS Dental Training LLC.'),
              React.createElement(Text, { style: styles.paceText }, template.pace_text || 'Nationally Approved PACE Program Provider for FAGD/MAGD credit. Approval does not imply acceptance by any regulatory authority or AGD endorsement.')
            ),
            // QR Code with divider
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

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(CertificateDocument) as unknown as Parameters<typeof renderToBuffer>[0]
    );

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="preview-${template.slug}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
