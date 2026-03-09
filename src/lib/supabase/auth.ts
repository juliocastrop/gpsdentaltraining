/**
 * Supabase Auth Utilities
 * Server-side authentication helpers for GPS Dental Training
 */

import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

/**
 * Cookie options for auth tokens
 */
const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Create a Supabase client with the user's session from cookies
 */
export function createSupabaseClient(cookies: AstroCookies) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const accessToken = cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && refreshToken) {
    client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }

  return client;
}

/**
 * Get the current authenticated user from cookies
 * Returns null if not authenticated
 */
export async function getUser(cookies: AstroCookies) {
  const accessToken = cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    // Session invalid — clear cookies
    clearAuthCookies(cookies);
    return null;
  }

  // If the token was refreshed, update the cookies
  if (data.session.access_token !== accessToken) {
    setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
  }

  return data.user;
}

/**
 * Set auth cookies after sign-in or token refresh
 */
export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string) {
  cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
  cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
}

/**
 * Clear auth cookies on sign-out
 */
export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
  cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
}
