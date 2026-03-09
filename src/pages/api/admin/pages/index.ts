/**
 * Admin Pages API - List/Create
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ pages: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pages GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pages' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, slug, subtitle, hero_image_url, content, meta_title, meta_description, og_image_url, status } = body;

    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: 'Title and slug are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const finalSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('pages')
      .select('id')
      .eq('slug', finalSlug)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A page with this slug already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .insert({
        title,
        slug: finalSlug,
        subtitle: subtitle || null,
        hero_image_url: hero_image_url || null,
        content: content || {},
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        og_image_url: og_image_url || null,
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pages POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create page' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
