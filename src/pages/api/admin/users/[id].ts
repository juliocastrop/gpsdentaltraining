/**
 * Admin User Detail API
 * GET - Get user details with activity summary
 * PUT - Update user (role, profile info)
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get activity counts
  const [orders, tickets, certificates, seminars, credits] = await Promise.all([
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabaseAdmin.from('tickets').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabaseAdmin.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabaseAdmin.from('seminar_registrations').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabaseAdmin.from('ce_ledger').select('credits').eq('user_id', id).eq('transaction_type', 'earned'),
  ]);

  const totalCredits = credits.data?.reduce((sum, c) => sum + (c.credits || 0), 0) || 0;

  return new Response(JSON.stringify({
    success: true,
    data: {
      ...user,
      activity: {
        orders: orders.count || 0,
        tickets: tickets.count || 0,
        certificates: certificates.count || 0,
        seminar_registrations: seminars.count || 0,
        total_credits: totalCredits,
      },
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { role, first_name, last_name, phone } = body;

  // Validate role
  const validRoles = ['customer', 'admin', 'staff'];
  if (role && !validRoles.includes(role)) {
    return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updateData: Record<string, string | null> = {};
  if (role !== undefined) updateData.role = role;
  if (first_name !== undefined) updateData.first_name = first_name?.trim() || null;
  if (last_name !== undefined) updateData.last_name = last_name?.trim() || null;
  if (phone !== undefined) updateData.phone = phone?.trim() || null;

  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, data: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
