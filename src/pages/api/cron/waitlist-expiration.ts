import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';
import { sendWaitlistNotificationEmail } from '../../../lib/email/sender';

/**
 * GET /api/cron/waitlist-expiration
 * Handles waitlist expiration and notification flow:
 * 1. Expire waitlist entries that were notified >48h ago
 * 2. Notify next person in line when a spot opens
 *
 * Should be run hourly via Vercel cron or similar
 *
 * Headers required:
 * - Authorization: Bearer <CRON_SECRET>
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results = {
      expired: 0,
      notified: 0,
      errors: [] as string[],
    };

    // Step 1: Expire waitlist entries that were notified more than 48 hours ago
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const { data: expiredEntries, error: expireError } = await supabaseAdmin
      .from('waitlist')
      .update({ status: 'expired' })
      .eq('status', 'notified')
      .lt('notified_at', fortyEightHoursAgo.toISOString())
      .select('id, ticket_type_id, event_id, email');

    if (expireError) {
      results.errors.push(`Error expiring entries: ${expireError.message}`);
    } else {
      results.expired = expiredEntries?.length || 0;

      // For each expired entry, notify the next person in line
      for (const expired of expiredEntries || []) {
        await notifyNextInLine(expired.ticket_type_id, expired.event_id, results);
      }
    }

    // Step 2: Check for any ticket types that have availability but waiting entries
    // This handles cases where spots opened up through refunds, etc.
    const { data: waitingEntries } = await supabaseAdmin
      .from('waitlist')
      .select(`
        id,
        ticket_type_id,
        event_id,
        email,
        first_name,
        position,
        ticket_types (
          id,
          name,
          quantity,
          manual_sold_out
        ),
        events (
          id,
          title,
          start_date
        )
      `)
      .eq('status', 'waiting')
      .order('position', { ascending: true });

    if (waitingEntries && waitingEntries.length > 0) {
      // Group by ticket_type_id to check availability
      const ticketTypeGroups = new Map<string, typeof waitingEntries>();

      for (const entry of waitingEntries) {
        const existing = ticketTypeGroups.get(entry.ticket_type_id) || [];
        existing.push(entry);
        ticketTypeGroups.set(entry.ticket_type_id, existing);
      }

      // For each ticket type, check if there's availability
      for (const [ticketTypeId, entries] of ticketTypeGroups) {
        const firstEntry = entries[0];
        const ticketTypeData = firstEntry.ticket_types;
        const ticketType = (Array.isArray(ticketTypeData) ? ticketTypeData[0] : ticketTypeData) as {
          id: string;
          name: string;
          quantity: number;
          manual_sold_out: boolean;
        } | null;

        if (!ticketType || ticketType.manual_sold_out) {
          continue;
        }

        // Count sold tickets
        const { count: soldCount } = await supabaseAdmin
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_type_id', ticketTypeId)
          .neq('status', 'cancelled');

        const available = ticketType.quantity - (soldCount || 0);

        // Check if anyone is currently notified (they have 48h to purchase)
        const { count: notifiedCount } = await supabaseAdmin
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_type_id', ticketTypeId)
          .eq('status', 'notified');

        // If there's availability and no one is currently notified, notify next
        if (available > 0 && (notifiedCount || 0) === 0) {
          await notifyNextInLine(ticketTypeId, firstEntry.event_id, results);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Waitlist expiration processed',
      ...results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in waitlist expiration cron:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Notify the next person in line for a ticket type
 */
async function notifyNextInLine(
  ticketTypeId: string,
  _eventId: string,
  results: { notified: number; errors: string[] }
) {
  try {
    // Get the next waiting entry
    const { data: nextEntry, error } = await supabaseAdmin
      .from('waitlist')
      .select(`
        id,
        email,
        first_name,
        ticket_types (
          id,
          name
        ),
        events (
          id,
          title,
          start_date,
          slug
        )
      `)
      .eq('ticket_type_id', ticketTypeId)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (error || !nextEntry) {
      // No one waiting - that's okay
      return;
    }

    const ticketTypeData = nextEntry.ticket_types;
    const ticketType = (Array.isArray(ticketTypeData) ? ticketTypeData[0] : ticketTypeData) as { id: string; name: string } | null;
    const eventData = nextEntry.events;
    const event = (Array.isArray(eventData) ? eventData[0] : eventData) as {
      id: string;
      title: string;
      start_date: string;
      slug: string;
    } | null;

    if (!ticketType || !event) {
      results.errors.push(`Missing data for waitlist entry ${nextEntry.id}`);
      return;
    }

    // Calculate expiration time (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Update entry to notified status
    const { error: updateError } = await supabaseAdmin
      .from('waitlist')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', nextEntry.id);

    if (updateError) {
      results.errors.push(`Failed to update waitlist entry ${nextEntry.id}: ${updateError.message}`);
      return;
    }

    // Send notification email
    const purchaseUrl = `https://gpsdentaltraining.com/courses/${event.slug}`;

    const emailResult = await sendWaitlistNotificationEmail(nextEntry.email, {
      firstName: nextEntry.first_name || 'there',
      eventTitle: event.title,
      eventDate: new Date(event.start_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      ticketType: ticketType.name,
      expiresAt: expiresAt.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
      purchaseUrl,
    });

    if (emailResult.success) {
      results.notified++;
      console.log(`Notified ${nextEntry.email} for ticket type ${ticketTypeId}`);
    } else {
      results.errors.push(`Failed to email ${nextEntry.email}: ${emailResult.error}`);
    }
  } catch (error) {
    results.errors.push(`Error notifying next in line: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}
