/**
 * Admin Events API - Manage event speakers (junction table)
 *
 * GET    /api/admin/events/[id]/speakers       → List speakers for event
 * PUT    /api/admin/events/[id]/speakers       → Set speakers (replace all)
 * POST   /api/admin/events/[id]/speakers       → Add a speaker
 * DELETE /api/admin/events/[id]/speakers?sid=X  → Remove a speaker
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('event_speakers')
      .select(`
        speaker_id,
        display_order,
        speaker:speaker_id(id, name, title, photo_url)
      `)
      .eq('event_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, speakers: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event speakers GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event speakers' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT: Replace all speakers for the event (set the full list with order)
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { speaker_ids } = body;

    if (!Array.isArray(speaker_ids)) {
      return new Response(
        JSON.stringify({ error: 'speaker_ids must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete all existing speakers for this event
    const { error: deleteError } = await supabaseAdmin
      .from('event_speakers')
      .delete()
      .eq('event_id', id);

    if (deleteError) throw deleteError;

    // Insert new speakers with display order
    if (speaker_ids.length > 0) {
      const rows = speaker_ids.map((speakerId: string, index: number) => ({
        event_id: id,
        speaker_id: speakerId,
        display_order: index + 1,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('event_speakers')
        .insert(rows);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event speakers PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update event speakers' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Add a single speaker to the event
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Event ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { speaker_id } = body;

    if (!speaker_id) {
      return new Response(
        JSON.stringify({ error: 'speaker_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current max display_order
    const { data: existing } = await supabaseAdmin
      .from('event_speakers')
      .select('display_order')
      .eq('event_id', id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order || 0) + 1;

    const { error } = await supabaseAdmin
      .from('event_speakers')
      .insert({
        event_id: id,
        speaker_id,
        display_order: nextOrder,
      });

    if (error) {
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Speaker is already assigned to this event' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event speakers POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add speaker to event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE: Remove a speaker from the event
export const DELETE: APIRoute = async ({ params, url }) => {
  try {
    const { id } = params;
    const speakerId = url.searchParams.get('sid');

    if (!id || !speakerId) {
      return new Response(
        JSON.stringify({ error: 'Event ID and speaker ID (sid) are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('event_speakers')
      .delete()
      .eq('event_id', id)
      .eq('speaker_id', speakerId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event speakers DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to remove speaker from event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
