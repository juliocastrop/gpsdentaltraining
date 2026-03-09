/**
 * Sign In API Route
 * Authenticates user with Supabase Auth and sets session cookies
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '../../../lib/supabase/auth';
import { supabaseAdmin } from '../../../lib/supabase/client';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set session cookies
  setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);

  // Look up user role for redirect
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('auth_id', data.user.id)
    .single();

  const role = userData?.role || 'user';

  return new Response(JSON.stringify({
    user: { id: data.user.id, email: data.user.email },
    role,
    redirectUrl: role === 'admin' ? '/admin' : '/account',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
