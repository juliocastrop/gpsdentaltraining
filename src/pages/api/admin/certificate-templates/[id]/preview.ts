import type { APIRoute } from 'astro';
import { getCertificateTemplateById } from '../../../../../lib/supabase/queries';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
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
 * GET /api/admin/certificate-templates/[id]/preview
 * Generate a preview PDF using the template settings with sample data
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

    // Sample data for preview
    const sampleData = {
      attendeeName: 'John Doe, DDS',
      eventTitle: 'Advanced Dental Implant Techniques',
      eventDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      venue: 'GPS Dental Training Center',
      address: '123 Dental Way, Houston, TX 77001',
      ceCredits: 8,
      certificateCode: 'GPS-2025-SAMPLE123',
      period: 'January - June 2025',
      sessionsAttended: 5,
    };

    // Generate QR code for preview
    const qrCodeDataUrl = await QRCode.toDataURL(
      `${template.verification_url_base || 'https://gpsdentaltraining.com/certificate'}/${sampleData.certificateCode}`,
      {
        width: 200,
        margin: 1,
        color: {
          dark: template.primary_color || '#0C2044',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      }
    );

    // Register fonts
    Font.register({
      family: 'Montserrat',
      fonts: [
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aX8.ttf', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf', fontWeight: 700 },
      ],
    });

    // Create styles from template settings
    const styles = StyleSheet.create({
      page: {
        backgroundColor: '#FFFFFF',
        padding: 0,
        fontFamily: 'Montserrat',
      },
      border: {
        position: 'absolute',
        top: template.border_margin,
        left: template.border_margin,
        right: template.border_margin,
        bottom: template.border_margin,
        borderWidth: template.show_border ? template.border_width : 0,
        borderColor: template.border_color,
        borderStyle: 'solid',
      },
      header: {
        backgroundColor: template.header_bg_color,
        padding: 20,
        paddingTop: 30,
        alignItems: 'center',
        marginTop: template.border_margin + (template.show_border ? template.border_width : 0),
        marginHorizontal: template.border_margin + (template.show_border ? template.border_width : 0),
      },
      logo: {
        width: template.logo_width,
        height: template.logo_height,
        marginBottom: 10,
      },
      headerTitle: {
        color: template.header_text_color,
        fontSize: template.header_title_size,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 4,
      },
      headerSubtitle: {
        color: template.header_text_color,
        fontSize: template.header_subtitle_size,
        fontWeight: 400,
        textAlign: 'center',
        opacity: 0.9,
      },
      mainContent: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
      },
      mainTitle: {
        color: template.primary_color,
        fontSize: template.main_title_size,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 3,
      },
      mainSubtitle: {
        color: template.secondary_color,
        fontSize: template.main_subtitle_size,
        textAlign: 'center',
        marginBottom: 20,
      },
      attendeeName: {
        color: template.attendee_name_color,
        fontSize: template.attendee_name_size,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: template.accent_color,
        borderBottomStyle: 'solid',
        paddingBottom: 8,
        paddingHorizontal: 40,
      },
      description: {
        color: template.secondary_color,
        fontSize: template.description_size,
        textAlign: 'center',
        marginBottom: 20,
        maxWidth: 500,
      },
      eventTitle: {
        color: template.event_title_color,
        fontSize: template.event_title_size,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 20,
      },
      detailsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 20,
      },
      detailItem: {
        alignItems: 'center',
      },
      detailLabel: {
        color: template.secondary_color,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
      },
      detailValue: {
        color: template.primary_color,
        fontSize: 14,
        fontWeight: 600,
      },
      creditsBox: {
        backgroundColor: template.code_bg_color,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
      },
      creditsLabel: {
        color: template.secondary_color,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
      },
      creditsValue: {
        color: template.primary_color,
        fontSize: 24,
        fontWeight: 700,
      },
      signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 30,
        paddingHorizontal: 60,
      },
      signatureItem: {
        alignItems: 'center',
        width: 200,
      },
      signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: template.secondary_color,
        borderBottomStyle: 'solid',
        marginBottom: 8,
        height: 40,
      },
      signatureImage: {
        width: template.signature_width,
        height: template.signature_height,
        marginBottom: 8,
      },
      signatureLabel: {
        color: template.secondary_color,
        fontSize: 10,
        textAlign: 'center',
      },
      signatureName: {
        color: template.primary_color,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
      },
      paceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
      },
      paceLogo: {
        width: template.pace_logo_width,
        height: template.pace_logo_height,
      },
      paceText: {
        color: template.secondary_color,
        fontSize: template.pace_text_size,
        maxWidth: 400,
      },
      qrSection: {
        position: 'absolute',
        bottom: template.qr_code_position === 'bottom_right' ? 30 : 30,
        right: template.qr_code_position === 'bottom_right' ? 30 : undefined,
        left: template.qr_code_position === 'bottom_left' ? 30 : undefined,
        alignItems: 'center',
      },
      qrCode: {
        width: template.qr_code_size,
        height: template.qr_code_size,
      },
      qrLabel: {
        color: template.secondary_color,
        fontSize: 8,
        marginTop: 4,
        textAlign: 'center',
      },
      codeSection: {
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        alignItems: 'center',
      },
      codeLabel: {
        color: template.secondary_color,
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
      codeValue: {
        color: template.primary_color,
        fontSize: 12,
        fontWeight: 600,
        marginTop: 2,
      },
      footer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
      },
      footerText: {
        color: template.secondary_color,
        fontSize: template.footer_size,
        opacity: 0.7,
      },
    });

    // Create the certificate document
    const CertificateDocument = () => {
      const isSeminar = template.template_type === 'seminar';

      return React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          {
            size: template.page_format.toUpperCase() as 'A4' | 'LETTER',
            orientation: template.page_orientation,
            style: styles.page,
          },
          // Border
          template.show_border && React.createElement(View, { style: styles.border }),

          // Header
          React.createElement(
            View,
            { style: styles.header },
            template.logo_url && React.createElement(Image, { src: template.logo_url, style: styles.logo }),
            React.createElement(Text, { style: styles.headerTitle }, template.header_title),
            React.createElement(Text, { style: styles.headerSubtitle }, template.header_subtitle)
          ),

          // Main Content
          React.createElement(
            View,
            { style: styles.mainContent },
            React.createElement(Text, { style: styles.mainTitle }, template.main_title),
            React.createElement(Text, { style: styles.mainSubtitle }, template.main_subtitle),
            React.createElement(Text, { style: styles.attendeeName }, sampleData.attendeeName),
            React.createElement(Text, { style: styles.description }, template.description_text),

            // Event/Course Title
            React.createElement(Text, { style: styles.eventTitle }, sampleData.eventTitle),

            // Details Row
            React.createElement(
              View,
              { style: styles.detailsRow },
              React.createElement(
                View,
                { style: styles.detailItem },
                React.createElement(Text, { style: styles.detailLabel }, template.date_label),
                React.createElement(Text, { style: styles.detailValue }, sampleData.eventDate)
              ),
              !isSeminar && React.createElement(
                View,
                { style: styles.detailItem },
                React.createElement(Text, { style: styles.detailLabel }, template.location_label),
                React.createElement(Text, { style: styles.detailValue }, sampleData.venue)
              ),
              isSeminar && React.createElement(
                View,
                { style: styles.detailItem },
                React.createElement(Text, { style: styles.detailLabel }, template.seminar_period_label),
                React.createElement(Text, { style: styles.detailValue }, sampleData.period)
              )
            ),

            // CE Credits Box
            React.createElement(
              View,
              { style: styles.creditsBox },
              React.createElement(
                Text,
                { style: styles.creditsLabel },
                isSeminar ? template.seminar_total_credits_label : template.ce_credits_label
              ),
              React.createElement(Text, { style: styles.creditsValue }, `${sampleData.ceCredits} CE Credits`)
            ),

            // Signature Section
            template.show_signature && React.createElement(
              View,
              { style: styles.signatureSection },
              React.createElement(
                View,
                { style: styles.signatureItem },
                template.signature_image_url
                  ? React.createElement(Image, { src: template.signature_image_url, style: styles.signatureImage })
                  : React.createElement(View, { style: styles.signatureLine }),
                React.createElement(Text, { style: styles.signatureName }, template.instructor_name),
                React.createElement(Text, { style: styles.signatureLabel }, template.instructor_label)
              )
            ),

            // PACE Section
            template.show_pace && React.createElement(
              View,
              { style: styles.paceSection },
              template.pace_logo_url && React.createElement(Image, { src: template.pace_logo_url, style: styles.paceLogo }),
              React.createElement(Text, { style: styles.paceText }, template.pace_text)
            )
          ),

          // QR Code
          template.enable_qr_code && React.createElement(
            View,
            { style: styles.qrSection },
            React.createElement(Image, { src: qrCodeDataUrl, style: styles.qrCode }),
            React.createElement(Text, { style: styles.qrLabel }, template.qr_code_label)
          ),

          // Certificate Code (center bottom)
          React.createElement(
            View,
            { style: { ...styles.codeSection, transform: undefined, alignSelf: 'center' } },
            React.createElement(Text, { style: styles.codeLabel }, template.code_label),
            React.createElement(Text, { style: styles.codeValue }, sampleData.certificateCode)
          ),

          // Footer
          template.footer_text && React.createElement(
            View,
            { style: styles.footer },
            React.createElement(Text, { style: styles.footerText }, template.footer_text)
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
