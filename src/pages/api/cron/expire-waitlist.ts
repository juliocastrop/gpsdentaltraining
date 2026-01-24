import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';

// This endpoint should be called by a cron job every hour
// It expires waitlist entries that have passed their 48-hour window
// and notifies the next person in line

const CRON_SECRET = import.meta.env.CRON_SECRET;

export const POST: APIRoute = async ({ request }) => {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = new Date().toISOString();

    // Find all notified entries that have expired
    const { data: expiredEntries, error: fetchError } = await supabaseAdmin
      .from('waitlist')
      .select(`
        id,
        email,
        event_id,
        ticket_type_id,
        position
      `)
      .eq('status', 'notified')
      .lt('expires_at', now);

    if (fetchError) throw fetchError;

    const expiredCount = expiredEntries?.length || 0;
    const notifiedNextCount = 0;
    const results: any[] = [];

    // Expire each entry and notify the next person
    for (const entry of expiredEntries || []) {
      // Update status to expired
      const { error: updateError } = await supabaseAdmin
        .from('waitlist')
        .update({ status: 'expired' })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`Failed to expire waitlist entry ${entry.id}:`, updateError);
        continue;
      }

      results.push({
        id: entry.id,
        email: entry.email,
        action: 'expired',
      });

      // Find next person in line for the same ticket type/event
      const query = supabaseAdmin
        .from('waitlist')
        .select('id, email, first_name')
        .eq('event_id', entry.event_id)
        .eq('status', 'waiting')
        .order('position', { ascending: true })
        .limit(1);

      // Filter by ticket type if available
      if (entry.ticket_type_id) {
        query.eq('ticket_type_id', entry.ticket_type_id);
      }

      const { data: nextInLine } = await query;

      if (nextInLine && nextInLine.length > 0) {
        // TODO: Auto-notify next person (or leave for manual notification)
        // For now, we'll just log it - admin can manually notify
        console.log(`Next in line for event ${entry.event_id}:`, nextInLine[0].email);
        results.push({
          id: nextInLine[0].id,
          email: nextInLine[0].email,
          action: 'ready_to_notify',
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${expiredCount} expired waitlist entries`,
      data: {
        expiredCount,
        notifiedNextCount,
        results,
        processedAt: now,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing waitlist expiration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process waitlist expiration',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Also support GET for easy testing
export const GET: APIRoute = async (context) => {
  return POST(context);
};
