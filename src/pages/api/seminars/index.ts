import type { APIRoute } from 'astro';
import { getActiveSeminars } from '../../../lib/supabase/queries';

/**
 * GET /api/seminars
 * Returns all active seminars
 */
export const GET: APIRoute = async () => {
  try {
    const seminars = await getActiveSeminars();

    return new Response(JSON.stringify({
      success: true,
      data: seminars,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch seminars',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
