/**
 * Forgot Password API Route
 * Sends password reset email via Supabase Auth
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.SITE_URL || 'http://localhost:4325'}/reset-password`,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Always return success to prevent email enumeration
  return new Response(
    JSON.stringify({ message: 'If an account exists with that email, a reset link has been sent.' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
