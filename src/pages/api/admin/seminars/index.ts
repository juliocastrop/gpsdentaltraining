/**
 * Admin Seminars API - List and Create seminars
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

/**
 * GET /api/admin/seminars
 * List all seminars with stats
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status');
    const year = url.searchParams.get('year');

    let query = supabaseAdmin
      .from('seminars')
      .select(`
        *,
        sessions:seminar_sessions(count),
        registrations:seminar_registrations(count)
      `)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the count results
    const seminarsWithCounts = data?.map(seminar => ({
      ...seminar,
      sessions_count: seminar.sessions?.[0]?.count || 0,
      registrations_count: seminar.registrations?.[0]?.count || 0,
    })) || [];

    return new Response(
      JSON.stringify({ success: true, data: seminarsWithCounts }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminars GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch seminars', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST /api/admin/seminars
 * Create a new seminar
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('[API] POST /api/admin/seminars - Creating new seminar:', body.title);

    // Validate required fields
    if (!body.title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.year) {
      return new Response(
        JSON.stringify({ error: 'Year is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('seminars')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A seminar with this slug already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build insert data
    const insertData: Record<string, any> = {
      title: body.title,
      slug,
      year: body.year,
      status: body.status || 'draft',
      subtitle: body.subtitle || null,
      description: body.description || null,
      price: body.price || 750,
      capacity: body.capacity || 0,
      total_sessions: body.total_sessions || 10,
      credits_per_session: body.credits_per_session || 2,
      total_credits: body.total_credits || (body.total_sessions || 10) * (body.credits_per_session || 2),
      layout_template: body.layout_template || 'classic',
      featured_image_url: body.featured_image_url || null,
      hero_image_url: body.hero_image_url || null,
      program_description: body.program_description || null,
      benefits: body.benefits || null,
      agenda_items: body.agenda_items || null,
      membership_policy: body.membership_policy || null,
      refund_policy: body.refund_policy || null,
      venue: body.venue || null,
      address: body.address || null,
      contact_email: body.contact_email || null,
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || null,
    };

    console.log('[API] Seminar insert data:', insertData);

    // If creating as 'active', deactivate all other active seminars first
    if (insertData.status === 'active') {
      console.log('[API] Creating active seminar - deactivating other active seminars');
      const { error: deactivateError } = await supabaseAdmin
        .from('seminars')
        .update({ status: 'completed' })
        .eq('status', 'active');

      if (deactivateError) {
        console.error('[API] Error deactivating other seminars:', deactivateError);
      } else {
        console.log('[API] Successfully deactivated other active seminars');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('seminars')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      throw error;
    }

    console.log('[API] Seminar created successfully:', data.id);

    // If sessions data is provided, create sessions
    if (body.sessions && Array.isArray(body.sessions) && body.sessions.length > 0) {
      const sessionsData = body.sessions.map((session: any, index: number) => {
        const sessionData: Record<string, any> = {
          seminar_id: data.id,
          session_number: session.session_number || index + 1,
          session_date: session.session_date,
          session_time_start: session.session_time_start || null,
          session_time_end: session.session_time_end || null,
          topic: session.topic || null,
          description: session.description || null,
        };
        if (session.capacity || body.capacity) {
          sessionData.capacity = session.capacity || body.capacity;
        }
        return sessionData;
      });

      const { error: sessionsError } = await supabaseAdmin
        .from('seminar_sessions')
        .insert(sessionsData);

      if (sessionsError) {
        console.error('[API] Error creating sessions:', sessionsError);
        // Don't throw - seminar was created, sessions can be added later
      } else {
        console.log(`[API] Created ${sessionsData.length} sessions for seminar`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminars POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create seminar', details: error?.message || error?.code || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
