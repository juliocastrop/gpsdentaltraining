import type { APIRoute } from 'astro';
import {
  getEventById,
  createCertificate,
  getCertificateByTicket,
  isTicketCheckedIn,
} from '../../../../lib/supabase/queries';

// Generate a random alphanumeric string
function generateId(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ticketId, eventId, userId, attendeeName } = body;

    if (!eventId || !attendeeName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID and attendee name are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if certificate already exists for this ticket
    if (ticketId) {
      const existingCert = await getCertificateByTicket(ticketId);
      if (existingCert) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Certificate already exists for this ticket',
          certificateId: existingCert.id,
          certificateCode: existingCert.certificate_code,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify attendance - certificate can only be generated for checked-in attendees
      const isCheckedIn = await isTicketCheckedIn(ticketId);
      if (!isCheckedIn) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Certificate can only be generated for attendees who have checked in',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get event details
    const event = await getEventById(eventId);
    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique certificate code
    const certificateCode = `GPS-${new Date().getFullYear()}-${generateId(8)}`;

    // Create certificate record
    const certificate = await createCertificate({
      certificate_code: certificateCode,
      ticket_id: ticketId || null,
      user_id: userId || null,
      event_id: eventId,
      attendee_name: attendeeName,
      // pdf_url will be generated later if PDF generation is needed
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        id: certificate.id,
        certificateCode: certificate.certificate_code,
        attendeeName: certificate.attendee_name,
        eventTitle: event.title,
        ceCredits: event.ce_credits,
        verificationUrl: `https://gpsdentaltraining.com/certificate/${certificate.certificate_code}`,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate certificate',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
