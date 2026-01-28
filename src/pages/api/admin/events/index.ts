/**
 * Admin Events API - Create new event
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.start_date) {
      return new Response(
        JSON.stringify({ error: 'Title and start date are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check for slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'An event with this slug already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const insertData: Record<string, any> = {
      title: body.title,
      slug,
      start_date: body.start_date,
      status: body.status || 'draft',
    };

    // Optional fields
    if (body.description !== undefined) insertData.description = body.description;
    if (body.excerpt !== undefined) insertData.excerpt = body.excerpt;
    if (body.end_date !== undefined) insertData.end_date = body.end_date;
    if (body.venue !== undefined) insertData.venue = body.venue;
    if (body.address !== undefined) insertData.address = body.address;
    if (body.ce_credits !== undefined) insertData.ce_credits = body.ce_credits;
    if (body.capacity !== undefined) insertData.capacity = body.capacity;
    if (body.featured_image_url !== undefined) insertData.featured_image_url = body.featured_image_url;
    if (body.video_url !== undefined) insertData.video_url = body.video_url;
    if (body.learning_objectives !== undefined) insertData.learning_objectives = body.learning_objectives;
    if (body.includes !== undefined) insertData.includes = body.includes;
    if (body.prerequisites !== undefined) insertData.prerequisites = body.prerequisites;
    if (body.target_audience !== undefined) insertData.target_audience = body.target_audience;
    if (body.gallery_images !== undefined) insertData.gallery_images = body.gallery_images;
    if (body.sponsors !== undefined) insertData.sponsors = body.sponsors;
    if (body.accreditation !== undefined) insertData.accreditation = body.accreditation;
    if (body.layout_template !== undefined) insertData.layout_template = body.layout_template;

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Events POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create event', details: error?.message || error?.code || String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
