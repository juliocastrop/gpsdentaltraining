import type { APIRoute } from 'astro';
import {
  getSeminarWithFullData,
  getSeminarStats,
  getSeminarSessionsWithAttendance,
} from '../../../../../lib/supabase/queries';

/**
 * GET /api/admin/seminars/[id]/stats
 * Get comprehensive stats for a seminar
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get seminar with all data
    const seminar = await getSeminarWithFullData(id);
    if (!seminar) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get stats
    const stats = await getSeminarStats(id);

    // Get sessions with attendance counts
    const sessionsWithAttendance = await getSeminarSessionsWithAttendance(id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        seminar: {
          id: seminar.id,
          title: seminar.title,
          year: seminar.year,
          status: seminar.status,
          total_sessions: seminar.total_sessions,
          price: seminar.price,
        },
        stats: {
          ...stats,
          capacity: seminar.capacity,
          available_spots: seminar.capacity ? seminar.capacity - stats.active_registrations : null,
        },
        sessions: sessionsWithAttendance.map(session => ({
          id: session.id,
          session_number: session.session_number,
          session_date: session.session_date,
          topic: session.topic,
          attendance_count: session.attendance_count,
        })),
        moderators: seminar.moderators?.map((mod: { role: string; speaker: unknown }) => ({
          role: mod.role,
          speaker: mod.speaker,
        })) || [],
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching seminar stats:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch seminar stats',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
