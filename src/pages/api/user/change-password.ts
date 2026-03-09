/**
 * Change Password API
 * POST - Change the current user's password
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '../../../lib/supabase/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const authUser = await getUser(cookies);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return new Response(JSON.stringify({ error: 'Current password and new password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (new_password.length < 6) {
    return new Response(JSON.stringify({ error: 'New password must be at least 6 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (current_password === new_password) {
    return new Response(JSON.stringify({ error: 'New password must be different from current password' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify current password by attempting sign-in
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: current_password,
  });

  if (signInError) {
    return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update password using admin client
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: updateError } = await adminClient.auth.admin.updateUserById(authUser.id, {
    password: new_password,
  });

  if (updateError) {
    console.error('Error updating password:', updateError);
    return new Response(JSON.stringify({ error: 'Failed to update password. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
