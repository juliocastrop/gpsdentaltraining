import type { APIRoute } from 'astro';
import {
  getSeminarSessionById,
  getSeminarSessionAttendance,
} from '../../../../../../lib/supabase/queries';

/**
 * GET /api/admin/seminars/sessions/[sessionId]/attendance
 * Get all attendance records for a specific session
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session info
    const session = await getSeminarSessionById(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get attendance records
    const attendance = await getSeminarSessionAttendance(sessionId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        session: {
          id: session.id,
          session_number: session.session_number,
          session_date: session.session_date,
          topic: session.topic,
          seminar_title: session.seminar?.title,
        },
        attendance: attendance?.map(record => ({
          id: record.id,
          checked_in_at: record.checked_in_at,
          is_makeup: record.is_makeup,
          credits_awarded: record.credits_awarded,
          attendee: {
            id: record.user?.id,
            name: `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim(),
            email: record.user?.email,
          },
          registration: {
            id: record.registration?.id,
            status: record.registration?.status,
            sessions_completed: record.registration?.sessions_completed,
            sessions_remaining: record.registration?.sessions_remaining,
          },
        })) || [],
        total_checked_in: attendance?.length || 0,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch session attendance',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
