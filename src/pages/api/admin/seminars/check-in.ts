import type { APIRoute } from 'astro';
import {
  getSeminarRegistrationByQRCode,
  getSeminarRegistrationById,
  getSeminarSessionById,
  recordSeminarAttendance,
  isSeminarSessionCheckedIn,
} from '../../../../lib/supabase/queries';

/**
 * POST /api/admin/seminars/check-in
 * Check in a seminar attendee for a session
 *
 * Body: {
 *   qr_code?: string,          // QR code from scan
 *   registration_id?: string,  // Or direct registration ID
 *   session_id: string,        // Session to check into
 *   is_makeup?: boolean,       // If this is a makeup session
 *   checked_in_by?: string,    // Admin user ID
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { qr_code, registration_id, session_id, is_makeup, checked_in_by } = body;

    // Validate required fields
    if (!session_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!qr_code && !registration_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either QR code or registration ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session info
    const session = await getSeminarSessionById(session_id);
    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get registration
    let registration;
    if (qr_code) {
      registration = await getSeminarRegistrationByQRCode(qr_code);
      if (!registration) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid QR code - registration not found',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      registration = await getSeminarRegistrationById(registration_id);
      if (!registration) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Registration not found',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate registration status
    if (registration.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Registration is ${registration.status}, cannot check in`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session belongs to same seminar
    if (session.seminar_id !== registration.seminar_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This session is for a different seminar',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already checked in for this session
    const alreadyCheckedIn = await isSeminarSessionCheckedIn(registration.id, session_id);
    if (alreadyCheckedIn) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Already checked in for this session',
        data: {
          registration_id: registration.id,
          session_id: session_id,
          attendee_name: `${registration.user?.first_name || ''} ${registration.user?.last_name || ''}`.trim(),
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate sessions remaining
    if (registration.sessions_remaining <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No sessions remaining in this registration',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate makeup if applicable
    if (is_makeup && registration.makeup_used) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Makeup session has already been used for this year',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record attendance
    const result = await recordSeminarAttendance({
      registration_id: registration.id,
      session_id: session_id,
      user_id: registration.user_id,
      seminar_id: registration.seminar_id,
      is_makeup: is_makeup || false,
      credits_awarded: 2, // Default 2 CE credits per session
      checked_in_by: checked_in_by || undefined,
    });

    const attendeeName = `${registration.user?.first_name || ''} ${registration.user?.last_name || ''}`.trim();

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully checked in ${attendeeName}`,
      data: {
        attendance_id: result.attendance.id,
        registration_id: registration.id,
        session_id: session_id,
        attendee_name: attendeeName,
        attendee_email: registration.user?.email,
        credits_awarded: result.creditsAwarded,
        is_makeup: is_makeup || false,
        sessions_completed: result.registration.sessions_completed,
        sessions_remaining: result.registration.sessions_remaining,
        registration_status: result.registration.status,
        session_topic: session.topic,
        session_date: session.session_date,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking in seminar attendee:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in attendee',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
