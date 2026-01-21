import type { APIRoute } from 'astro';
import { getEventBySlug, getEventAvailability } from '../../../lib/supabase/queries';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event slug is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const event = await getEventBySlug(slug);

    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get availability info
    const availability = await getEventAvailability(event.id);

    return new Response(JSON.stringify({
      success: true,
      event,
      availability,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch event',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
