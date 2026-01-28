import type { APIRoute } from 'astro';
import {
  getCertificateById,
  getEventById,
} from '../../../../lib/supabase/queries';
import { sendCertificateEmail } from '../../../../lib/email/sender';

/**
 * POST /api/admin/certificates/send-test
 * Send a test certificate email to a specified address (does not mark as sent)
 *
 * Body: {
 *   certificateId: string,
 *   testEmail: string, // Email address to send test to
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { certificateId, testEmail } = body;

    if (!certificateId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!testEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Test email address is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email address format',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get certificate
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

    // Get event details
    const event = await getEventById(certificate.event_id);
    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Format event date
    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Send test email (to testEmail, not the actual recipient)
    const emailResult = await sendCertificateEmail(testEmail, {
      attendeeName: certificate.attendee_name,
      eventTitle: event.title,
      eventDate,
      ceCredits: event.ce_credits || 0,
      certificateCode: certificate.certificate_code,
      verificationUrl: `https://gpsdentaltraining.com/certificate/${certificate.certificate_code}`,
      pdfUrl: certificate.pdf_url,
    });

    if (!emailResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to send test email: ${emailResult.error}`,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // NOTE: We do NOT update sent_at for test emails

    return new Response(JSON.stringify({
      success: true,
      message: 'Test email sent successfully',
      data: {
        certificateId,
        sentTo: testEmail,
        messageId: emailResult.messageId,
        isTest: true,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending test certificate email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send test email',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
