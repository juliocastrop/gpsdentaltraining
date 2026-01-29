import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

/**
 * GET /api/admin/seminars/makeup-requests
 * Get all makeup requests for admin review
 *
 * Query params:
 *   seminarId?: string - Filter by seminar
 *   status?: string - Filter by status (pending, approved, denied, completed, cancelled, expired)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const seminarId = url.searchParams.get('seminarId');
    const status = url.searchParams.get('status');

    let query = supabaseAdmin
      .from('seminar_makeup_requests')
      .select(`
        id,
        reason,
        notes,
        status,
        denial_reason,
        reviewed_at,
        created_at,
        updated_at,
        registration:seminar_registrations(
          id,
          sessions_completed,
          sessions_remaining,
          makeup_used,
          user:users(id, first_name, last_name, email)
        ),
        seminar:seminars(id, title, year),
        missed_session:seminar_sessions!missed_session_id(id, session_number, session_date, topic),
        requested_session:seminar_sessions!requested_session_id(id, session_number, session_date, topic),
        reviewed_by_user:users!reviewed_by(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (seminarId) {
      query = query.eq('seminar_id', seminarId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching makeup requests:', error);
      throw error;
    }

    // Transform data for frontend
    const transformedRequests = requests?.map((req: any) => ({
      id: req.id,
      reason: req.reason,
      notes: req.notes,
      status: req.status,
      denial_reason: req.denial_reason,
      reviewed_at: req.reviewed_at,
      created_at: req.created_at,
      updated_at: req.updated_at,
      registration: {
        id: req.registration?.id,
        sessions_completed: req.registration?.sessions_completed,
        sessions_remaining: req.registration?.sessions_remaining,
        makeup_used: req.registration?.makeup_used,
      },
      user: {
        id: req.registration?.user?.id,
        name: `${req.registration?.user?.first_name || ''} ${req.registration?.user?.last_name || ''}`.trim(),
        email: req.registration?.user?.email,
      },
      seminar: {
        id: req.seminar?.id,
        title: req.seminar?.title,
        year: req.seminar?.year,
      },
      missed_session: req.missed_session ? {
        id: req.missed_session.id,
        session_number: req.missed_session.session_number,
        session_date: req.missed_session.session_date,
        topic: req.missed_session.topic,
      } : null,
      requested_session: req.requested_session ? {
        id: req.requested_session.id,
        session_number: req.requested_session.session_number,
        session_date: req.requested_session.session_date,
        topic: req.requested_session.topic,
      } : null,
      reviewed_by: req.reviewed_by_user ? {
        id: req.reviewed_by_user.id,
        name: `${req.reviewed_by_user.first_name || ''} ${req.reviewed_by_user.last_name || ''}`.trim(),
      } : null,
    })) || [];

    // Get counts by status
    const { data: statusCounts } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select('status')
      .then(result => {
        const counts: Record<string, number> = {
          pending: 0,
          approved: 0,
          denied: 0,
          completed: 0,
          cancelled: 0,
          expired: 0,
        };
        result.data?.forEach((r: any) => {
          if (counts[r.status] !== undefined) {
            counts[r.status]++;
          }
        });
        return { data: counts };
      });

    return new Response(JSON.stringify({
      success: true,
      data: transformedRequests,
      counts: statusCounts,
      total: transformedRequests.length,
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

/**
 * POST /api/admin/seminars/makeup-requests
 * Create a new makeup request (user-facing, but accessible via admin too)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { registration_id, missed_session_id, requested_session_id, reason } = body;

    if (!registration_id || !missed_session_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: registration_id and missed_session_id are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate registration exists and get user_id and seminar_id
    const { data: registration, error: regError } = await supabaseAdmin
      .from('seminar_registrations')
      .select('id, user_id, seminar_id, makeup_used, status')
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

    // Check if makeup already used
    if (registration.makeup_used) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Makeup session already used for this registration',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending/approved request
    const { data: existingRequest } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select('id, status')
      .eq('registration_id', registration_id)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingRequest) {
      return new Response(JSON.stringify({
        success: false,
        error: `A makeup request already exists with status: ${existingRequest.status}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate missed_session belongs to the same seminar
    const { data: missedSession, error: sessionError } = await supabaseAdmin
      .from('seminar_sessions')
      .select('id, seminar_id, session_number, session_date')
      .eq('id', missed_session_id)
      .eq('seminar_id', registration.seminar_id)
      .single();

    if (sessionError || !missedSession) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid missed session',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
        reason: reason || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating makeup request:', createError);
      throw createError;
    }

    return new Response(JSON.stringify({
      success: true,
      data: newRequest,
      message: 'Makeup request submitted successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating makeup request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create makeup request',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
