/**
 * Admin Seminar Sessions API - List and Create sessions
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

/**
 * GET /api/admin/seminars/sessions
 * List sessions with optional filters
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const seminarId = url.searchParams.get('seminar_id');
    const dateFilter = url.searchParams.get('date'); // 'upcoming', 'past', 'all'

    let query = supabaseAdmin
      .from('seminar_sessions')
      .select(`
        *,
        seminar:seminars(id, title, year)
      `)
      .order('session_date', { ascending: true })
      .order('session_number', { ascending: true });

    if (seminarId) {
      query = query.eq('seminar_id', seminarId);
    }

    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'upcoming') {
      query = query.gte('session_date', today);
    } else if (dateFilter === 'past') {
      query = query.lt('session_date', today);
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sessions GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sessions', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST /api/admin/seminars/sessions
 * Create a new session
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('[API] POST /api/admin/seminars/sessions - Creating new session');

    // Validate required fields
    if (!body.seminar_id) {
      return new Response(
        JSON.stringify({ error: 'seminar_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.session_date) {
      return new Response(
        JSON.stringify({ error: 'session_date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify seminar exists
    const { data: seminar, error: seminarError } = await supabaseAdmin
      .from('seminars')
      .select('id, title')
      .eq('id', body.seminar_id)
      .single();

    if (seminarError || !seminar) {
      return new Response(
        JSON.stringify({ error: 'Seminar not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get next session number if not provided
    let sessionNumber = body.session_number;
    if (!sessionNumber) {
      const { data: lastSession } = await supabaseAdmin
        .from('seminar_sessions')
        .select('session_number')
        .eq('seminar_id', body.seminar_id)
        .order('session_number', { ascending: false })
        .limit(1)
        .single();

      sessionNumber = (lastSession?.session_number || 0) + 1;
    }

    // Build insert data
    const insertData: Record<string, any> = {
      seminar_id: body.seminar_id,
      session_number: sessionNumber,
      session_date: body.session_date,
      session_time_start: body.session_time_start || null,
      session_time_end: body.session_time_end || null,
      topic: body.topic || null,
      description: body.description || null,
    };

    // Only add capacity if provided and > 0
    if (body.capacity && body.capacity > 0) {
      insertData.capacity = body.capacity;
    }

    console.log('[API] Session insert data:', insertData);

    const { data, error } = await supabaseAdmin
      .from('seminar_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      throw error;
    }

    console.log('[API] Session created successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sessions POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create session', details: error?.message || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
