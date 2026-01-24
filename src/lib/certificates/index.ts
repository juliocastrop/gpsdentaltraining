/**
 * Certificate Module Exports - GPS Dental Training
 */

// Configuration
export { CERTIFICATE_CONFIG, COURSE_CERTIFICATE_DESCRIPTION, SEMINAR_CERTIFICATE_DESCRIPTION, PACE_FULL_TEXT } from './config';

// Templates
export { CourseCertificateTemplate, type CourseCertificateData } from './CourseCertificateTemplate';
export { SeminarCertificateTemplate, type SeminarCertificateData } from './SeminarCertificateTemplate';

// Generator Functions
export {
  generateCourseCertificatePDF,
  generateSeminarCertificatePDF,
  formatSeminarPeriod,
  generateCertificateFilename,
} from './generator';
