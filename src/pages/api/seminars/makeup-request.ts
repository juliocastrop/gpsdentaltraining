import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';

/**
 * POST /api/seminars/makeup-request
 * User-facing endpoint to submit a makeup request
 *
 * Required fields:
 *   - registration_id: UUID of the user's seminar registration
 *   - missed_session_id: UUID of the session they missed
 *
 * Optional fields:
 *   - requested_session_id: UUID of the session they want to attend instead
 *   - reason: Text explaining why they missed the session
 *   - user_id: Clerk user ID for verification (if not using auth headers)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { registration_id, missed_session_id, requested_session_id, reason, user_id } = body;

    // Validate required fields
    if (!registration_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'registration_id is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!missed_session_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'missed_session_id is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate registration exists
    const { data: registration, error: regError } = await supabaseAdmin
      .from('seminar_registrations')
      .select(`
        id,
        user_id,
        seminar_id,
        makeup_used,
        status,
        sessions_completed,
        sessions_remaining,
        user:users(id, clerk_id, email, first_name, last_name),
        seminar:seminars(id, title, year)
      `)
      .eq('id', registration_id)
      .single();

    if (regError || !registration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registration not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If user_id provided, verify ownership
    if (user_id) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', user_id)
        .single();

      if (userData && userData.id !== registration.user_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You can only submit makeup requests for your own registrations',
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Check registration status
    if (registration.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot submit makeup request for registration with status: ${registration.status}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if makeup already used
    if (registration.makeup_used) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already used your makeup session for this registration',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending/approved request
    const { data: existingRequest } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select('id, status, created_at')
      .eq('registration_id', registration_id)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingRequest) {
      return new Response(JSON.stringify({
        success: false,
        error: `You already have a makeup request with status "${existingRequest.status}". Please wait for it to be processed or cancel it before submitting a new one.`,
        existing_request_id: existingRequest.id,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate missed session belongs to the same seminar
    const { data: missedSession, error: sessionError } = await supabaseAdmin
      .from('seminar_sessions')
      .select('id, seminar_id, session_number, session_date, topic')
      .eq('id', missed_session_id)
      .eq('seminar_id', registration.seminar_id)
      .single();

    if (sessionError || !missedSession) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid missed session. The session must belong to your enrolled seminar.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user didn't already attend this session
    const { data: existingAttendance } = await supabaseAdmin
      .from('seminar_attendance')
      .select('id')
      .eq('registration_id', registration_id)
      .eq('session_id', missed_session_id)
      .single();

    if (existingAttendance) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You already have attendance recorded for this session. You cannot request a makeup for a session you attended.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate requested session if provided
    let requestedSession = null;
    if (requested_session_id) {
      const { data: reqSession, error: reqError } = await supabaseAdmin
        .from('seminar_sessions')
        .select('id, seminar_id, session_number, session_date, topic')
        .eq('id', requested_session_id)
        .single();

      if (reqError || !reqSession) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid requested session',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify the requested session is in the future
      const sessionDate = new Date(reqSession.session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (sessionDate < today) {
        return new Response(JSON.stringify({
          success: false,
          error: 'The requested makeup session must be a future session',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      requestedSession = reqSession;
    }

    // Create the makeup request
    const { data: newRequest, error: createError } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .insert({
        registration_id,
        user_id: registration.user_id,
        seminar_id: registration.seminar_id,
        missed_session_id,
        requested_session_id: requested_session_id || null,
        reason: reason?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating makeup request:', createError);

      // Check if it's a unique constraint violation
      if (createError.code === '23505') {
        return new Response(JSON.stringify({
          success: false,
          error: 'You already have an active makeup request for this registration',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw createError;
    }

    // Return success with details
    return new Response(JSON.stringify({
      success: true,
      message: 'Your makeup request has been submitted successfully. You will be notified once it is reviewed.',
      data: {
        request_id: newRequest.id,
        status: newRequest.status,
        missed_session: {
          number: missedSession.session_number,
          date: missedSession.session_date,
          topic: missedSession.topic,
        },
        requested_session: requestedSession ? {
          number: requestedSession.session_number,
          date: requestedSession.session_date,
          topic: requestedSession.topic,
        } : null,
        seminar: {
          title: (registration.seminar as any)?.title,
          year: (registration.seminar as any)?.year,
        },
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating makeup request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit makeup request. Please try again later.',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET /api/seminars/makeup-request
 * Get user's makeup requests
 *
 * Query params:
 *   - registration_id: UUID of the registration to check
 *   - user_id: Clerk user ID
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const registrationId = url.searchParams.get('registration_id');
    const clerkUserId = url.searchParams.get('user_id');

    if (!registrationId && !clerkUserId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either registration_id or user_id is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = supabaseAdmin
      .from('seminar_makeup_requests')
      .select(`
        id,
        reason,
        status,
        denial_reason,
        reviewed_at,
        created_at,
        seminar:seminars(id, title, year),
        missed_session:seminar_sessions!missed_session_id(id, session_number, session_date, topic),
        requested_session:seminar_sessions!requested_session_id(id, session_number, session_date, topic)
      `)
      .order('created_at', { ascending: false });

    if (registrationId) {
      query = query.eq('registration_id', registrationId);
    }

    if (clerkUserId) {
      // Get user ID from clerk ID
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userData) {
        query = query.eq('user_id', userData.id);
      } else {
        // No user found, return empty
        return new Response(JSON.stringify({
          success: true,
          data: [],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching makeup requests:', error);
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      data: requests || [],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching makeup requests:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch makeup requests',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
