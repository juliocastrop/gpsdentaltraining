/**
 * Admin Events API - Update individual event
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

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

    // Build update object - only include provided fields
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.ce_credits !== undefined) updateData.ce_credits = body.ce_credits;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.featured_image_url !== undefined) updateData.featured_image_url = body.featured_image_url;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.learning_objectives !== undefined) updateData.learning_objectives = body.learning_objectives;
    if (body.includes !== undefined) updateData.includes = body.includes;
    if (body.prerequisites !== undefined) updateData.prerequisites = body.prerequisites;
    if (body.target_audience !== undefined) updateData.target_audience = body.target_audience;
    if (body.schedule_topics !== undefined) updateData.schedule_topics = body.schedule_topics;
    if (body.gallery_images !== undefined) updateData.gallery_images = body.gallery_images;
    if (body.sponsors !== undefined) updateData.sponsors = body.sponsors;
    if (body.accreditation !== undefined) updateData.accreditation = body.accreditation;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.layout_template !== undefined) updateData.layout_template = body.layout_template;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for slug uniqueness if slug is being changed
    if (body.slug) {
      const { data: existing } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'An event with this slug already exists' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Events PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update event', details: error?.message || error?.code || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
