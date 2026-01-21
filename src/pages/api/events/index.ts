import type { APIRoute } from 'astro';
import { getPublishedEvents, getUpcomingEvents } from '../../../lib/supabase/queries';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const upcoming = url.searchParams.get('upcoming') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const events = upcoming
      ? await getUpcomingEvents(limit)
      : await getPublishedEvents();

    return new Response(JSON.stringify({
      success: true,
      events,
      count: events.length,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch events',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
