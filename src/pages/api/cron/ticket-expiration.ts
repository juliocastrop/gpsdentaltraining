import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';

/**
 * GET /api/cron/ticket-expiration
 * Auto-expire tickets for events that have passed
 * Should be run daily via Vercel cron
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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find tickets for events that have ended and are still 'valid'
    const { data: expiredTickets, error } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'valid')
      .lt('events.end_date', yesterdayStr)
      .select('id, ticket_code, event_id');

    // Alternative approach: use a subquery since the join might not work
    // Get events that have ended
    const { data: pastEvents } = await supabaseAdmin
      .from('events')
      .select('id')
      .lt('end_date', yesterdayStr);

    if (!pastEvents || pastEvents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No past events found',
        ticketsExpired: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pastEventIds = pastEvents.map(e => e.id);

    // Update tickets for those events
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'valid')
      .in('event_id', pastEventIds)
      .select('id, ticket_code');

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Ticket expiration processed',
      ticketsExpired: updated?.length || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ticket expiration cron:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
