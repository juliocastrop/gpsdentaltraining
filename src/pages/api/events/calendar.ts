import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase/client';

export const GET: APIRoute = async ({ url }) => {
  try {
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const eventType = url.searchParams.get('type') || 'all';

    // Calculate date range for the month (with some padding for multi-day events)
    const startDate = new Date(year, month - 1, 1);
    startDate.setDate(startDate.getDate() - 7); // Include events from previous week

    const endDate = new Date(year, month, 0);
    endDate.setDate(endDate.getDate() + 7); // Include events into next week

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const events: any[] = [];

    // Fetch courses if type is 'all' or 'courses'
    if (eventType === 'all' || eventType === 'courses') {
      const { data: courseEvents, error: courseError } = await supabase
        .from('events')
        .select('id, title, slug, start_date, end_date, venue, ce_credits')
        .eq('status', 'published')
        .gte('start_date', startDateStr)
        .lte('start_date', endDateStr)
        .order('start_date', { ascending: true });

      if (courseError) {
        console.error('Error fetching course events:', courseError);
      } else if (courseEvents) {
        events.push(...courseEvents.map(event => ({
          id: event.id,
          title: event.title,
          slug: event.slug,
          startDate: event.start_date.split('T')[0],
          endDate: event.end_date ? event.end_date.split('T')[0] : null,
          venue: event.venue,
          ceCredits: event.ce_credits,
          type: 'course',
          url: `/courses/${event.slug}`,
        })));
      }
    }

    // Fetch seminar sessions if type is 'all' or 'seminars'
    if (eventType === 'all' || eventType === 'seminars') {
      const { data: seminarSessions, error: seminarError } = await supabase
        .from('seminar_sessions')
        .select(`
          id,
          session_number,
          session_date,
          session_time_start,
          session_time_end,
          topic,
          seminars!inner (
            id,
            title,
            slug
          )
        `)
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr)
        .order('session_date', { ascending: true });

      if (seminarError) {
        console.error('Error fetching seminar sessions:', seminarError);
      } else if (seminarSessions) {
        events.push(...seminarSessions.map((session: any) => ({
          id: `session-${session.id}`,
          title: session.topic || `Session ${session.session_number}: ${session.seminars.title}`,
          slug: session.seminars.slug,
          startDate: session.session_date,
          endDate: null,
          startTime: session.session_time_start ? formatTime(session.session_time_start) : null,
          endTime: session.session_time_end ? formatTime(session.session_time_end) : null,
          venue: 'GPS Training Center',
          ceCredits: 2,
          type: 'seminar-session',
          url: `/monthly-seminars/${session.seminars.slug}`,
        })));
      }
    }

    // Sort all events by date
    events.sort((a, b) => a.startDate.localeCompare(b.startDate));

    return new Response(JSON.stringify({
      success: true,
      events,
      meta: {
        year,
        month,
        eventType,
        count: events.length,
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch calendar events',
      events: [],
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

function formatTime(time: string): string {
  // Convert 24h time to 12h format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
