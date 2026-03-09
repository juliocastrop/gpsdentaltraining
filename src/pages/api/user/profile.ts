/**
 * User Profile API
 * GET - Fetch current user's profile
 * PUT - Update current user's profile
 */
import type { APIRoute } from 'astro';
import { getUser } from '../../../lib/supabase/auth';
import { supabaseAdmin } from '../../../lib/supabase/client';

export const GET: APIRoute = async ({ cookies }) => {
  const authUser = await getUser(cookies);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, phone, role, created_at')
    .eq('auth_id', authUser.id)
    .single();

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, data: user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const authUser = await getUser(cookies);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { first_name, last_name, phone } = body;

  // Validate inputs
  if (first_name !== undefined && typeof first_name !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid first name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (last_name !== undefined && typeof last_name !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid last name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (phone !== undefined && typeof phone !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build update object with only provided fields
  const updateData: Record<string, string | null> = {};
  if (first_name !== undefined) updateData.first_name = first_name.trim() || null;
  if (last_name !== undefined) updateData.last_name = last_name.trim() || null;
  if (phone !== undefined) updateData.phone = phone.trim() || null;

  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('auth_id', authUser.id)
    .select('id, email, first_name, last_name, phone, role, created_at')
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, data: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
