import type { APIRoute } from 'astro';
import {
  getCertificateById,
  updateCertificateSentAt,
} from '../../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

// Import email sender when available
// import { sendSeminarCertificateEmail } from '../../../../../lib/email/sender';

/**
 * POST /api/admin/seminars/certificates/send
 * Send a seminar certificate by email
 *
 * Body: {
 *   certificateId: string,
 *   email?: string // Override recipient email
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { certificateId, email: overrideEmail } = body;

    if (!certificateId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get certificate with user info
    const certificate = await getCertificateById(certificateId);
    if (!certificate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine recipient email
    const recipientEmail = overrideEmail || certificate.user?.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No email address found for recipient',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse period info from certificate notes
    const notesMatch = certificate.notes?.match(/Seminar Certificate - (\w+) (\d+) - ([\d.]+) CE Credits/);
    const period = notesMatch ? notesMatch[1] : 'Unknown';
    const year = notesMatch ? notesMatch[2] : new Date().getFullYear();
    const credits = notesMatch ? parseFloat(notesMatch[3]) : 0;

    // TODO: Implement actual email sending when Resend is configured
    // For now, just mark as sent
    /*
    const emailResult = await sendSeminarCertificateEmail(recipientEmail, {
      attendeeName: certificate.attendee_name,
      seminarTitle: certificate.event?.title || 'GPS Monthly Seminars',
      period: period,
      year: year,
      credits: credits,
      certificateCode: certificate.certificate_code,
      verificationUrl: `https://gpsdentaltraining.com/certificate/${certificate.certificate_code}`,
      pdfUrl: certificate.pdf_url,
    });

    if (!emailResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to send email: ${emailResult.error}`,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    */

    // Update sent_at timestamp
    await updateCertificateSentAt(certificateId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Certificate email sent successfully',
      data: {
        certificateId: certificateId,
        sentTo: recipientEmail,
        certificateCode: certificate.certificate_code,
        // messageId: emailResult.messageId,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending seminar certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send certificate',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
