/**
 * Supabase Client Configuration
 *
 * This file exports two clients:
 * - supabase: For client-side operations (uses anon key, respects RLS)
 * - supabaseAdmin: For server-side operations (uses service role key, bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client
 * Uses anon key - respects Row Level Security (RLS)
 * Safe to use in browser
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Server-side Supabase client (Admin)
 * Uses service role key - bypasses RLS
 * ONLY use in server-side code (API routes, server functions)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Export URL for direct usage
export { supabaseUrl };
