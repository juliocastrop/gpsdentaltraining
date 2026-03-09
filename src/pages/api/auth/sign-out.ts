/**
 * Sign Out API Route
 * Clears session cookies
 */
import type { APIRoute } from 'astro';
import { clearAuthCookies } from '../../../lib/supabase/auth';

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);

  return new Response(null, {
    status: 302,
    headers: { Location: '/sign-in' },
  });
};
