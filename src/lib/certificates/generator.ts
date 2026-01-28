/**
 * Certificate PDF Generator - GPS Dental Training
 * This file now serves as a compatibility layer and exports from the new template-based generator
 *
 * For new code, import directly from TemplateBasedGenerator.tsx:
 * - generateCourseCertificateWithTemplate
 * - generateSeminarCertificateWithTemplate
 *
 * The legacy functions below are maintained for backward compatibility but
 * will use hardcoded default values instead of database templates.
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { CourseCertificateTemplate, type CourseCertificateData } from './CourseCertificateTemplate';
import { SeminarCertificateTemplate, type SeminarCertificateData } from './SeminarCertificateTemplate';

// Re-export new template-based functions
export {
  generateCourseCertificateWithTemplate,
  generateSeminarCertificateWithTemplate,
  formatSeminarPeriod,
  generateCertificateFilename,
  type CourseCertificateInput,
  type SeminarCertificateInput,
} from './TemplateBasedGenerator';

const BASE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com';

/**
 * Generate QR code as data URL for certificate verification
 */
async function generateVerificationQR(certificateCode: string): Promise<string> {
  const verificationUrl = `${BASE_URL}/certificate/${certificateCode}`;

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

/**
 * Generate a course certificate PDF (LEGACY - uses static template)
 * @deprecated Use generateCourseCertificateWithTemplate instead
 */
export async function generateCourseCertificatePDF(data: {
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
}): Promise<Buffer> {
  // Generate QR code for verification
  const qrCodeDataUrl = await generateVerificationQR(data.certificateCode);

  const certificateData: CourseCertificateData = {
    ...data,
    verificationUrl: `${BASE_URL}/certificate/${data.certificateCode}`,
    qrCodeDataUrl,
    courseMethod: data.courseMethod || 'In Person',
  };

  // Render PDF to buffer
  // Type assertion needed due to @react-pdf/renderer expecting Document type
  const element = React.createElement(CourseCertificateTemplate, { data: certificateData });
  const pdfBuffer = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);

  return pdfBuffer;
}

/**
 * Generate a seminar certificate PDF (LEGACY - uses static template)
 * @deprecated Use generateSeminarCertificateWithTemplate instead
 */
export async function generateSeminarCertificatePDF(data: {
  attendeeName: string;
  seminarTitle?: string;
  period: string;
  year: number;
  issueDate: string;
  creditsEarned: number;
  sessionsAttended: number;
  certificateCode: string;
}): Promise<Buffer> {
  // Generate QR code for verification
  const qrCodeDataUrl = await generateVerificationQR(data.certificateCode);

  const certificateData: SeminarCertificateData = {
    attendeeName: data.attendeeName,
    seminarTitle: data.seminarTitle || 'GPS Monthly Seminars',
    period: data.period,
    year: data.year,
    issueDate: data.issueDate,
    creditsEarned: data.creditsEarned,
    sessionsAttended: data.sessionsAttended,
    certificateCode: data.certificateCode,
    verificationUrl: `${BASE_URL}/certificate/${data.certificateCode}`,
    qrCodeDataUrl,
  };

  // Render PDF to buffer
  // Type assertion needed due to @react-pdf/renderer expecting Document type
  const element = React.createElement(SeminarCertificateTemplate, { data: certificateData });
  const pdfBuffer = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);

  return pdfBuffer;
}
