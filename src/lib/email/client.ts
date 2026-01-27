import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const resendApiKey = import.meta.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured. Set it in your .env file.');
    }
    _resend = new Resend(resendApiKey);
  }
  return _resend;
}

export const EMAIL_FROM = 'GPS Dental Training <noreply@gpsdentaltraining.com>';
export const EMAIL_REPLY_TO = 'info@gpsdentaltraining.com';

// Admin notification emails
export const ADMIN_EMAILS = [
  'info@gpsdentaltraining.com',
  'juliocastro@thewebminds.agency',
];
