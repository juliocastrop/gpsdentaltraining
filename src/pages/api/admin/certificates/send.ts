import type { APIRoute } from 'astro';
import {
  getCertificateById,
  getEventById,
  updateCertificateSentAt,
} from '../../../../lib/supabase/queries';
import { sendCertificateEmail } from '../../../../lib/email/sender';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { certificateId } = body;

    if (!certificateId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate ID is required',
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

    // Get recipient email from ticket or user
    let recipientEmail = certificate.ticket?.attendee_email || certificate.user?.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No email address found for certificate recipient',
      }), {
        status: 400,
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

    // Send email
    const emailResult = await sendCertificateEmail(recipientEmail, {
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
        error: `Failed to send email: ${emailResult.error}`,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update sent_at timestamp
    await updateCertificateSentAt(certificateId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Certificate sent successfully',
      data: {
        certificateId,
        sentTo: recipientEmail,
        messageId: emailResult.messageId,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send certificate',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
