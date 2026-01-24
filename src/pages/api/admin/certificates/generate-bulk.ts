import type { APIRoute } from 'astro';
import {
  getEventById,
  createCertificate,
  getCertificateByTicket,
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
    const { eventId, attendees } = body;

    if (!eventId || !attendees || !Array.isArray(attendees)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID and attendees array are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    const year = new Date().getFullYear();
    const generated: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    for (const attendee of attendees) {
      const { ticketId, userId, attendeeName } = attendee;

      if (!attendeeName) {
        errors.push({ ticketId, error: 'Missing attendee name' });
        continue;
      }

      // Check if certificate already exists
      if (ticketId) {
        const existingCert = await getCertificateByTicket(ticketId);
        if (existingCert) {
          skipped.push({
            ticketId,
            attendeeName,
            reason: 'Certificate already exists',
            certificateCode: existingCert.certificate_code,
          });
          continue;
        }
      }

      try {
        // Generate unique certificate code
        const certificateCode = `GPS-${year}-${generateId(8)}`;

        // Create certificate
        const certificate = await createCertificate({
          certificate_code: certificateCode,
          ticket_id: ticketId || null,
          user_id: userId || null,
          event_id: eventId,
          attendee_name: attendeeName,
        });

        generated.push({
          id: certificate.id,
          certificateCode: certificate.certificate_code,
          attendeeName: certificate.attendee_name,
        });
      } catch (err) {
        console.error(`Error generating certificate for ${attendeeName}:`, err);
        errors.push({ ticketId, attendeeName, error: 'Failed to generate' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${generated.length} certificates`,
      data: {
        count: generated.length,
        generated,
        skipped,
        errors,
        eventTitle: event.title,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bulk certificate generation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate certificates',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
