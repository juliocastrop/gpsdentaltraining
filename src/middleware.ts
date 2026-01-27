/**
 * GPS Dental Training - Middleware
 * Handles authentication with Clerk and route protection
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/checkout(.*)',
  '/api/user(.*)',
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId, sessionClaims } = auth();

  // Protect routes that require authentication
  if (isProtectedRoute(context.request) && !userId) {
    return auth().redirectToSignIn();
  }

  // Protect admin routes - check for admin role in public metadata
  if (isAdminRoute(context.request)) {
    // In development mode, allow access if user is authenticated
    const isDev = import.meta.env.DEV;

    if (!userId) {
      return auth().redirectToSignIn();
    }

    // In production, verify admin role
    if (!isDev) {
      // Check if user has admin role in their metadata
      const metadata = (sessionClaims?.publicMetadata || sessionClaims?.public_metadata || {}) as { role?: string };
      const userRole = metadata?.role;

      if (userRole !== 'admin' && userRole !== 'staff') {
        // Redirect to home if not an admin
        return new Response(null, {
          status: 302,
          headers: { Location: '/' },
        });
      }
    }
  }
});
