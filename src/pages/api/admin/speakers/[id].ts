/**
 * Admin Speakers API - Update/Delete
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Speaker ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url;
    if (body.social_links !== undefined) updateData.social_links = body.social_links;

    // Check for slug uniqueness if slug is being changed
    if (body.slug) {
      const { data: existing } = await supabaseAdmin
        .from('speakers')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A speaker with this slug already exists' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('speakers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Speakers PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update speaker' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Speaker ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if speaker is assigned to any events
    const { count } = await supabaseAdmin
      .from('event_speakers')
      .select('*', { count: 'exact', head: true })
      .eq('speaker_id', id);

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ error: `Cannot delete speaker. They are assigned to ${count} event(s). Remove them from events first.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('speakers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Speakers DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete speaker' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
