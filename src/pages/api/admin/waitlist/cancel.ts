import type { APIRoute } from 'astro';
import { updateWaitlistStatus, getWaitlistEntryById } from '../../../../lib/supabase/queries';

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

    // Get waitlist entry to verify it exists
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

    if (entry.status === 'converted') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot cancel a converted entry',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update status to cancelled
    await updateWaitlistStatus(waitlistId, 'cancelled');

    return new Response(JSON.stringify({
      success: true,
      message: 'Waitlist entry cancelled',
      data: {
        waitlistId,
        previousStatus: entry.status,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error cancelling waitlist entry:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to cancel waitlist entry',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
