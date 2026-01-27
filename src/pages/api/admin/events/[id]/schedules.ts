/**
 * Admin Event Schedules API - CRUD for event_schedules table
 * GET: List schedules for an event
 * POST: Create a new schedule day
 * PUT: Update a schedule (pass schedule_id in body)
 * DELETE: Delete a schedule (pass schedule_id in body)
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id: eventId } = params;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('event_schedules')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })
      .order('schedule_date', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event schedules GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch schedules' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id: eventId } = params;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Get next display_order
    const { data: existing } = await supabaseAdmin
      .from('event_schedules')
      .select('display_order')
      .eq('event_id', eventId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order || 0) + 1;

    const insertData = {
      event_id: eventId,
      schedule_date: body.schedule_date,
      tab_label: body.tab_label || null,
      topics: body.topics || [],
      display_order: body.display_order ?? nextOrder,
    };

    const { data, error } = await supabaseAdmin
      .from('event_schedules')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event schedules POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create schedule' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id: eventId } = params;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const scheduleId = body.schedule_id;

    if (!scheduleId) {
      return new Response(
        JSON.stringify({ error: 'schedule_id required in body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.schedule_date !== undefined) updateData.schedule_date = body.schedule_date;
    if (body.tab_label !== undefined) updateData.tab_label = body.tab_label;
    if (body.topics !== undefined) updateData.topics = body.topics;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;

    const { data, error } = await supabaseAdmin
      .from('event_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event schedules PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update schedule' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id: eventId } = params;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const scheduleId = body.schedule_id;

    if (!scheduleId) {
      return new Response(
        JSON.stringify({ error: 'schedule_id required in body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('event_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('event_id', eventId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event schedules DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete schedule' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
