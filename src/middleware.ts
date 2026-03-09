/**
 * GPS Dental Training - Middleware
 * Handles authentication with Supabase Auth and route protection
 */
import { defineMiddleware } from 'astro:middleware';
import { getUser } from './lib/supabase/auth';
import { supabaseAdmin } from './lib/supabase/client';

// Route matchers
function isProtectedRoute(url: URL): boolean {
  const path = url.pathname;
  return path.startsWith('/account') || path.startsWith('/checkout') || path.startsWith('/api/user');
}

function isAdminRoute(url: URL): boolean {
  const path = url.pathname;
  return path.startsWith('/admin') || path.startsWith('/api/admin');
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Get authenticated user from Supabase session cookies
  const user = await getUser(context.cookies);
  const userId = user?.id || null;
  const userEmail = user?.email || null;

  // Store auth info in locals for pages to use
  context.locals.userId = userId;
  context.locals.userEmail = userEmail;

  const url = new URL(context.request.url);

  // Protect routes that require authentication
  if (isProtectedRoute(url) && !userId) {
    return context.redirect(`/sign-in?redirect_url=${url.pathname}`);
  }

  // Protect admin routes
  if (isAdminRoute(url)) {
    if (!userId) {
      return context.redirect(`/sign-in?redirect_url=${url.pathname}`);
    }

    // In development mode, allow access if user is authenticated
    const isDev = import.meta.env.DEV;

    if (!isDev) {
      // In production, verify admin role from database
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('auth_id', userId)
        .single();

      const userRole = userData?.role;
      if (userRole !== 'admin' && userRole !== 'staff') {
        return context.redirect('/');
      }
    }
  }

  return next();
});
