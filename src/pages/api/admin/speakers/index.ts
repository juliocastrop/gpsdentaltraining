/**
 * Admin Speakers API - List/Create
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('speakers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ speakers: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Speakers GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch speakers' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { name, slug, title, bio, photo_url, social_links } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug exists
    const { data: existing } = await supabaseAdmin
      .from('speakers')
      .select('id')
      .eq('slug', finalSlug)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A speaker with this slug already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('speakers')
      .insert({
        name,
        slug: finalSlug,
        title: title || null,
        bio: bio || null,
        photo_url: photo_url || null,
        social_links: social_links || null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Speakers POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create speaker' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
