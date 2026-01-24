import type { APIRoute } from 'astro';
import {
  getWaitlistEntryById,
  updateWaitlistStatus,
  getEventById,
  getTicketTypeById,
} from '../../../../lib/supabase/queries';
import { sendWaitlistNotificationEmail } from '../../../../lib/email/sender';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { waitlistId, ticketTypeId } = body;

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

    if (entry.status !== 'waiting') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot notify entry with status: ${entry.status}`,
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

    // Get ticket type if provided
    let ticketType = null;
    if (ticketTypeId || entry.ticket_type_id) {
      ticketType = await getTicketTypeById(ticketTypeId || entry.ticket_type_id);
    }

    // Calculate expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Update waitlist entry
    await updateWaitlistStatus(waitlistId, 'notified', expiresAt.toISOString());

    // Format dates for email
    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const expiresFormatted = expiresAt.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Generate purchase URL with the event slug
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
      console.error('Failed to send waitlist notification email:', emailResult.error);
      // Still return success since we updated the DB - email failure shouldn't block
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User notified successfully',
      data: {
        waitlistId,
        email: entry.email,
        expiresAt: expiresAt.toISOString(),
        emailSent: emailResult.success,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error notifying waitlist user:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to notify user',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
