import { Resend } from 'resend';

const resendApiKey = import.meta.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not configured');
}

export const resend = new Resend(resendApiKey || '');

export const EMAIL_FROM = 'GPS Dental Training <noreply@gpsdentaltraining.com>';
export const EMAIL_REPLY_TO = 'info@gpsdentaltraining.com';

// Admin notification emails
export const ADMIN_EMAILS = [
  'info@gpsdentaltraining.com',
  'juliocastro@thewebminds.agency',
];
