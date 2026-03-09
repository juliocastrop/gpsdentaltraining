/**
 * Sign Up API Route
 * Creates a new user with Supabase Auth and syncs to users table
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabase/client';
import { setAuthCookies } from '../../../lib/supabase/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password, firstName, lastName } = await request.json();

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName || null,
        last_name: lastName || null,
      },
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!data.user) {
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sync user to our users table
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    // Update existing user (e.g., guest who had orders) with auth_id
    await supabaseAdmin
      .from('users')
      .update({
        auth_id: data.user.id,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);
  } else {
    // Create new user record
    await supabaseAdmin.from('users').insert({
      auth_id: data.user.id,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      role: 'customer',
    });
  }

  // Link any guest orders
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', data.user.id)
    .single();

  if (userRecord) {
    const { data: linkedOrders } = await supabaseAdmin
      .from('orders')
      .update({ user_id: userRecord.id })
      .eq('billing_email', email)
      .is('user_id', null)
      .select('id');

    if (linkedOrders && linkedOrders.length > 0) {
      for (const order of linkedOrders) {
        await supabaseAdmin
          .from('tickets')
          .update({ user_id: userRecord.id })
          .eq('order_id', order.id)
          .is('user_id', null);
      }
    }
  }

  // Set session cookies if we have a session (email confirmation might be required)
  if (data.session) {
    setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
  }

  return new Response(
    JSON.stringify({
      user: { id: data.user.id, email: data.user.email },
      confirmEmail: !data.session, // true if email confirmation is required
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
