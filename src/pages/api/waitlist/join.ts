import type { APIRoute } from 'astro';
import { addToWaitlist, checkWaitlistStatus, getEventById } from '../../../lib/supabase/queries';
import { sendWaitlistConfirmationEmail } from '../../../lib/email/sender';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { eventId, ticketTypeId, email, firstName, lastName, phone } = body;

    // Validate required fields
    if (!eventId || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID and email are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already on waitlist
    const existingEntry = await checkWaitlistStatus(email, eventId);
    if (existingEntry && existingEntry.length > 0) {
      const entry = existingEntry[0];
      return new Response(JSON.stringify({
        success: true,
        message: 'You are already on the waitlist',
        position: entry.position,
        status: entry.status,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add to waitlist
    const waitlistEntry = await addToWaitlist({
      event_id: eventId,
      ticket_type_id: ticketTypeId || null,
      email: email.toLowerCase().trim(),
      first_name: firstName?.trim() || null,
      last_name: lastName?.trim() || null,
      phone: phone?.trim() || null,
    });

    // Get event details for confirmation email
    const event = await getEventById(eventId);

    // Send confirmation email
    if (event) {
      try {
        const emailResult = await sendWaitlistConfirmationEmail(email, {
          firstName: firstName?.trim(),
          eventTitle: event.title,
          position: waitlistEntry.position,
        });
        if (!emailResult.success) {
          console.error('Waitlist confirmation email failed:', emailResult.error);
        } else {
          console.log('Waitlist confirmation email sent:', emailResult.messageId);
        }
      } catch (emailError) {
        console.error('Failed to send waitlist confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully joined the waitlist',
      position: waitlistEntry.position,
      id: waitlistEntry.id,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to join waitlist',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
