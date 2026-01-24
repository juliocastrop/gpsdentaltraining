import type { APIRoute } from 'astro';
import {
  getSeminarRegistrationById,
  updateSeminarRegistration,
  cancelSeminarRegistration,
  getSeminarAttendanceByRegistration,
} from '../../../../../lib/supabase/queries';

/**
 * GET /api/admin/seminars/registrations/[id]
 * Get a specific registration with full details
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registration ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const registration = await getSeminarRegistrationById(id);
    if (!registration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registration not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: registration.id,
        status: registration.status,
        registration_date: registration.registration_date,
        start_session_date: registration.start_session_date,
        sessions_completed: registration.sessions_completed,
        sessions_remaining: registration.sessions_remaining,
        makeup_used: registration.makeup_used,
        qr_code: registration.qr_code,
        qr_code_url: registration.qr_code_url,
        notes: registration.notes,
        user: {
          id: registration.user?.id,
          name: `${registration.user?.first_name || ''} ${registration.user?.last_name || ''}`.trim(),
          email: registration.user?.email,
        },
        seminar: registration.seminar,
        attendance: registration.attendance?.map((att: {
          id: string;
          session_id: string;
          session?: { session_number: number; session_date: string; topic?: string };
          checked_in_at: string;
          is_makeup: boolean;
          credits_awarded: number;
        }) => ({
          id: att.id,
          session_id: att.session_id,
          session_number: att.session?.session_number,
          session_date: att.session?.session_date,
          session_topic: att.session?.topic,
          checked_in_at: att.checked_in_at,
          is_makeup: att.is_makeup,
          credits_awarded: att.credits_awarded,
        })) || [],
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch registration',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH /api/admin/seminars/registrations/[id]
 * Update a registration (status, notes, etc.)
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registration ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only allow certain fields to be updated
    const allowedFields = ['status', 'notes', 'makeup_used'];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid fields to update',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const registration = await updateSeminarRegistration(id, updateData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Registration updated successfully',
      data: registration,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update registration',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/admin/seminars/registrations/[id]
 * Cancel a registration
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registration ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await cancelSeminarRegistration(id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Registration cancelled successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to cancel registration',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
