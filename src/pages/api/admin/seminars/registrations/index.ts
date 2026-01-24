import type { APIRoute } from 'astro';
import { getAllSeminarRegistrationsAdmin } from '../../../../../lib/supabase/queries';

/**
 * GET /api/admin/seminars/registrations
 * Get all seminar registrations for admin
 *
 * Query params:
 *   seminarId?: string - Filter by seminar
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const seminarId = url.searchParams.get('seminarId') || undefined;

    const registrations = await getAllSeminarRegistrationsAdmin(seminarId);

    return new Response(JSON.stringify({
      success: true,
      data: registrations?.map(reg => ({
        id: reg.id,
        status: reg.status,
        registration_date: reg.registration_date,
        sessions_completed: reg.sessions_completed,
        sessions_remaining: reg.sessions_remaining,
        makeup_used: reg.makeup_used,
        qr_code: reg.qr_code,
        user: {
          id: reg.user?.id,
          name: `${reg.user?.first_name || ''} ${reg.user?.last_name || ''}`.trim(),
          email: reg.user?.email,
        },
        seminar: {
          id: reg.seminar?.id,
          title: reg.seminar?.title,
          year: reg.seminar?.year,
        },
        attendance_count: Array.isArray(reg.attendance) ? reg.attendance.length : 0,
      })) || [],
      total: registrations?.length || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching seminar registrations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch seminar registrations',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
