/**
 * Seminar Certificate PDF Template - GPS Dental Training
 * Uses @react-pdf/renderer to generate bi-annual PDF certificates for monthly seminars
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
import { CERTIFICATE_CONFIG, SEMINAR_CERTIFICATE_DESCRIPTION, PACE_FULL_TEXT } from './config';

// Certificate Data Interface
export interface SeminarCertificateData {
  attendeeName: string;
  seminarTitle: string;
  period: string; // e.g., "January - June 2025"
  year: number;
  issueDate: string;
  creditsEarned: number;
  sessionsAttended: number;
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

  // Attendee Name with underline (seminars specific)
  attendeeLabel: {
    fontSize: 10,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    marginBottom: 8,
  },
  attendeeNameContainer: {
    borderBottomWidth: 2,
    borderBottomColor: CERTIFICATE_CONFIG.colors.navy,
    paddingBottom: 4,
    marginBottom: 20,
  },
  attendeeName: {
    fontSize: CERTIFICATE_CONFIG.sizes.attendeeName,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    textAlign: 'center',
  },

  // Program Title
  programLabel: {
    fontSize: 10,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: '#666666',
    marginBottom: 6,
  },
  programTitle: {
    fontSize: CERTIFICATE_CONFIG.sizes.eventTitle,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Credits Box (prominent for seminars)
  creditsBox: {
    backgroundColor: CERTIFICATE_CONFIG.colors.gold,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  creditsLabel: {
    fontSize: 10,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: CERTIFICATE_CONFIG.colors.navy,
    marginBottom: 4,
  },
  creditsValue: {
    fontSize: 28,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.navy,
  },
  creditsUnit: {
    fontSize: 12,
    fontFamily: CERTIFICATE_CONFIG.fonts.body,
    color: CERTIFICATE_CONFIG.colors.navy,
    marginTop: 2,
  },

  // Period Badge
  periodBadge: {
    backgroundColor: CERTIFICATE_CONFIG.colors.navyLight,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 15,
  },
  periodText: {
    fontSize: 12,
    fontFamily: CERTIFICATE_CONFIG.fonts.title,
    color: CERTIFICATE_CONFIG.colors.white,
    letterSpacing: 1,
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
    gap: 40,
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

// Seminar Certificate Component
export function SeminarCertificateTemplate({ data }: { data: SeminarCertificateData }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
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
          <Text style={styles.description}>{SEMINAR_CERTIFICATE_DESCRIPTION}</Text>

          {/* Attendee Name with underline */}
          <Text style={styles.attendeeLabel}>This is to certify that</Text>
          <View style={styles.attendeeNameContainer}>
            <Text style={styles.attendeeName}>{data.attendeeName}</Text>
          </View>

          {/* Program Title */}
          <Text style={styles.programLabel}>has participated in</Text>
          <Text style={styles.programTitle}>GPS Monthly Seminars Program</Text>

          {/* CE Credits Box (prominent for seminars) */}
          <View style={styles.creditsBox}>
            <Text style={styles.creditsLabel}>Continuing Education Credits Earned</Text>
            <Text style={styles.creditsValue}>{data.creditsEarned}</Text>
            <Text style={styles.creditsUnit}>CE Credits</Text>
          </View>

          {/* Period Badge */}
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>{data.period}</Text>
          </View>

          {/* Certificate Code */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Certificate Code</Text>
            <Text style={styles.codeText}>{data.certificateCode}</Text>
          </View>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sessions Attended</Text>
              <Text style={styles.detailValue}>{data.sessionsAttended} Sessions</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Issue Date</Text>
              <Text style={styles.detailValue}>{formatDate(data.issueDate)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Program Provider</Text>
              <Text style={styles.detailValue}>{CERTIFICATE_CONFIG.content.programProvider}</Text>
            </View>
          </View>
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

export default SeminarCertificateTemplate;
