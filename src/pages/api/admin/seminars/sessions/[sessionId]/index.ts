/**
 * Admin Seminar Sessions API - Individual session operations
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../../lib/supabase/client';

/**
 * GET /api/admin/seminars/sessions/[sessionId]
 * Get a single session by ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('seminar_sessions')
      .select(`
        *,
        seminar:seminars(id, title, year),
        attendance:seminar_attendance(count)
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...data,
          attendance_count: data.attendance?.[0]?.count || 0
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Session GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch session', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * PUT /api/admin/seminars/sessions/[sessionId]
 * Update a session
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    console.log('[API] PUT /api/admin/seminars/sessions/', sessionId);

    // Build update object - only include provided fields
    const updateData: Record<string, any> = {};

    if (body.session_number !== undefined) updateData.session_number = body.session_number;
    if (body.session_date !== undefined) updateData.session_date = body.session_date;
    if (body.session_time_start !== undefined) updateData.session_time_start = body.session_time_start;
    if (body.session_time_end !== undefined) updateData.session_time_end = body.session_time_end;
    if (body.topic !== undefined) updateData.topic = body.topic;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Session update data:', updateData);

    const { data, error } = await supabaseAdmin
      .from('seminar_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase update error:', error);
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Session update success');

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Session PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update session', details: error?.message || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE /api/admin/seminars/sessions/[sessionId]
 * Delete a session
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] DELETE /api/admin/seminars/sessions/', sessionId);

    // First verify the session exists and get info
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('seminar_sessions')
      .select('id, session_number, session_date, seminar_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for attendance records
    const { count: attendanceCount } = await supabaseAdmin
      .from('seminar_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (attendanceCount && attendanceCount > 0) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete session with attendance records',
          details: `This session has ${attendanceCount} attendance records. Please delete them first.`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the session
    const { error: deleteError } = await supabaseAdmin
      .from('seminar_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('[API] Error deleting session:', deleteError);
      throw deleteError;
    }

    console.log(`[API] Successfully deleted session ${session.session_number} from seminar ${session.seminar_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Session ${session.session_number} deleted successfully`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Session DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete session', details: error?.message || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
