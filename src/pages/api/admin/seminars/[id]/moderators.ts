/**
 * Admin Seminars API - Manage seminar moderators
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Seminar ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { moderators } = body;

    if (!Array.isArray(moderators)) {
      return new Response(
        JSON.stringify({ error: 'Moderators must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing moderators for this seminar
    const { error: deleteError } = await supabaseAdmin
      .from('seminar_moderators')
      .delete()
      .eq('seminar_id', id);

    if (deleteError) {
      console.error('[API] Error deleting existing moderators:', deleteError);
      throw deleteError;
    }

    // Insert new moderators
    if (moderators.length > 0) {
      const moderatorRecords = moderators.map((mod: any) => ({
        seminar_id: id,
        speaker_id: mod.speaker_id,
        role: mod.role || 'moderator',
        display_order: mod.display_order || 0,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('seminar_moderators')
        .insert(moderatorRecords);

      if (insertError) {
        console.error('[API] Error inserting moderators:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminar moderators PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update moderators', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Seminar ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('seminar_moderators')
      .select(`
        id,
        role,
        display_order,
        speaker:speakers(id, name, title, photo_url)
      `)
      .eq('seminar_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminar moderators GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch moderators', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
