/**
 * Course Certificate PDF Template - GPS Dental Training
 * Uses @react-pdf/renderer to generate PDF certificates for regular courses
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { CERTIFICATE_CONFIG, COURSE_CERTIFICATE_DESCRIPTION, PACE_FULL_TEXT } from './config';

// Certificate Data Interface
export interface CourseCertificateData {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  venue?: string;
  address?: string;
  instructor?: string;
  courseMethod?: string;
  ceCredits?: number;
  certificateCode: string;
  verificationUrl: string;
  qrCodeDataUrl?: string;
  logoUrl?: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: CERTIFICATE_CONFIG.colors.white,
    padding: 0,
  },

  // Header
  header: {
    backgroundColor: CERTIFICATE_CONFIG.header.backgroundColor,
    height: CERTIFICATE_CONFIG.header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  headerText: {
    color: CERTIFICATE_CONFIG.colors.white,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: CERTIFICATE_CONFIG.sizes.headerTitle,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    letterSpacing: 2,
    marginTop: 2,
  },

  // Main Content
  content: {
    flex: 1,
    paddingHorizontal: 60,
    paddingVertical: 30,
    alignItems: 'center',
  },

  // Certificate Title
  certificateTitle: {
    fontSize: CERTIFICATE_CONFIG.sizes.mainTitle,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    letterSpacing: 6,
    marginBottom: 4,
  },
  certificateSubtitle: {
    fontSize: CERTIFICATE_CONFIG.sizes.subtitle,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: CERTIFICATE_CONFIG.colors.gold,
    letterSpacing: 3,
    marginBottom: 20,
  },

  // Description
  description: {
    fontSize: CERTIFICATE_CONFIG.sizes.description,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 500,
    marginBottom: 20,
    lineHeight: 1.4,
  },

  // Attendee Name
  attendeeLabel: {
    fontSize: 10,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    marginBottom: 8,
  },
  attendeeName: {
    fontSize: CERTIFICATE_CONFIG.sizes.attendeeName,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Event Title
  eventTitleLabel: {
    fontSize: 10,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: CERTIFICATE_CONFIG.sizes.eventTitle,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 20,
  },

  // Credits Badge
  creditsBadge: {
    backgroundColor: CERTIFICATE_CONFIG.colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  creditsText: {
    fontSize: CERTIFICATE_CONFIG.sizes.credits,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
  },

  // Certificate Code
  codeContainer: {
    backgroundColor: CERTIFICATE_CONFIG.colors.goldDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 8,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: CERTIFICATE_CONFIG.colors.white,
    marginBottom: 2,
  },
  codeText: {
    fontSize: 12,
    fontFamily: CERTIFICATE_CONFIG.fonts.mono,
    color: CERTIFICATE_CONFIG.colors.white,
    letterSpacing: 1,
  },

  // Details Section
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 30,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 8,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#999999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: CERTIFICATE_CONFIG.sizes.date,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: CERTIFICATE_CONFIG.colors.blue,
  },

  // Footer Section
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 30,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  // PACE Section
  paceSection: {
    backgroundColor: '#E8F4FC',
    padding: 15,
    borderRadius: 8,
    maxWidth: 350,
  },
  paceTitle: {
    fontSize: 8,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    marginBottom: 4,
  },
  paceText: {
    fontSize: CERTIFICATE_CONFIG.sizes.paceText,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    lineHeight: 1.3,
  },

  // QR Code Section
  qrSection: {
    alignItems: 'center',
  },
  qrCode: {
    width: CERTIFICATE_CONFIG.qrCode.size,
    height: CERTIFICATE_CONFIG.qrCode.size,
    marginBottom: 4,
  },
  qrLabel: {
    fontSize: 6,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#999999',
    textAlign: 'center',
  },

  // Decorative Border
  border: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 2,
    borderColor: CERTIFICATE_CONFIG.colors.gold,
    borderStyle: 'solid',
    opacity: 0.3,
  },
});

// Course Certificate Component
export function CourseCertificateTemplate({ data }: { data: CourseCertificateData }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative Border */}
        <View style={styles.border} fixed />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{CERTIFICATE_CONFIG.header.title}</Text>
            <Text style={styles.headerSubtitle}>{CERTIFICATE_CONFIG.header.subtitle}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Certificate Title */}
          <Text style={styles.certificateTitle}>{CERTIFICATE_CONFIG.content.certificateTitle}</Text>
          <Text style={styles.certificateSubtitle}>{CERTIFICATE_CONFIG.content.certificateSubtitle}</Text>

          {/* Description */}
          <Text style={styles.description}>{COURSE_CERTIFICATE_DESCRIPTION}</Text>

          {/* Attendee Name */}
          <Text style={styles.attendeeLabel}>This is to certify that</Text>
          <Text style={styles.attendeeName}>{data.attendeeName}</Text>

          {/* Event Title */}
          <Text style={styles.eventTitleLabel}>has successfully completed</Text>
          <Text style={styles.eventTitle}>{data.eventTitle}</Text>

          {/* CE Credits Badge */}
          {data.ceCredits && data.ceCredits > 0 && (
            <View style={styles.creditsBadge}>
              <Text style={styles.creditsText}>{data.ceCredits} CE Credits</Text>
            </View>
          )}

          {/* Certificate Code */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Certificate Code</Text>
            <Text style={styles.codeText}>{data.certificateCode}</Text>
          </View>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Event Date</Text>
              <Text style={styles.detailValue}>{formatDate(data.eventDate)}</Text>
            </View>

            {data.venue && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{data.venue}</Text>
              </View>
            )}

            {data.courseMethod && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Course Method</Text>
                <Text style={styles.detailValue}>{data.courseMethod}</Text>
              </View>
            )}
          </View>

          {/* Instructor */}
          {data.instructor && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Instructor</Text>
              <Text style={styles.detailValue}>{data.instructor}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            {/* PACE Section */}
            <View style={styles.paceSection}>
              <Text style={styles.paceTitle}>PACE Approved Provider</Text>
              <Text style={styles.paceText}>{PACE_FULL_TEXT}</Text>
            </View>

            {/* QR Code */}
            {data.qrCodeDataUrl && (
              <View style={styles.qrSection}>
                <Image style={styles.qrCode} src={data.qrCodeDataUrl} />
                <Text style={styles.qrLabel}>Scan to verify</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default CourseCertificateTemplate;
