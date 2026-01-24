import type { APIRoute } from 'astro';
import {
  getWaitlistEntryById,
  getEventById,
  getTicketTypeById,
} from '../../../../lib/supabase/queries';
import { sendWaitlistNotificationEmail } from '../../../../lib/email/sender';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { waitlistId } = body;

    if (!waitlistId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Waitlist ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get waitlist entry
    const entry = await getWaitlistEntryById(waitlistId);

    if (!entry) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Waitlist entry not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (entry.status !== 'notified') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot resend notification for entry with status: ${entry.status}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get event details
    const event = await getEventById(entry.event_id);

    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get ticket type
    let ticketType = null;
    if (entry.ticket_type_id) {
      ticketType = await getTicketTypeById(entry.ticket_type_id);
    }

    // Format dates for email
    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const expiresFormatted = entry.expires_at
      ? new Date(entry.expires_at).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Soon';

    // Generate purchase URL
    const purchaseUrl = `https://gpsdentaltraining.com/courses/${event.slug}`;

    // Send notification email
    const emailResult = await sendWaitlistNotificationEmail(entry.email, {
      firstName: entry.first_name || '',
      eventTitle: event.title,
      eventDate,
      ticketType: ticketType?.name || 'General Admission',
      expiresAt: expiresFormatted,
      purchaseUrl,
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification resent successfully',
      data: {
        waitlistId,
        email: entry.email,
        messageId: emailResult.messageId,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error resending waitlist notification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to resend notification',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
