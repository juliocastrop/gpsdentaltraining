/**
 * Admin Pages API - Get/Update/Delete
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Page ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ page: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pages GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch page' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Page ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle || null;
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url || null;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title || null;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description || null;
    if (body.og_image_url !== undefined) updateData.og_image_url = body.og_image_url || null;
    if (body.status !== undefined) updateData.status = body.status;

    // Handle slug change with uniqueness check
    if (body.slug !== undefined) {
      const finalSlug = body.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: existing } = await supabaseAdmin
        .from('pages')
        .select('id')
        .eq('slug', finalSlug)
        .neq('id', id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A page with this slug already exists' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.slug = finalSlug;
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
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
    console.error('Pages PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update page' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Page ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('pages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pages DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete page' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
