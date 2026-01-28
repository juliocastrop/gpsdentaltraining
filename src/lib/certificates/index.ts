/**
 * Certificate Module Exports - GPS Dental Training
 */

// Configuration
export { CERTIFICATE_CONFIG, COURSE_CERTIFICATE_DESCRIPTION, SEMINAR_CERTIFICATE_DESCRIPTION, PACE_FULL_TEXT } from './config';

// Legacy Templates (static, for backward compatibility)
export { CourseCertificateTemplate, type CourseCertificateData } from './CourseCertificateTemplate';
export { SeminarCertificateTemplate, type SeminarCertificateData } from './SeminarCertificateTemplate';

// Legacy Generator Functions (static templates)
export {
  generateCourseCertificatePDF,
  generateSeminarCertificatePDF,
} from './generator';

// NEW: Template-Based Generator Functions (use database templates)
export {
  generateCourseCertificateWithTemplate,
  generateSeminarCertificateWithTemplate,
  formatSeminarPeriod,
  generateCertificateFilename,
  type CourseCertificateInput,
  type SeminarCertificateInput,
} from './TemplateBasedGenerator';
