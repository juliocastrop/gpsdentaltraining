/**
 * Admin Users API
 * GET - List all users with filters, search, and pagination
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async ({ url }) => {
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '25');
  const sortBy = url.searchParams.get('sort') || 'created_at';
  const sortOrder = url.searchParams.get('order') === 'asc' ? true : false;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone,
      role,
      auth_id,
      created_at,
      updated_at
    `, { count: 'exact' });

  // Search by name or email
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  // Filter by role
  if (role) {
    query = query.eq('role', role);
  }

  // Sort and paginate
  query = query
    .order(sortBy, { ascending: sortOrder })
    .range(offset, offset + limit - 1);

  const { data: users, count, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get stats
  const { count: totalUsers } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: adminCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  const { count: staffCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'staff');

  return new Response(JSON.stringify({
    success: true,
    data: users || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    stats: {
      total: totalUsers || 0,
      admins: adminCount || 0,
      staff: staffCount || 0,
      customers: (totalUsers || 0) - (adminCount || 0) - (staffCount || 0),
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
