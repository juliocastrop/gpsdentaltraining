/**
 * Admin Seminars API - Update individual seminar
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

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
    console.log('[API] PUT /api/admin/seminars/', id, '- Fields received:', Object.keys(body));

    // Build update object - only include provided fields
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.total_sessions !== undefined) updateData.total_sessions = body.total_sessions;
    if (body.credits_per_session !== undefined) updateData.credits_per_session = body.credits_per_session;
    if (body.total_credits !== undefined) updateData.total_credits = body.total_credits;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.layout_template !== undefined) updateData.layout_template = body.layout_template;
    if (body.featured_image_url !== undefined) updateData.featured_image_url = body.featured_image_url;
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url;
    if (body.program_description !== undefined) updateData.program_description = body.program_description;
    if (body.benefits !== undefined) updateData.benefits = body.benefits;
    if (body.agenda_items !== undefined) updateData.agenda_items = body.agenda_items;
    if (body.membership_policy !== undefined) updateData.membership_policy = body.membership_policy;
    if (body.refund_policy !== undefined) updateData.refund_policy = body.refund_policy;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for slug uniqueness if slug is being changed
    if (body.slug) {
      const { data: existing } = await supabaseAdmin
        .from('seminars')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A seminar with this slug already exists' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[API] Seminar update data:', updateData);

    // If setting this seminar to 'active', deactivate all other active seminars
    if (body.status === 'active') {
      console.log('[API] Setting seminar to active - deactivating other active seminars');
      const { error: deactivateError } = await supabaseAdmin
        .from('seminars')
        .update({ status: 'completed' })
        .eq('status', 'active')
        .neq('id', id);

      if (deactivateError) {
        console.error('[API] Error deactivating other seminars:', deactivateError);
        // Don't throw - continue with the update
      } else {
        console.log('[API] Successfully deactivated other active seminars');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('seminars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase update error:', error);
      throw error;
    }

    console.log('[API] Seminar update success');

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminars PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update seminar', details: error?.message || error?.code || String(error) }),
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
      .from('seminars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminars GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch seminar', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Seminar ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] DELETE /api/admin/seminars/', id);

    // First verify the seminar exists
    const { data: seminar, error: fetchError } = await supabaseAdmin
      .from('seminars')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchError || !seminar) {
      return new Response(
        JSON.stringify({ error: 'Seminar not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get counts for logging
    const { count: sessionsCount } = await supabaseAdmin
      .from('seminar_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('seminar_id', id);

    const { count: registrationsCount } = await supabaseAdmin
      .from('seminar_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('seminar_id', id);

    const { count: attendanceCount } = await supabaseAdmin
      .from('seminar_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('seminar_id', id);

    console.log(`[API] Deleting seminar "${seminar.title}" with ${sessionsCount || 0} sessions, ${registrationsCount || 0} registrations, ${attendanceCount || 0} attendance records`);

    // Delete in order (respect foreign key constraints)
    // 1. Delete attendance records
    const { error: attendanceError } = await supabaseAdmin
      .from('seminar_attendance')
      .delete()
      .eq('seminar_id', id);

    if (attendanceError) {
      console.error('[API] Error deleting attendance:', attendanceError);
      throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
    }

    // 2. Delete registrations
    const { error: registrationsError } = await supabaseAdmin
      .from('seminar_registrations')
      .delete()
      .eq('seminar_id', id);

    if (registrationsError) {
      console.error('[API] Error deleting registrations:', registrationsError);
      throw new Error(`Failed to delete registrations: ${registrationsError.message}`);
    }

    // 3. Delete sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('seminar_sessions')
      .delete()
      .eq('seminar_id', id);

    if (sessionsError) {
      console.error('[API] Error deleting sessions:', sessionsError);
      throw new Error(`Failed to delete sessions: ${sessionsError.message}`);
    }

    // 4. Delete moderators (if exists)
    const { error: moderatorsError } = await supabaseAdmin
      .from('seminar_moderators')
      .delete()
      .eq('seminar_id', id);

    if (moderatorsError) {
      console.error('[API] Error deleting moderators (may not exist):', moderatorsError);
      // Don't throw - moderators table might not have FK or records
    }

    // 5. Finally, delete the seminar
    const { error: seminarError } = await supabaseAdmin
      .from('seminars')
      .delete()
      .eq('id', id);

    if (seminarError) {
      console.error('[API] Error deleting seminar:', seminarError);
      throw new Error(`Failed to delete seminar: ${seminarError.message}`);
    }

    console.log(`[API] Successfully deleted seminar "${seminar.title}" and all associated data`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seminar "${seminar.title}" deleted successfully`,
        deleted: {
          sessions: sessionsCount || 0,
          registrations: registrationsCount || 0,
          attendance: attendanceCount || 0
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seminars DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete seminar', details: error?.message || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
